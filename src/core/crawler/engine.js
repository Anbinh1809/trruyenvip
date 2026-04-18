import * as cheerio from 'cheerio';
import { query, withTransaction, bulkInsert, loadSystemState } from '../database/connection.js';
import { fetchWithRetry } from './index.js';
import { safeJoinUrl, parseChapterNumber, normalizeTitle } from './utils.js';
import { updateTelemetry, logGuardianEvent, updateMirrorHealth } from './telemetry.js';
import * as parsers from './parsers.js';
import { SOURCES } from './mirrors.js';

let activeWorkers = 0;
const BASE_CONCURRENCY = 10;
const inProgressManga = new Map();
const inProgressChapters = new Map();

export async function waitForWorkers(timeoutMs = 60000) {
    const start = Date.now();
    while (activeWorkers > 0 && Date.now() - start < timeoutMs) {
        process.stdout.write(`\r[Titan:Drain] Waiting for ${activeWorkers} workers...`);
        await new Promise(r => setTimeout(r, 500));
    }
    process.stdout.write('\n');
}

// Halve concurrency during Vietnam peak hours (18:00–00:00 VNT)
function getConcurrentLimit() {
    const vntHour = (new Date().getUTCHours() + 7) % 24;
    return vntHour >= 18 ? Math.floor(BASE_CONCURRENCY / 2) : BASE_CONCURRENCY;
}

// Self-healing: prune stale in-progress locks and salvage failed tasks
setInterval(async () => {
    const TIMEOUT = 1000 * 60 * 30;
    const now = Date.now();
    for (const [id, time] of inProgressManga) if (now - time > TIMEOUT) inProgressManga.delete(id);
    for (const [id, time] of inProgressChapters) if (now - time > TIMEOUT) inProgressChapters.delete(id);

    try {
        await query(`
            UPDATE crawlertasks 
            SET status = 'pending', priority = 8, attempts = 0, updated_at = NOW()
            WHERE status = 'failed' AND updated_at < NOW() - INTERVAL '3 hours'
        `);
        await query("DELETE FROM crawllogs WHERE created_at < NOW() - INTERVAL '24 hours'");
    } catch (e) {
        console.error('[Rescue:Error]', e.message);
    }
}, 1000 * 60 * 60 * 3);

// Weight = resource cost per task type
const TASK_WEIGHTS = { 'system_discovery': 10, 'manga_sync': 5, 'chapter_scrape': 1 };

global.discoveryPage = global.discoveryPage || 1;
global.isArchivalPulse = global.isArchivalPulse || false;

async function executeTask(taskRow) {
    const weight = TASK_WEIGHTS[taskRow.type] || 1;
    activeWorkers += weight;
    
    let payload;
    try {
        payload = JSON.parse(taskRow.target);
    } catch {
        await query("UPDATE crawlertasks SET status = 'failed', last_error = 'MALFORMED_JSON' WHERE id = @id", { id: taskRow.id });
        activeWorkers -= weight;
        return;
    }
    
    try {
        const source = payload.source || 'nettruyen';
        switch (taskRow.type) {
            case 'chapter_scrape': {
                const { chapId, url, force } = payload;
                const r = await query("SELECT c.title, m.title as m_title FROM chapters c JOIN manga m ON c.manga_id = m.id WHERE c.id = @chapId LIMIT 1", { chapId });
                const t = r.recordset?.[0];
                updateTelemetry({ status: 'scraping_images', currentManga: t?.m_title || chapId.split('_')[0], currentChapter: t?.title || chapId });
                await crawlChapterImages(chapId, url, source, force);
                break;
            }
            case 'manga_sync': {
                const { mangaId, url, earlyExit } = payload;
                const r = await query("SELECT title FROM manga WHERE id = @mangaId LIMIT 1", { mangaId });
                updateTelemetry({ status: 'manga_sync', currentManga: r.recordset?.[0]?.title || mangaId, currentChapter: 'Full Metadata' });
                await crawlFullMangaChapters(mangaId, url, source, earlyExit);
                break;
            }
            case 'system_discovery': {
                const { pageCount, startPage } = payload;
                updateTelemetry({ status: 'discovery', currentManga: `Global: ${source}`, currentChapter: `Page ${startPage}..${startPage + pageCount - 1}` });
                await crawlLatest(source, pageCount, startPage);
                break;
            }
        }
        await query("UPDATE crawlertasks SET status = 'completed', updated_at = NOW() WHERE id = @id", { id: taskRow.id });
    } catch (e) {
        await query(`
            UPDATE crawlertasks 
            SET status = CASE WHEN attempts >= 3 THEN 'failed' ELSE 'pending' END, 
                attempts = attempts + 1, last_error = @err, updated_at = NOW() 
            WHERE id = @id
        `, { id: taskRow.id, err: e.message });
    } finally {
        activeWorkers -= weight;
        updateTelemetry({ activeWorkers });
        if (!global.isOneShotExitRequested || activeWorkers > 0) setTimeout(processQueue, 10);
    }
}

export async function processQueue() {
    const limit = getConcurrentLimit();
    activeWorkers = Math.max(0, activeWorkers);
    if (activeWorkers >= limit) return;

    const needed = Math.max(1, limit - activeWorkers);
    const pickRes = await query(`
        WITH favorite_counts AS (
            SELECT manga_id, COUNT(*) as fav_count FROM favorites GROUP BY manga_id
        ),
        selected_tasks AS (
            SELECT t.id FROM crawlertasks t
            LEFT JOIN favorite_counts f ON t.manga_id = f.manga_id
            WHERE t.status = 'pending'
            ORDER BY (t.priority + COALESCE(f.fav_count, 0) * 3) DESC, t.created_at ASC
            LIMIT @needed FOR UPDATE SKIP LOCKED
        )
        UPDATE crawlertasks SET status = 'processing', updated_at = NOW()
        FROM selected_tasks WHERE crawlertasks.id = selected_tasks.id
        RETURNING crawlertasks.id, crawlertasks.type, crawlertasks.target;
    `, { needed });

    const tasks = pickRes.recordset || [];
    updateTelemetry({ activeWorkers, concurrencyLimit: limit, loadFactor: Math.round((activeWorkers / limit) * 100), status: tasks.length > 0 ? undefined : 'idle' });

    if (tasks.length === 0) {
        if (!global.isOneShotExitRequested) setTimeout(processQueue, 500);
        return;
    }
    tasks.forEach(task => executeTask(task).catch(() => {}));
}

function stringifySorted(obj) {
    return JSON.stringify(Object.keys(obj).sort().reduce((acc, k) => ({ ...acc, [k]: obj[k] }), {}));
}

export async function queueMangaSync(mangaId, url, source, earlyExit = false, priority = 5, force = false) {
    if (!force) {
        const res = await query("SELECT last_crawled FROM manga WHERE id = @mangaId AND last_crawled > NOW() - INTERVAL '6 hours'", { mangaId });
        if (res.rowCount > 0) return;
    }
    const target = stringifySorted({ mangaId, url, source, earlyExit });
    await query(`
        INSERT INTO crawlertasks (type, target, priority, manga_id) 
        VALUES ('manga_sync', @target, @priority, @mangaId)
        ON CONFLICT (target) DO UPDATE SET 
            priority = GREATEST(crawlertasks.priority, @priority),
            status = CASE WHEN crawlertasks.status = 'failed' THEN 'pending' ELSE crawlertasks.status END
        WHERE crawlertasks.status = 'pending' OR crawlertasks.status = 'failed'
    `, { target, priority, mangaId });
    processQueue();
}

export async function queueDiscovery(source, pageCount = 3, startPage = 1, priority = 3) {
    const target = stringifySorted({ source, pageCount, startPage });
    const mangaId = `system_discovery_${source}`;
    await query(`
        INSERT INTO crawlertasks (type, target, priority, manga_id) 
        VALUES ('system_discovery', @target, @priority, @mangaId)
        ON CONFLICT (target) DO UPDATE SET priority = GREATEST(crawlertasks.priority, @priority)
        WHERE crawlertasks.status = 'pending'
    `, { target, priority, mangaId });
    processQueue();
}

export async function ingestMangaBySlug(slug, source = 'nettruyen') {
    const url = source === 'nettruyen'
        ? safeJoinUrl(SOURCES.NETTRUYEN, `/truyen-tranh/${slug}`)
        : safeJoinUrl(SOURCES.TRUYENQQ, `/truyen-tranh/${slug}.html`);

    await query(`INSERT INTO manga (id, title, status, normalized_title) VALUES (@slug, @slug, 'Chờ đồng bộ', @slug) ON CONFLICT (id) DO NOTHING`, { slug });
    await queueMangaSync(slug, url, source, false, 10);
    return slug;
}

export async function crawlFullMangaChapters(mangaId, url, source, earlyExit = false) {
    if (inProgressManga.has(mangaId)) return;
    inProgressManga.set(mangaId, Date.now());

    try {
        const response = await fetchWithRetry(url, { isDiscovery: true });
        updateMirrorHealth(new URL(url).hostname, true);
        
        const html = response.data;
        const metadata = source === 'nettruyen' ? parsers.parseNetTruyenManga(html, url) : parsers.parseTruyenQQManga(html, url);
        const normalizedTitle = normalizeTitle(metadata.title || mangaId);

        await query(`
            UPDATE manga SET title = @title, author = @author, status = @status, description = @description, normalized_title = @normalizedTitle
            WHERE id = @mangaId
        `, { mangaId, title: metadata.title || mangaId, author: metadata.author || 'Đang cập nhật', status: metadata.status || 'Đang cập nhật', description: metadata.description || 'Nội dung đang được cập nhật.', normalizedTitle });

        const $ = cheerio.load(html);
        const chapterRows = source === 'nettruyen' ? $('.list-chapter li').toArray() : $('.list01 li').toArray();
        const existingIds = new Set();
        const existingUrls = new Set();

        (await query("SELECT id, source_url FROM chapters WHERE manga_id = @mangaId", { mangaId })).recordset
            .forEach(r => { existingIds.add(r.id); existingUrls.add(r.source_url); });

        // Process in chunks of 5 for DB and mirror stability
        for (let i = 0; i < chapterRows.length; i += 5) {
            await Promise.all(chapterRows.slice(i, i + 5).map(async (el) => {
                try {
                    const a = $(el).is('a') ? $(el) : $(el).find('a').first();
                    let chapUrl = a.attr('href');
                    if (!chapUrl) return;
                    if (chapUrl.startsWith('/')) chapUrl = safeJoinUrl(source === 'nettruyen' ? SOURCES.NETTRUYEN : SOURCES.TRUYENQQ, chapUrl);

                    const chapTitle = a.text().trim() || $(el).find('.chapter-name').text().trim();
                    const chapSlug = chapUrl.split('/').pop()?.split('?')[0];
                    const chapId = `${mangaId}_${chapSlug}`;
                    if (existingIds.has(chapId) || existingUrls.has(chapUrl)) return;

                    await query(`INSERT INTO chapters (id, manga_id, title, source_url, chapter_number) VALUES (@chapId, @mangaId, @title, @url, @chapNum) ON CONFLICT (id) DO NOTHING`,
                        { chapId, mangaId, title: chapTitle, url: chapUrl, chapNum: parseChapterNumber(chapTitle) });

                    triggerChapterNotifications(mangaId, chapTitle, chapId).catch(() => {});
                    queueChapterScrape(chapId, chapUrl, source).catch(() => {});
                } catch {}
            }));
        }

        await query('UPDATE manga SET last_crawled = NOW() WHERE id = @mangaId', { mangaId });
    } catch (err) {
        try { updateMirrorHealth(new URL(url).hostname, false, err.message); } catch {}
    } finally {
        inProgressManga.delete(mangaId);
    }
}

export async function triggerChapterNotifications(mangaId, chapTitle, chapId) {
    try {
        const mangaRes = await query('SELECT title FROM manga WHERE id = @mangaId LIMIT 1', { mangaId });
        const mangaTitle = mangaRes.recordset?.[0]?.title || 'Truyện';
        const subscribers = await query('SELECT user_uuid FROM favorites WHERE manga_id = @mangaId', { mangaId });
        if (!subscribers.recordset.length) return;

        await bulkInsert('notifications', subscribers.recordset.map(sub => ({
            user_uuid: sub.user_uuid,
            type: 'new_chapter',
            title: mangaTitle,
            message: `Chương mới: ${chapTitle}`,
            link: `/manga/${mangaId}/chapter/${chapId}`,
            manga_id: mangaId
        })));
    } catch {}
}

export async function crawlLatest(source = 'nettruyen', pageCount = 1, startPage = 1) {
    const base = source === 'nettruyen' ? SOURCES.NETTRUYEN : SOURCES.TRUYENQQ;
    let newMangaCount = 0;
    
    for (let p = startPage; p < startPage + pageCount; p++) {
        try {
            const url = source === 'nettruyen' ? `${base}?page=${p}` : `${base}/latest-updates?page=${p}`;
            const response = await fetchWithRetry(url, { isDiscovery: true });
            const $ = cheerio.load(response.data);
            
            const mangaLinks = source === 'nettruyen' ? $('.items .item .image a').toArray() : $('.book_item .book_avatar a').toArray();
                
            for (const link of mangaLinks) {
                let mangaUrl = $(link).attr('href');
                if (!mangaUrl) continue;
                if (mangaUrl.startsWith('/')) mangaUrl = safeJoinUrl(base, mangaUrl);
                
                const rawSlug = mangaUrl.split('/').pop()?.split('?')[0];
                const title = $(link).attr('title') || $(link).find('img').attr('alt') || rawSlug;
                const normalizedTitle = title.toLowerCase()
                    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                    .replace(/[đĐ]/g, 'd').replace(/[^a-z0-9]/g, '-')
                    .replace(/-+/g, '-').replace(/^-|-$/g, '');

                const existing = await query("SELECT id FROM manga WHERE normalized_title = @normalizedTitle OR id = @rawSlug LIMIT 1", { normalizedTitle, rawSlug });
                let slug = rawSlug;
                if (existing.recordset?.length > 0) {
                    slug = existing.recordset[0].id;
                } else {
                    await query(`INSERT INTO manga (id, title, source_url, normalized_title) VALUES (@slug, @title, @mangaUrl, @normalizedTitle) ON CONFLICT (id) DO NOTHING`,
                        { slug, title, mangaUrl, normalizedTitle });
                    newMangaCount++;
                }
                await queueMangaSync(slug, mangaUrl, source, true, 4);
            }
        } catch (e) {
            try { updateMirrorHealth(new URL(base).hostname, false, e.message); } catch {}
        }
    }
    updateTelemetry({ syncHealth: true });
    return newMangaCount;
}

export async function crawlChapterImages(chapId, url, source = 'nettruyen', force = false) {
    if (inProgressChapters.has(chapId)) return;
    inProgressChapters.set(chapId, Date.now());

    try {
        if (!force) {
            const existing = await query('SELECT COUNT(*) as count FROM chapterimages WHERE chapter_id = @chapId', { chapId });
            if ((existing.recordset?.[0]?.count || 0) > 0) return existing.recordset[0].count;
        }

        updateTelemetry({ status: 'scraping_images' });
        const response = await fetchWithRetry(url);
        const images = parsers.parseChapterImages(response.data, source, url);
        if (images.length === 0) throw new Error('ZERO_IMAGES_FOUND');

        await withTransaction(async (tx) => {
            if (force) await query("DELETE FROM chapterimages WHERE chapter_id = @chapId", { chapId }, tx);
            await bulkInsert('chapterimages', images.map((img, i) => ({ chapter_id: chapId, image_url: img, order: i })), tx);
            await query("UPDATE chapters SET updated_at = NOW(), status = 'active', fail_count = 0 WHERE id = @chapId", { chapId }, tx);
        });

        updateTelemetry({ successCount: 1, imagesFound: images.length });
        return images.length;
    } catch (err) {
        updateTelemetry({ failCount: 1 });
        // Mark ghost after 5 consecutive failures
        query(`UPDATE chapters SET fail_count = fail_count + 1, status = CASE WHEN fail_count + 1 >= 5 THEN 'ghost' ELSE 'failed' END, updated_at = NOW() WHERE id = @chapId`, { chapId }).catch(() => {});
        return 0;
    } finally {
        inProgressChapters.delete(chapId);
    }
}

export async function queueChapterScrape(chapId, url, source, force = false, priority = 1) {
    const target = stringifySorted({ chapId, url, source, force });
    await query(`
        INSERT INTO crawlertasks (type, target, priority, manga_id) 
        SELECT 'chapter_scrape', @target, @priority, manga_id FROM chapters WHERE id = @chapId
        ON CONFLICT (target) DO UPDATE SET 
            priority = GREATEST(crawlertasks.priority, @priority),
            status = CASE WHEN crawlertasks.status = 'failed' THEN 'pending' ELSE crawlertasks.status END
    `, { target, priority, chapId });
    processQueue();
}

export async function runGuardianAutopilot(oneShot = false) {
    if (global.guardianActive && !oneShot) return;
    global.guardianActive = true;

    // Restore crawler state from DB for continuity across restarts
    const state = await loadSystemState('crawler_state');
    if (state) {
        if (state.discoveryPage) global.discoveryPage = state.discoveryPage;
        if (state.isArchivalPulse !== undefined) global.isArchivalPulse = state.isArchivalPulse;
        if (state.mirrorScores) global.mirrorScores = { ...global.mirrorScores, ...state.mirrorScores };
    }

    let nothingNewStreak = 0;
    while (true) {
        try {
            const currentLimit = getConcurrentLimit();
            updateTelemetry({ status: 'guardian_discovery', discoveryPage: global.discoveryPage % 500 + 1, isArchivalPulse: global.isArchivalPulse, activeWorkers, concurrencyLimit: currentLimit });
            
            let newFound = 0;
            for (const source of ['nettruyen', 'truyenqq']) {
                if (!global.isArchivalPulse) {
                    newFound += await crawlLatest(source, 3);
                } else {
                    newFound += await crawlLatest(source, 2, global.discoveryPage % 500 + 1);
                }
            }

            global.isArchivalPulse = !global.isArchivalPulse;
            if (global.isArchivalPulse) global.discoveryPage += 2;

            nothingNewStreak = newFound === 0 ? Math.min(nothingNewStreak + 1, 9) : 0;

            await rescueBrokenImages(50);
            await healChapterGaps(30);

            // Adaptive backoff: 60s–600s to prevent mirror bans
            const waitTime = Math.max(10000, 60000 * (nothingNewStreak + 1));
            if (global.discoveryPage % 10 === 0) updateTelemetry({ syncHealth: true });

            if (oneShot) {
                updateTelemetry({ syncHealth: true });
                return;
            }
            await new Promise(r => setTimeout(r, waitTime));
        } catch (e) {
            console.error('[Guardian] Engine Stalled:', e.message);
            await new Promise(r => setTimeout(r, 60000));
        }
    }
}

export async function healChapterGaps(batchSize = 20) {
    const res = await query(`SELECT id, source_url FROM manga WHERE last_crawled < NOW() - INTERVAL '6 hours' ORDER BY last_crawled ASC LIMIT @batchSize`, { batchSize });
    for (const m of res.recordset) {
        if (!m.source_url) continue;
        queueMangaSync(m.id, m.source_url, m.source_url.includes('truyenqq') ? 'truyenqq' : 'nettruyen', true, 2);
    }
}

export async function rescueBrokenImages(batchSize = 10) {
    const res = await query(`
        SELECT c.id, c.source_url, m.source_url as manga_url FROM chapters c
        JOIN manga m ON c.manga_id = m.id
        LEFT JOIN chapterimages ci ON c.id = ci.chapter_id
        WHERE ci.id IS NULL AND c.updated_at < NOW() - INTERVAL '2 minutes'
        LIMIT @batchSize
    `, { batchSize });
    for (const c of res.recordset) {
        if (!c.source_url || !c.manga_url) continue;
        queueChapterScrape(c.id, c.source_url, c.manga_url.includes('truyenqq') ? 'truyenqq' : 'nettruyen', true, 2);
    }
}

export async function bootstrapCrawler() {
    inProgressManga.clear();
    inProgressChapters.clear();
    await query("UPDATE crawlertasks SET status = 'pending', updated_at = NOW() WHERE status = 'processing' AND updated_at < NOW() - INTERVAL '2 hours'");
    processQueue();
}

export async function runTitanWorker(oneShot = true) {
    if (oneShot) global.isOneShotExitRequested = true;
    await bootstrapCrawler();
    if (oneShot) {
        await runGuardianAutopilot(true);
        await waitForWorkers();
    } else {
        runGuardianAutopilot().catch(e => console.error('[Titan] Autopilot failure:', e.message));
    }
}


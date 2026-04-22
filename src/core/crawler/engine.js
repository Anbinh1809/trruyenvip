import * as cheerio from 'cheerio';
import { query, withTransaction, bulkInsert, loadSystemState } from '../database/connection.js';
import { fetchWithRetry } from './index.js';
import { safeJoinUrl, parseChapterNumber, normalizeTitle } from './utils.js';
import { updateTelemetry, logGuardianEvent, updateMirrorHealth } from './telemetry.js';
import * as parsers from './parsers.js';
import { SOURCES } from './mirrors.js';

let activeWorkers = 0;
const BASE_CONCURRENCY = 15; // Balanced for 4GB RAM stability
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

// MAX SPEED: User requested high resource usage
function getConcurrentLimit() {
    return BASE_CONCURRENCY;
}

// Self-healing: prune stale in-progress locks and salvage failed tasks
// NOTE: Started lazily in bootstrapCrawler() to avoid side-effects on module import
let selfHealIntervalStarted = false;
function startSelfHealInterval() {
    if (selfHealIntervalStarted) return;
    selfHealIntervalStarted = true;
    setInterval(async () => {
        const TIMEOUT = 1000 * 60 * 30;
        const now = Date.now();
        for (const [id, time] of inProgressManga) if (now - time > TIMEOUT) inProgressManga.delete(id);
        for (const [id, time] of inProgressChapters) if (now - time > TIMEOUT) inProgressChapters.delete(id);
    
        try {
            await query(`
                UPDATE crawlertasks 
                SET status = 'pending', priority = 8, attempts = 0, updated_at = GETDATE()
                WHERE status = 'failed' AND updated_at < DATEADD(hour, -3, GETDATE())
            `);
            await query("DELETE FROM crawllogs WHERE created_at < DATEADD(hour, -24, GETDATE())");
        } catch (e) {
            console.error('[Rescue:Error]', e.message);
        }
    }, 1000 * 60 * 60 * 3);
}

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
                const r = await query("SELECT TOP(1) c.title, m.title as m_title FROM chapters c JOIN manga m ON c.manga_id = m.id WHERE c.id = @chapId", { chapId });
                const t = r.recordset?.[0];
                updateTelemetry({ status: 'scraping_images', currentManga: t?.m_title || chapId.split('_')[0], currentChapter: t?.title || chapId });
                await crawlChapterImages(chapId, url, source, force);
                break;
            }
            case 'manga_sync': {
                const { mangaId, url, earlyExit } = payload;
                const r = await query("SELECT TOP(1) title FROM manga WHERE id = @mangaId", { mangaId });
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
        await query("UPDATE crawlertasks SET status = 'completed', updated_at = GETDATE() WHERE id = @id", { id: taskRow.id });
    } catch (e) {
        await query(`
            UPDATE crawlertasks 
            SET status = CASE WHEN attempts >= 3 THEN 'failed' ELSE 'pending' END, 
                attempts = attempts + 1, last_error = @err, updated_at = GETDATE() 
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
    // N1 FIX: Use subquery with ORDER BY to ensure high-priority tasks are picked first
    // SQL Server UPDATE TOP doesn't guarantee order without this pattern
    const pickRes = await query(`
        UPDATE crawlertasks
        SET status = 'processing', updated_at = GETDATE()
        OUTPUT inserted.id, inserted.type, inserted.target
        WHERE id IN (
            SELECT TOP(@needed) id FROM crawlertasks WITH (UPDLOCK, READPAST)
            WHERE status = 'pending'
            ORDER BY priority DESC, created_at ASC
        )
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
        const res = await query("SELECT last_crawled FROM manga WHERE id = @mangaId AND last_crawled > DATEADD(hour, -6, GETDATE())", { mangaId });
        if (res.rowCount > 0) return;
    }
    const target = stringifySorted({ mangaId, url, source, earlyExit });
    await query(`
        MERGE crawlertasks AS target
        USING (SELECT @target AS t_target) AS source
        ON target.target = source.t_target
        WHEN MATCHED AND (target.status = 'pending' OR target.status = 'failed') THEN UPDATE SET 
            priority = CASE WHEN target.priority > @priority THEN target.priority ELSE @priority END,
            status = CASE WHEN target.status = 'failed' THEN 'pending' ELSE target.status END
        WHEN NOT MATCHED THEN INSERT (type, target, priority, manga_id) 
        VALUES ('manga_sync', @target, @priority, @mangaId);
    `, { target, priority, mangaId });
    processQueue().catch(e => console.error('[Queue] processQueue error:', e.message));
}

export async function queueDiscovery(source, pageCount = 3, startPage = 1, priority = 3) {
    const target = stringifySorted({ source, pageCount, startPage });
    const mangaId = `system_discovery_${source}`;
    await query(`
        MERGE crawlertasks AS target
        USING (SELECT @target AS t_target) AS source
        ON target.target = source.t_target
        WHEN MATCHED AND target.status = 'pending' THEN UPDATE SET 
            priority = CASE WHEN target.priority > @priority THEN target.priority ELSE @priority END
        WHEN NOT MATCHED THEN INSERT (type, target, priority, manga_id) 
        VALUES ('system_discovery', @target, @priority, @mangaId);
    `, { target, priority, mangaId });
    processQueue().catch(e => console.error('[Queue] processQueue error:', e.message));
}

export async function ingestMangaBySlug(slug, source = 'nettruyen') {
    const url = source === 'nettruyen'
        ? safeJoinUrl(SOURCES.NETTRUYEN, `/truyen-tranh/${slug}`)
        : safeJoinUrl(SOURCES.TRUYENQQ, `/truyen-tranh/${slug}.html`);

    await query(`
        IF NOT EXISTS (SELECT 1 FROM manga WHERE id = @slug)
        INSERT INTO manga (id, title, status, normalized_title) VALUES (@slug, @slug, N'Chờ đồng bộ', @slug)
    `, { slug });
    await queueMangaSync(slug, url, source, false, 10);
    return slug;
}

export async function crawlFullMangaChapters(mangaId, url, source, earlyExit = false) {
    if (inProgressManga.has(mangaId)) return;
    inProgressManga.set(mangaId, Date.now());

    try {
        const response = await fetchWithRetry(url, { isDiscovery: true });
        try { updateMirrorHealth(new URL(url).hostname, true); } catch (e) { console.warn('[Engine] Mirror health update failed:', e.message); }
        
        const html = response.data;
        const metadata = source === 'nettruyen' ? parsers.parseNetTruyenManga(html, url) : parsers.parseTruyenQQManga(html, url);
        const normalizedTitle = normalizeTitle(metadata.title || mangaId);

        await query(`
            UPDATE manga SET title = @title, cover = @cover, author = @author, status = @status, description = @description, normalized_title = @normalizedTitle
            WHERE id = @mangaId
        `, { mangaId, title: metadata.title || mangaId, cover: metadata.cover || null, author: metadata.author || 'Đang cập nhật', status: metadata.status || 'Đang cập nhật', description: metadata.description || 'Nội dung đang được cập nhật.', normalizedTitle });

        const $ = cheerio.load(html);
        const chapterRows = source === 'nettruyen' ? $('.list-chapter li').toArray() : $('.list01 li').toArray();
        if (chapterRows.length === 0) {
            throw new Error(`ZERO_CHAPTERS_FOUND: Parser found 0 chapters at ${url}`);
        }

        const existingIds = new Set();
        const existingUrls = new Set();

        (await query("SELECT id, source_url FROM chapters WHERE manga_id = @mangaId", { mangaId })).recordset
            .forEach(r => { existingIds.add(r.id); existingUrls.add(r.source_url); });

        let stopEarly = false;
        // Process in chunks of 5 for DB and mirror stability
        for (let i = 0; i < chapterRows.length; i += 5) {
            if (stopEarly) break;
            
            await Promise.all(chapterRows.slice(i, i + 5).map(async (el) => {
                if (stopEarly) return;
                try {
                    const a = $(el).is('a') ? $(el) : $(el).find('a').first();
                    let chapUrl = a.attr('href');
                    if (!chapUrl) return;
                    if (chapUrl.startsWith('/')) chapUrl = safeJoinUrl(source === 'nettruyen' ? SOURCES.NETTRUYEN : SOURCES.TRUYENQQ, chapUrl);

                    const chapTitle = a.text().trim() || $(el).find('.chapter-name').text().trim();
                    const chapSlug = chapUrl.split('/').pop()?.split('?')[0];
                    const chapId = `${mangaId}_${chapSlug}`;
                    
                    if (existingIds.has(chapId) || existingUrls.has(chapUrl)) {
                        if (earlyExit) stopEarly = true;
                        return;
                    }

                    await query(`
                        IF NOT EXISTS (SELECT 1 FROM chapters WHERE id = @chapId)
                        INSERT INTO chapters (id, manga_id, title, source_url, chapter_number) VALUES (@chapId, @mangaId, @title, @url, @chapNum)
                    `, { chapId, mangaId, title: chapTitle, url: chapUrl, chapNum: parseChapterNumber(chapTitle) });

                    triggerChapterNotifications(mangaId, chapTitle, chapId).catch(() => {});
                    queueChapterScrape(chapId, chapUrl, source).catch(() => {});
                } catch (e) { console.warn('[Engine] Chapter processing skipped:', e.message); }
            }));
        }

        await query(`
            UPDATE manga 
            SET last_crawled = GETDATE(), 
                last_chap_num = COALESCE((SELECT TOP(1) title FROM chapters WHERE manga_id = @mangaId ORDER BY chapter_number DESC, updated_at DESC), last_chap_num)
            WHERE id = @mangaId
        `, { mangaId });
    } catch (err) {
        console.log('[DEBUG ENGINE] Error in crawlFullMangaChapters:', err.message);
        try { updateMirrorHealth(new URL(url).hostname, false, err.message); } catch {}
        throw err;
    } finally {
        inProgressManga.delete(mangaId);
    }
}

export async function triggerChapterNotifications(mangaId, chapTitle, chapId) {
    try {
        const mangaRes = await query('SELECT TOP(1) title FROM manga WHERE id = @mangaId', { mangaId });
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
    } catch (e) { console.warn('[Engine] Notification trigger failed:', e.message); }
}

export async function crawlLatest(source = 'nettruyen', pageCount = 1, startPage = 1) {
    const base = source === 'nettruyen' ? SOURCES.NETTRUYEN : SOURCES.TRUYENQQ;
    let newMangaCount = 0;
    
    for (let p = startPage; p < startPage + pageCount; p++) {
        try {
            const baseUrl = base.endsWith('/') ? base.slice(0, -1) : base;
            const url = source === 'nettruyen' ? `${baseUrl}?page=${p}` : `${baseUrl}/truyen-moi-cap-nhat/trang-${p}`;
            const response = await fetchWithRetry(url, { isDiscovery: true });
            const $ = cheerio.load(response.data);
            
            const mangaLinks = source === 'nettruyen' ? $('.items .item .image a').toArray() : $('.book_item .book_avatar a').toArray();
            
            // BATCH: Collect all slugs first, then single DB lookup
            const candidates = [];
            for (const link of mangaLinks) {
                let mangaUrl = $(link).attr('href');
                if (!mangaUrl) continue;
                if (mangaUrl.startsWith('/')) mangaUrl = safeJoinUrl(base, mangaUrl);
                
                const rawSlug = mangaUrl.split('/').pop()?.split('?')[0];
                if (!rawSlug) continue;
                const title = $(link).attr('title') || $(link).find('img').attr('alt') || rawSlug;
                const cover = $(link).find('img').attr('data-original') || $(link).find('img').attr('src') || '';
                const normalizedTitle = title.toLowerCase()
                    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                    .replace(/[đĐ]/g, 'd').replace(/[^a-z0-9]/g, '-')
                    .replace(/-+/g, '-').replace(/^-|-$/g, '');
                candidates.push({ mangaUrl, rawSlug, title, cover, normalizedTitle });
            }

            if (candidates.length === 0) continue;

            // Single batch query instead of N queries
            const slugList = candidates.map(c => c.rawSlug);
            const normalizedList = candidates.map(c => c.normalizedTitle);
            const params = {};
            const slugParams = slugList.map((s, i) => { params[`s${i}`] = s; return `@s${i}`; });
            const normParams = normalizedList.map((s, i) => { params[`n${i}`] = s; return `@n${i}`; });
            const existingRes = await query(
                `SELECT id, normalized_title FROM manga WHERE id IN (${slugParams.join(',')}) OR normalized_title IN (${normParams.join(',')})`,
                params
            );
            const existingById = new Map();
            const existingByNorm = new Map();
            for (const r of (existingRes.recordset || [])) {
                existingById.set(r.id, r.id);
                if (r.normalized_title) existingByNorm.set(r.normalized_title, r.id);
            }

            for (const c of candidates) {
                const existingSlug = existingById.get(c.rawSlug) || existingByNorm.get(c.normalizedTitle);
                let slug = c.rawSlug;
                if (existingSlug) {
                    slug = existingSlug;
                } else {
                    await query(`
                        IF NOT EXISTS (SELECT 1 FROM manga WHERE id = @slug)
                        INSERT INTO manga (id, title, cover, source_url, normalized_title) VALUES (@slug, @title, @cover, @mangaUrl, @normalizedTitle)
                        ELSE
                        UPDATE manga SET source_url = @mangaUrl, updated_at = GETDATE() WHERE id = @slug AND source_url != @mangaUrl
                    `, { slug, title: c.title, cover: c.cover, mangaUrl: c.mangaUrl, normalizedTitle: c.normalizedTitle });
                    newMangaCount++;
                }
                await queueMangaSync(slug, c.mangaUrl, source, true, 4);
            }
        } catch (e) {
            try { updateMirrorHealth(new URL(base).hostname, false, e.message); } catch {}
            throw e;
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
            await query("UPDATE chapters SET updated_at = GETDATE(), status = 'active', fail_count = 0 WHERE id = @chapId", { chapId }, tx);
        });

        updateTelemetry({ successCount: 1, imagesFound: images.length });
        return images.length;
    } catch (err) {
        updateTelemetry({ failCount: 1 });
        // Mark ghost after 5 consecutive failures
        query(`UPDATE chapters SET fail_count = fail_count + 1, status = CASE WHEN fail_count + 1 >= 5 THEN 'ghost' ELSE 'failed' END, updated_at = GETDATE() WHERE id = @chapId`, { chapId }).catch(() => {});
        throw err;
    } finally {
        inProgressChapters.delete(chapId);
    }
}

export async function queueChapterScrape(chapId, url, source, force = false, priority = 1) {
    const target = stringifySorted({ chapId, url, source, force });
    await query(`
        MERGE crawlertasks AS target
        USING (SELECT 'chapter_scrape' as type, @target as target, @priority as priority, manga_id FROM chapters WHERE id = @chapId) AS source
        ON target.target = source.target
        WHEN MATCHED THEN UPDATE SET 
            priority = CASE WHEN target.priority > source.priority THEN target.priority ELSE source.priority END,
            status = CASE WHEN target.status = 'failed' THEN 'pending' ELSE target.status END
        WHEN NOT MATCHED THEN INSERT (type, target, priority, manga_id) 
        VALUES (source.type, source.target, source.priority, source.manga_id);
    `, { target, priority, chapId });
    processQueue().catch(e => console.error('[Queue] processQueue error:', e.message));
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
            
            // Fix #16: Kill switch — check before each iteration
            if (global.guardianShouldStop) {
                console.log('[Guardian] Kill switch triggered. Stopping autopilot loop.');
                global.guardianActive = false;
                global.guardianShouldStop = false;
                return;
            }
            
            let newFound = 0;
            for (const source of ['nettruyen', 'truyenqq']) {
                try {
                    if (!global.isArchivalPulse) {
                        newFound += await crawlLatest(source, 3);
                    } else {
                        newFound += await crawlLatest(source, 2, global.discoveryPage % 500 + 1);
                    }
                } catch (sourceError) {
                    console.warn(`[Guardian] Source '${source}' discovery stalled: ${sourceError.message}`);
                }
            }

            global.isArchivalPulse = !global.isArchivalPulse;
            if (global.isArchivalPulse) global.discoveryPage += 2;

            nothingNewStreak = newFound === 0 ? Math.min(nothingNewStreak + 1, 9) : 0;

            await rescueBrokenImages(1000);
            await healChapterGaps(500);

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
            await new Promise(r => setTimeout(r, Math.floor(Math.random() * 200) + 100));
        }
    }
}

export async function healChapterGaps(batchSize = 20) {
    const res = await query(`SELECT TOP(@batchSize) id, source_url FROM manga WHERE last_crawled < DATEADD(hour, -6, GETDATE()) ORDER BY last_crawled ASC`, { batchSize });
    for (const m of res.recordset) {
        if (!m.source_url) continue;
        // Fix #8: Added await
        await queueMangaSync(m.id, m.source_url, m.source_url?.includes('truyenqq') ? 'truyenqq' : 'nettruyen', true, 2);
    }
}

export async function rescueBrokenImages(batchSize = 10) {
    const res = await query(`
        SELECT TOP(@batchSize) c.id, c.source_url, m.source_url as manga_url FROM chapters c
        JOIN manga m ON c.manga_id = m.id
        LEFT JOIN chapterimages ci ON c.id = ci.chapter_id
        WHERE ci.id IS NULL AND c.updated_at < DATEADD(minute, -2, GETDATE())
    `, { batchSize });
    for (const c of res.recordset) {
        if (!c.source_url || !c.manga_url) continue;
        // Fix #9: Added await
        await queueChapterScrape(c.id, c.source_url, c.manga_url?.includes('truyenqq') ? 'truyenqq' : 'nettruyen', true, 2);
    }
}

export async function bootstrapCrawler() {
    inProgressManga.clear();
    inProgressChapters.clear();
    startSelfHealInterval(); // Start self-heal only after explicit bootstrap
    await query("UPDATE crawlertasks SET status = 'pending', updated_at = GETDATE() WHERE status = 'processing' AND updated_at < DATEADD(hour, -2, GETDATE())");
    processQueue().catch(e => console.error('[Queue] processQueue error:', e.message));
}

export async function runTitanWorker(oneShot = true, mode = 'deep') {
    if (oneShot) global.isOneShotExitRequested = true;
    await bootstrapCrawler();

    if (oneShot) {
        if (mode === 'light') {
            // LIGHT PULSE: Only crawl latest chapters from each source (fast, ~3 min)
            console.log('[Titan] Light pulse: crawling latest chapters only.');
            for (const source of ['nettruyen', 'truyenqq']) {
                try { await crawlLatest(source, 3); } catch (e) {
                    console.warn(`[Titan:Light] ${source} failed: ${e.message}`);
                }
            }
            await waitForWorkers(180000); // wait up to 3 min for images to queue
        } else {
            // DEEP ARCHIVAL: Full autopilot with gap healing and image rescue (~7.5 min)
            console.log('[Titan] Deep archival: running full autopilot.');
            await runGuardianAutopilot(true);
            await waitForWorkers(450000); // wait up to 7.5 min
        }
        updateTelemetry({ syncHealth: true });
    } else {
        runGuardianAutopilot().catch(e => console.error('[Titan] Autopilot failure:', e.message));
    }
}


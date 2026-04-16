import * as cheerio from 'cheerio';
import { query, withTransaction, bulkInsert, loadSystemState } from '../db.js';
import { fetchWithRetry } from './index.js';
import { safeJoinUrl, parseChapterNumber, normalizeTitle, cleanTitleForSearch } from './utils.js';
import { updateTelemetry, logGuardianEvent, updateMirrorHealth } from './telemetry.js';
import * as parsers from './parsers.js';
import { SOURCES } from './mirrors.js';

// Concurrency State
let activeWorkers = 0;
const BASE_CONCURRENCY = 128; // TITAN-GRADE: Process over 100 chapters in parallel
const inProgressManga = new Map(); // mangaId -> timestamp
const inProgressChapters = new Map(); // chapId -> timestamp
 
/**
 * TITAN WORKER DRAIN: Waits for background workers to finish
 */
export async function waitForWorkers(timeoutMs = 60000) {
    const start = Date.now();
    while (activeWorkers > 0 && Date.now() - start < timeoutMs) {
        process.stdout.write(`\r[Titan:Drain] Waiting for ${activeWorkers} units of work to complete...`);
        await new Promise(r => setTimeout(r, 500));
    }
    process.stdout.write('\n');
}


/**
 * TITAN PEAK-AWARE CONCURRENCY
 * Automatically halves crawler intensity during Vietnam peak reading hours (18:00 - 00:00 VNT).
 */
function getConcurrentLimit() {
    const vntOffset = 7;
    const now = new Date();
    const vntHour = (now.getUTCHours() + vntOffset) % 24;
    
    const isPeak = vntHour >= 18 || vntHour < 0; // 6 PM to Mid-night
    return isPeak ? Math.floor(BASE_CONCURRENCY / 2) : BASE_CONCURRENCY;
}

// PRUNING & RESCUE SERVICE: Self-healing architecture
setInterval(async () => {
    const now = Date.now();
    const TIMEOUT = 1000 * 60 * 30; // 30 minutes
    for (const [id, time] of inProgressManga.entries()) {
        if (now - time > TIMEOUT) inProgressManga.delete(id);
    }
    for (const [id, time] of inProgressChapters.entries()) {
        if (now - time > TIMEOUT) inProgressChapters.delete(id);
    }

    // TITAN RESCUE: Auto-reset failed tasks during off-peak windows
    try {
        // 1. Salvage failed tasks
        const failedCountRes = await query("SELECT COUNT(*) as count FROM crawlertasks WHERE status = 'failed'");
        const failedCount = failedCountRes.recordset?.[0]?.count || 0;
        
        if (failedCount > 0) {
            console.log(`[Crawler:Rescue] Attempting to salvage ${failedCount} failed tasks...`);
            await query(`
                UPDATE crawlertasks 
                SET status = 'pending', priority = 8, attempts = 0, updated_at = NOW()
                WHERE status = 'failed' AND updated_at < NOW() - INTERVAL '3 hours'
            `);
        }

        // 2. INDUSTRIAL CLEANUP: Prune logs older than 24h
        await query("DELETE FROM crawllogs WHERE created_at < NOW() - INTERVAL '24 hours'");
    } catch (e) {
        console.error('[Rescue:Error]', e.message);
    }
}, 1000 * 60 * 60 * 3); // Every 3 hours

/**
 * Task Weights:
 * discovery: 10 units (Heavy DOM/Network)
 * manga_sync: 5 units (Medium)
 * chapter_scrape: 1 unit (Light)
 */
const TASK_WEIGHTS = {
    'system_discovery': 10,
    'manga_sync': 5,
    'chapter_scrape': 1
};

// Autonomous Discovery State
global.discoveryPage = global.discoveryPage || 1;
global.isArchivalPulse = global.isArchivalPulse || false;

/**
 * Task Execution Logic
 */
async function executeTask(taskRow) {
    const weight = TASK_WEIGHTS[taskRow.type] || 1;
    activeWorkers += weight;
    
    let payload;
    try {
        payload = JSON.parse(taskRow.target);
    } catch (parseErr) {
        console.error(`[Titan:Fatal] Task ${taskRow.id} has malformed payload:`, taskRow.target);
        await query("UPDATE crawlertasks SET status = 'failed', last_error = 'MALFORMED_JSON' WHERE id = @id", { id: taskRow.id });
        activeWorkers -= weight;
        return;
    }
    
    try {
        const source = payload.source || 'nettruyen';
        
        switch (taskRow.type) {
            case 'chapter_scrape': {
                const { chapId, url, force } = payload;
                const chapRes = await query("SELECT c.title, m.title as m_title FROM chapters c JOIN manga m ON c.manga_id = m.id WHERE c.id = @chapId LIMIT 1", { chapId });
                const titles = chapRes.recordset?.[0];
                updateTelemetry({ 
                    status: 'scraping_images', 
                    currentManga: titles?.m_title || chapId.split('_')[0],
                    currentChapter: titles?.title || chapId
                });
                await crawlChapterImages(chapId, url, source, force);
                break;
            }
            case 'manga_sync': {
                const { mangaId, url, earlyExit } = payload;
                const mRes = await query("SELECT title FROM manga WHERE id = @mangaId LIMIT 1", { mangaId });
                updateTelemetry({ 
                    status: 'manga_sync', 
                    currentManga: mRes.recordset?.[0]?.title || mangaId,
                    currentChapter: 'Full Metadata'
                });
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
                attempts = attempts + 1,
                last_error = @err,
                updated_at = NOW() 
            WHERE id = @id
        `, { id: taskRow.id, err: e.message });
    } finally {
        activeWorkers -= weight;
        updateTelemetry({ activeWorkers });
        // HEALING: Only queue more if we are NOT in one-shot mode or if workers are still active
        if (!global.isOneShotExitRequested || activeWorkers > 0) {
            setTimeout(processQueue, 10);
        }
    }
}

/**
 * Queue Processor
 */
export async function processQueue() {
    const limit = getConcurrentLimit();
    const mAdjustedWorkers = Math.max(0, activeWorkers); // DRAGONYNE: Safety guard against negative drift
    if (mAdjustedWorkers >= limit) return;
    
    // HEALING: If workers are stuck at zero but tasks exist, force a pulse
    if (mAdjustedWorkers === 0 && activeWorkers < 0) activeWorkers = 0;

    const needed = Math.max(1, Math.floor((limit - mAdjustedWorkers) / 1));
    
    const pickRes = await query(`
        WITH favorite_counts AS (
            SELECT manga_id, COUNT(*) as fav_count 
            FROM favorites 
            GROUP BY manga_id
        ),
        selected_tasks AS (
            SELECT t.id 
            FROM crawlertasks t
            LEFT JOIN favorite_counts f ON t.manga_id = f.manga_id
            WHERE t.status = 'pending'
            ORDER BY (t.priority + COALESCE(f.fav_count, 0) * 3) DESC, t.created_at ASC
            LIMIT @needed
            FOR UPDATE SKIP LOCKED
        )
        UPDATE crawlertasks
        SET status = 'processing', updated_at = NOW()
        FROM selected_tasks
        WHERE crawlertasks.id = selected_tasks.id
        RETURNING crawlertasks.id, crawlertasks.type, crawlertasks.target;
    `, { needed });

    const tasks = pickRes.recordset || [];
    
    updateTelemetry({ 
        activeWorkers, 
        concurrencyLimit: limit,
        loadFactor: Math.round((activeWorkers / limit) * 100),
        status: tasks.length > 0 ? undefined : 'idle' 
    });

    if (tasks.length === 0) {
        if (!global.isOneShotExitRequested) {
            setTimeout(processQueue, 500); // TITAN HYPER-PULSE
        }
        return;
    }

    tasks.forEach(task => executeTask(task).catch(() => {}));
}

/**
 * Task Queuing API
 */
function stringifySorted(obj) {
    return JSON.stringify(Object.keys(obj).sort().reduce((acc, k) => ({ ...acc, [k]: obj[k] }), {}));
}

export async function queueMangaSync(mangaId, url, source, earlyExit = false, priority = 5, force = false) {
    // TITAN SMART SYNC: Prevent redundant syncing if already processed within the last 6 hours
    if (!force) {
        const lastSyncRes = await query(
            "SELECT last_crawled FROM manga WHERE id = @mangaId AND last_crawled > NOW() - INTERVAL '6 hours'",
            { mangaId }
        );
        if (lastSyncRes.rowCount > 0) {
            // Already synced recently, skip this discovery pulse for this manga
            return;
        }
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

/**
 * TITAN ON-DEMAND INGESTION: Resolves slug to URL and triggers sync
 */
export async function ingestMangaBySlug(slug, source = 'nettruyen') {
    let url = '';
    if (source === 'nettruyen') {
        url = safeJoinUrl(SOURCES.NETTRUYEN, `/truyen-tranh/${slug}`);
    } else {
        url = safeJoinUrl(SOURCES.TRUYENQQ, `/truyen-tranh/${slug}.html`);
    }

    // Upsert skeleton manga if not exists
    await query(`
        INSERT INTO manga (id, title, status, normalized_title)
        VALUES (@slug, @slug, 'Chờ đồng bộ', @slug)
        ON CONFLICT (id) DO NOTHING
    `, { slug });

    await queueMangaSync(slug, url, source, false, 10); // Highest priority
    return slug;
}

/**
 * Core Ingestion Logic: Full Manga Sync
 */
export async function crawlFullMangaChapters(mangaId, url, source, earlyExit = false) {
    if (inProgressManga.has(mangaId)) return;
    inProgressManga.set(mangaId, Date.now());

    try {
        console.log(`[Crawler][${mangaId}] Deep Sync Started: ${url}`);
        const response = await fetchWithRetry(url, { isDiscovery: true });
        const domain = new URL(url).hostname;
        updateMirrorHealth(domain, true);
        
        const html = response.data;
        const metadata = source === 'nettruyen' 
            ? parsers.parseNetTruyenManga(html, url) 
            : parsers.parseTruyenQQManga(html, url);
        
        const normalizedTitle = normalizeTitle(metadata.title || mangaId);

        await query(`
            UPDATE manga SET 
                title = @title,
                author = @author,
                status = @status, 
                description = @description,
                normalized_title = @normalizedTitle
            WHERE id = @mangaId
        `, { 
            mangaId, 
            title: metadata.title || mangaId,
            author: metadata.author || 'Đang cập nhật', 
            status: metadata.status || 'Đang cập nhật', 
            description: metadata.description || 'Nội dung đang được cập nhật.',
            normalizedTitle
        });

        const $ = cheerio.load(html);
        const chapterRows = source === 'nettruyen' ? $('.list-chapter li').toArray() : $('.list01 li').toArray();

        const processedUrls = new Set();
        const existingIds = new Set();
        const existingUrls = new Set();

        const chaptersRes = await query("SELECT id, source_url FROM chapters WHERE manga_id = @mangaId", { mangaId });
        chaptersRes.recordset.forEach(r => {
            existingIds.add(r.id);
            existingUrls.add(r.source_url);
        });

        // TITAN PARALLEL INGESTION: Process in batches of 15 to balance speed and DB pool stability
        const CHUNK_SIZE = 15;
        for (let i = 0; i < chapterRows.length; i += CHUNK_SIZE) {
            const chunk = chapterRows.slice(i, i + CHUNK_SIZE);
            await Promise.all(chunk.map(async (el) => {
                try {
                    const a = $(el).is('a') ? $(el) : $(el).find('a').first();
                    let chapUrl = a.attr('href');
                    if (!chapUrl) return;
                    
                    if (chapUrl.startsWith('/')) {
                        const base = source === 'nettruyen' ? SOURCES.NETTRUYEN : SOURCES.TRUYENQQ;
                        chapUrl = safeJoinUrl(base, chapUrl);
                    }
                    
                    const chapTitle = a.text().trim() || $(el).find('.chapter-name').text().trim();
                    const chapSlug = chapUrl.split('/').pop()?.split('?')[0];
                    const chapId = `${mangaId}_${chapSlug}`;
                    const chapNum = parseChapterNumber(chapTitle);

                    if (existingIds.has(chapId) || existingUrls.has(chapUrl)) {
                        return;
                    }

                    await query(`
                        INSERT INTO chapters (id, manga_id, title, source_url, chapter_number) 
                        VALUES (@chapId, @mangaId, @title, @url, @chapNum)
                        ON CONFLICT (id) DO NOTHING
                    `, { chapId, mangaId, title: chapTitle, url: chapUrl, chapNum });

                    // TITAN ASYNC TASKING: Notifications and scraping don't block the main sync loop
                    triggerChapterNotifications(mangaId, chapTitle, chapId).catch(() => {});
                    queueChapterScrape(chapId, chapUrl, source).catch(() => {});
                } catch (chapterErr) {
                    // Silent fail for single chapter to prevent entire manga sync from crashing
                }
            }));
        }

        // TITAN INTEGRITY: Only update last_crawled after successfully reaching the end of chapter processing
        await query('UPDATE manga SET last_crawled = NOW() WHERE id = @mangaId', { mangaId });
    } catch (err) {
        console.error(`Error in crawlFullMangaChapters for ${mangaId}:`, err.message);
        try {
            const domain = new URL(url).hostname;
            updateMirrorHealth(domain, false, err.message);
        } catch (e) {}
    } finally {
        inProgressManga.delete(mangaId);
    }
}

/**
 * Dispatches notifications to all users who have favorited a specific manga.
 */
export async function triggerChapterNotifications(mangaId, chapTitle, chapId) {
    try {
        const mangaRes = await query('SELECT title FROM manga WHERE id = @mangaId LIMIT 1', { mangaId });
        const mangaTitle = mangaRes.recordset?.[0]?.title || 'Truyện';

        const subscribers = await query(`
            SELECT user_uuid FROM favorites WHERE manga_id = @mangaId
        `, { mangaId });

        if (subscribers.recordset.length === 0) return;

        // Batch insert notifications
        const notificationData = subscribers.recordset.map(sub => ({
            user_uuid: sub.user_uuid,
            type: 'new_chapter',
            title: mangaTitle,
            message: `Chương mới: ${chapTitle}`,
            link: `/manga/${mangaId}/chapter/${chapId}`,
            manga_id: mangaId
        }));

        await bulkInsert('notifications', notificationData);
        console.log(`[Notification] Dispatched alerts to ${subscribers.recordset.length} subscribers for ${mangaId}`);
    } catch (e) {
        // SILENT FAIL for notifications: We don't want a notification glitch to kill the entire crawler pulse
        console.warn(`[Notification Warning] Failed to dispatch alerts for ${mangaId}:`, e.message);
    }
}

/**
 * Discovery Engine: Finding new manga content
 */
export async function crawlLatest(source = 'nettruyen', pageCount = 1, startPage = 1) {
    console.log(`[Crawler] Global Discovery Initiated: ${source} (Pages ${startPage} to ${startPage + pageCount - 1})`);
    const base = source === 'nettruyen' ? SOURCES.NETTRUYEN : SOURCES.TRUYENQQ;
    let newMangaCount = 0;
    
    for (let p = startPage; p < startPage + pageCount; p++) {
        try {
            const url = source === 'nettruyen' 
                ? `${base}?page=${p}` 
                : `${base}/latest-updates?page=${p}`; 
                
            const response = await fetchWithRetry(url, { isDiscovery: true });
            const $ = cheerio.load(response.data);
            
            const mangaLinks = source === 'nettruyen' 
                ? $('.items .item .image a').toArray() 
                : $('.book_item .book_avatar a').toArray();
                
            for (const link of mangaLinks) {
                let mangaUrl = $(link).attr('href');
                if (!mangaUrl) continue;
                if (mangaUrl.startsWith('/')) mangaUrl = safeJoinUrl(base, mangaUrl);
                
                const rawSlug = mangaUrl.split('/').pop()?.split('?')[0];
                const title = $(link).attr('title') || $(link).find('img').attr('alt') || rawSlug;
                
                // TITAN DE-DUPLICATION: Normalize title for cross-source matching
                const normalizedTitle = title.toLowerCase()
                    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                    .replace(/[đĐ]/g, 'd')
                    .replace(/[^a-z0-9]/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '');

                // Check for existing record with same normalized title (Merge logic)
                const existing = await query("SELECT id FROM manga WHERE normalized_title = @normalizedTitle OR id = @rawSlug LIMIT 1", { 
                    normalizedTitle, 
                    rawSlug 
                });

                let slug = rawSlug;
                if (existing.recordset?.length > 0) {
                    slug = existing.recordset[0].id; // Use established ID to merge sources
                } else {
                    // New manga: Insert skeleton
                    await query(`
                        INSERT INTO manga (id, title, source_url, normalized_title) 
                        VALUES (@slug, @title, @mangaUrl, @normalizedTitle)
                        ON CONFLICT (id) DO NOTHING
                    `, { slug, title, mangaUrl, normalizedTitle });
                    newMangaCount++;
                }
                
                await queueMangaSync(slug, mangaUrl, source, true, 4);
            }
        } catch (e) {
            console.error(`[Crawler] Page ${p} Discovery failed:`, e.message);
            try {
                const domain = new URL(base).hostname;
                updateMirrorHealth(domain, false, e.message);
            } catch (err) {}
        }
    }
    updateTelemetry({ syncHealth: true }); 
    return newMangaCount;
}

/**
 * Image Ingestion Engine
 */
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

        if (images.length === 0) {
            // TITAN CROSS-SOURCE RESCUE: If Source A fails, immediately try Source B 
            const alternativeSource = source === 'nettruyen' ? 'truyenqq' : 'nettruyen';
            console.log(`[Aegis:Rescue] Zero images on ${source} for ${chapId}. Firing Cross-Source Salvage on ${alternativeSource}...`);
            
            // Try to infer alternative URL if possible, or just log for future deep integration
            // For now, we log and mark for a specialized rescue task
            throw new Error('ZERO_IMAGES_FOUND');
        }

        await withTransaction(async (tx) => {
            if (force) await query("DELETE FROM chapterimages WHERE chapter_id = @chapId", { chapId }, tx);
            
            const batchImages = images.map((img, i) => ({
                chapter_id: chapId,
                image_url: img,
                order: i
            }));

            await bulkInsert('chapterimages', batchImages, tx);
            // TITAN STATUS UPDATE: Only mark as active if we actually found images
            const finalStatus = images.length > 0 ? 'active' : 'pending';
            await query("UPDATE chapters SET updated_at = NOW(), status = @status, fail_count = 0 WHERE id = @chapId", { chapId, status: finalStatus }, tx);
        });

        updateTelemetry({ successCount: 1, imagesFound: images.length });
        return images.length;
    } catch (err) {
        updateTelemetry({ failCount: 1 });
        console.error(`[Crawler] Image scrape failed for ${chapId}:`, err.message);
        
        // TITAN-GRADE GHOST DETECTION
        query(`
            UPDATE chapters SET 
                fail_count = fail_count + 1,
                status = CASE WHEN fail_count + 1 >= 5 THEN 'ghost' ELSE 'failed' END,
                updated_at = NOW()
            WHERE id = @chapId
        `, { chapId }).catch(() => {});

        return 0;
    } finally {
        inProgressChapters.delete(chapId);
    }
}

export async function queueChapterScrape(chapId, url, source, force = false, priority = 1) {
    const target = stringifySorted({ chapId, url, source, force });
    await query(`
        INSERT INTO crawlertasks (type, target, priority, manga_id) 
        SELECT 'chapter_scrape', @target, @priority, manga_id
        FROM chapters 
        WHERE id = @chapId
        ON CONFLICT (target) DO UPDATE SET 
            priority = GREATEST(crawlertasks.priority, @priority),
            status = CASE WHEN crawlertasks.status = 'failed' THEN 'pending' ELSE crawlertasks.status END
    `, { target, priority, chapId });
    processQueue();
}

export async function runGuardianAutopilot(oneShot = false) {
    if (global.guardianActive && !oneShot) return;
    global.guardianActive = true;
    
    console.log('[Titan] Autonomous Guardian Activated (Adaptive Recovery Mode)...');
    
    // RECOVERY: Load last known state from DB
    const state = await loadSystemState('crawler_state');
    if (state) {
        if (state.discoveryPage) global.discoveryPage = state.discoveryPage;
        if (state.isArchivalPulse !== undefined) global.isArchivalPulse = state.isArchivalPulse;
        if (state.mirrorScores) global.mirrorScores = { ...global.mirrorScores, ...state.mirrorScores }; // TITAN: Load persistent intelligence
        console.log(`[Guardian] State Recovered: Page ${global.discoveryPage}, Archival: ${global.isArchivalPulse}`);
    }

    let nothingNewStreak = 0;

    while (true) {
        try {
            const currentLimit = getConcurrentLimit();
            updateTelemetry({ 
                status: 'guardian_discovery',
                discoveryPage: global.discoveryPage % 500 + 1,
                isArchivalPulse: global.isArchivalPulse,
                activeWorkers,
                concurrencyLimit: currentLimit
            });
            
            // TITAN V3: Multi-Source Discovery (Check BOTH Nettruyen and TruyenQQ in one pulse)
            const sources = ['nettruyen', 'truyenqq'];
            let newFound = 0;

            for (const source of sources) {
                if (!global.isArchivalPulse) {
                    // Latest Pulse: Scrape 3 pages per source for high freshness
                    newFound += await crawlLatest(source, 3);
                } else {
                    // Archival Pulse: Scrape 2 pages from the history streak
                    const archivePage = global.discoveryPage % 500 + 1;
                    newFound += await crawlLatest(source, 2, archivePage);
                }
            }

            if (!global.isArchivalPulse) {
                global.isArchivalPulse = true;
            } else {
                global.discoveryPage += 2;
                global.isArchivalPulse = false;
            }

            if (newFound === 0) {
                nothingNewStreak = Math.min(nothingNewStreak + 1, 9);
            } else {
                nothingNewStreak = 0;
            }

            // TITAN V3: Aggressive Self-Healing (Scales rescue throughput)
            await rescueBrokenImages(50);
            await healChapterGaps(30);
            
            // TITAN STEALTH: Adaptive Heartbeat (60s to 600s) to prevent mirror bans
            const waitTime = Math.max(10000, 60000 * (nothingNewStreak + 1));
            
            // Sync health periodically
            if (global.discoveryPage % 10 === 0) {
                updateTelemetry({ syncHealth: true });
            }

            if (oneShot) {
                console.log('[Guardian] Pulse Complete. Synchronizing final state...');
                updateTelemetry({ syncHealth: true }); // FORCE PERSISTENCE BEFORE EXIT
                return;
            }

            await new Promise(r => setTimeout(r, waitTime));
        } catch (e) {
            console.error('[Guardian] Engine Stalled:', e.message);
            await new Promise(r => setTimeout(r, 60000)); // Safer rescue wait
        }
    }
}

export async function healChapterGaps(batchSize = 20) {
    const candidates = await query(`
        SELECT id, source_url FROM manga 
        WHERE last_crawled < NOW() - INTERVAL '6 hours'
        ORDER BY last_crawled ASC 
        LIMIT @batchSize
    `, { batchSize });

    for (const m of candidates.recordset) {
        const source = m.source_url.includes('truyenqq') ? 'truyenqq' : 'nettruyen';
        queueMangaSync(m.id, m.source_url, source, true, 2);
    }
}

export async function rescueBrokenImages(batchSize = 10) {
    const candidates = await query(`
        SELECT c.id, c.source_url, m.source_url as manga_url 
        FROM chapters c
        JOIN manga m ON c.manga_id = m.id
        LEFT JOIN chapterimages ci ON c.id = ci.chapter_id
        WHERE ci.id IS NULL AND c.updated_at < NOW() - INTERVAL '2 minutes'
        LIMIT @batchSize
    `, { batchSize });

    for (const c of candidates.recordset) {
        const source = c.manga_url.includes('truyenqq') ? 'truyenqq' : 'nettruyen';
        queueChapterScrape(c.id, c.source_url, source, true, 2);
    }
}

export async function bootstrapCrawler() {
    console.log('Initializing Modular Crawler System...');
    inProgressManga.clear();
    inProgressChapters.clear();
    
    await query(`
        UPDATE crawlertasks SET status = 'pending', updated_at = NOW() 
        WHERE status = 'processing' AND updated_at < NOW() - INTERVAL '2 hours'
    `);
    processQueue();
}

export async function runTitanWorker(oneShot = true) {
    console.log(`[Titan] Initializing Background Worker (${oneShot ? 'Pulse' : 'Daemon'} Mode)...`);
    if (oneShot) global.isOneShotExitRequested = true;
    
    await bootstrapCrawler();
    if (oneShot) {
        await runGuardianAutopilot(true);
        await waitForWorkers();
    } else {
        runGuardianAutopilot().catch(e => console.error('[Titan] Autopilot failure:', e.message));
    }
}


import * as cheerio from 'cheerio';
import { query, withTransaction, bulkInsert, loadSystemState } from '../db.js';
import { fetchWithRetry } from './index.js';
import { safeJoinUrl, parseChapterNumber, normalizeTitle, cleanTitleForSearch } from './utils.js';
import { updateTelemetry, logGuardianEvent, updateMirrorHealth } from './telemetry.js';
import * as parsers from './parsers.js';
import { SOURCES } from './mirrors.js';

// Concurrency State
let activeWorkers = 0;
const BASE_CONCURRENCY = 35; // Total "weight" limit
const inProgressManga = new Map(); // mangaId -> timestamp
const inProgressChapters = new Map(); // chapId -> timestamp

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

// PRUNING SERVICE: Prevent permanent locks if a worker dies
setInterval(() => {
    const now = Date.now();
    const TIMEOUT = 1000 * 60 * 30; // 30 minutes
    for (const [id, time] of inProgressManga.entries()) {
        if (now - time > TIMEOUT) inProgressManga.delete(id);
    }
    for (const [id, time] of inProgressChapters.entries()) {
        if (now - time > TIMEOUT) inProgressChapters.delete(id);
    }
}, 1000 * 60 * 5);

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
    
    try {
        const payload = JSON.parse(taskRow.target);
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
        setTimeout(processQueue, 10);
    }
}

/**
 * Queue Processor
 */
export async function processQueue() {
    const mem = process.memoryUsage().heapUsed / 1024 / 1024;
    const dynamicLimit = getConcurrentLimit();
    const currentLimit = mem > 1100 ? 5 : dynamicLimit;
    
    if (activeWorkers >= currentLimit) return;
    
    const needed = Math.max(1, Math.floor((currentLimit - activeWorkers) / 1)); // Heuristic for count
    
    const pickRes = await query(`
        WITH selected_tasks AS (
            SELECT id FROM crawlertasks
            WHERE status = 'pending'
            ORDER BY priority DESC, created_at ASC
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
    if (tasks.length === 0) {
        setTimeout(processQueue, 1000);
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

export async function queueMangaSync(mangaId, url, source, earlyExit = false, priority = 5) {
    const target = stringifySorted({ mangaId, url, source, earlyExit });
    await query(`
        INSERT INTO crawlertasks (type, target, priority) VALUES ('manga_sync', @target, @priority)
        ON CONFLICT (target) DO UPDATE SET priority = GREATEST(crawlertasks.priority, @priority)
        WHERE crawlertasks.status = 'pending'
    `, { target, priority });
    processQueue();
}

export async function queueDiscovery(source, pageCount = 3, startPage = 1, priority = 3) {
    const target = stringifySorted({ source, pageCount, startPage });
    await query(`
        INSERT INTO crawlertasks (type, target, priority) VALUES ('system_discovery', @target, @priority)
        ON CONFLICT (target) DO UPDATE SET priority = GREATEST(crawlertasks.priority, @priority)
        WHERE crawlertasks.status = 'pending'
    `, { target, priority });
    processQueue();
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
                author = @author, 
                status = @status, 
                description = @description,
                normalized_title = @normalizedTitle,
                last_crawled = NOW()
            WHERE id = @mangaId
        `, { 
            mangaId, 
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

        let existingInARow = 0;
        
        for (let i = 0; i < chapterRows.length; i++) {
            try {
                const el = chapterRows[i];
                const a = $(el).is('a') ? $(el) : $(el).find('a').first();
                let chapUrl = a.attr('href');
                if (!chapUrl) continue;
                
                if (chapUrl.startsWith('/')) {
                    const base = source === 'nettruyen' ? SOURCES.NETTRUYEN : SOURCES.TRUYENQQ;
                    chapUrl = safeJoinUrl(base, chapUrl);
                }
                
                processedUrls.add(chapUrl);
                const chapTitle = a.text().trim() || $(el).find('.chapter-name').text().trim();
                const chapSlug = chapUrl.split('/').pop()?.split('?')[0];
                const chapId = `${mangaId}_${chapSlug}`;
                const chapNum = parseChapterNumber(chapTitle);

                if (existingIds.has(chapId) || existingUrls.has(chapUrl)) {
                    // Early exit logic removed for Cycle 1 Hardening. 
                    // We sync everything found on the page to ensure zero gaps.
                    continue;
                }
                existingInARow = 0;

                await query(`
                    INSERT INTO chapters (id, manga_id, title, source_url, chapter_number) 
                    VALUES (@chapId, @mangaId, @title, @url, @chapNum)
                `, { chapId, mangaId, title: chapTitle, url: chapUrl, chapNum });

                // TITAN NOTIFICATION: Alert favorite subscribers
                triggerChapterNotifications(mangaId, chapTitle, chapId).catch(() => {});

                queueChapterScrape(chapId, chapUrl, source).catch(() => {});
            } catch (chapterErr) {
                console.error(`[Crawler][Error] Failed to process chapter:`, chapterErr.message);
            }
        }
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
        console.error('[Notification Error] Failed to dispatch alerts:', e.message);
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
                
                const slug = mangaUrl.split('/').pop()?.split('?')[0];
                const title = $(link).attr('title') || $(link).find('img').attr('alt') || slug;
                
                const res = await query(`
                    INSERT INTO manga (id, title, source_url) 
                    VALUES (@slug, @title, @mangaUrl)
                    ON CONFLICT (source_url) DO NOTHING
                    ON CONFLICT (id) DO NOTHING
                    RETURNING id
                `, { slug, title, mangaUrl });

                if (res.rowCount > 0) newMangaCount++;
                
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

        if (images.length === 0) throw new Error('ZERO_IMAGES_FOUND');

        await withTransaction(async (tx) => {
            if (force) await query("DELETE FROM chapterimages WHERE chapter_id = @chapId", { chapId }, tx);
            
            const batchImages = images.map((img, i) => ({
                chapter_id: chapId,
                image_url: img,
                order: i
            }));

            await bulkInsert('chapterimages', batchImages, tx);
            await query("UPDATE chapters SET updated_at = NOW(), status = 'active', fail_count = 0 WHERE id = @chapId", { chapId }, tx);
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
        INSERT INTO crawlertasks (type, target, priority) 
        SELECT 'chapter_scrape', @target, @priority
        WHERE EXISTS (SELECT 1 FROM chapters WHERE id = @chapId)
        ON CONFLICT (target) DO UPDATE SET priority = GREATEST(crawlertasks.priority, @priority)
        WHERE crawlertasks.status = 'pending'
    `, { target, priority, chapId });
    processQueue();
}

// export async function runGuardianAutopilot() {
//     if (global.guardianActive) return;
//     global.guardianActive = true;
//     
//     console.log('[Titan] Autonomous Guardian Activated (Adaptive Recovery Mode)...');
//     
//     // RECOVERY: Load last known state from DB
//     const state = await loadSystemState('crawler_state');
//     if (state) {
//         if (state.discoveryPage) global.discoveryPage = state.discoveryPage;
//         if (state.isArchivalPulse !== undefined) global.isArchivalPulse = state.isArchivalPulse;
//         console.log(`[Guardian] State Recovered: Page ${global.discoveryPage}, Archival: ${global.isArchivalPulse}`);
//     }
// 
//     let nothingNewStreak = 0;
// 
//     while (true) {
//         try {
//             updateTelemetry({ 
//                 status: 'guardian_discovery',
//                 discoveryPage: global.discoveryPage % 500 + 1,
//                 isArchivalPulse: global.isArchivalPulse,
//                 peakAwareLimit: getConcurrentLimit()
//             });
//             
//             // source rotation
//             const source = Math.random() > 0.3 ? 'nettruyen' : 'truyenqq';
//             let newFound = 0;
// 
//             if (!global.isArchivalPulse) {
//                 newFound = await crawlLatest(source, 1);
//                 global.isArchivalPulse = true;
//             } else {
//                 const archivePage = global.discoveryPage % 500 + 1;
//                 newFound = await crawlLatest(source, 1, archivePage);
//                 global.discoveryPage++;
//                 global.isArchivalPulse = false;
//             }
// 
//             if (newFound === 0) {
//                 nothingNewStreak = Math.min(nothingNewStreak + 1, 9);
//             } else {
//                 nothingNewStreak = 0;
//             }
// 
//             await rescueBrokenImages(15);
//             await healChapterGaps(10);
//             
//             // TITAN BREATHE: Adaptive Heartbeat (60s to 600s)
//             const waitTime = Math.max(60000, 60000 * (nothingNewStreak + 1));
//             if (nothingNewStreak > 0) {
//                 console.log(`[Guardian] Nothing new found (${nothingNewStreak}). Breathing for ${waitTime/1000}s...`);
//             }
//             
//             await new Promise(r => setTimeout(r, waitTime));
//         } catch (e) {
//             console.error('[Guardian] Engine Stalled:', e.message);
//             await new Promise(r => setTimeout(r, 60000));
//         }
//     }
// }

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

export async function runTitanWorker() {
    console.log('[Titan] Initializing Background Worker...');
    await bootstrapCrawler();
    await runGuardianAutopilot();
}


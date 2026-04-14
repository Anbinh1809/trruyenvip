/**
 * Titan Crawler V2 - Execution Engine
 */
import { query, withTransaction, bulkInsert } from '../db.js';
import { fetchWithRetry } from './index.js';
import { safeJoinUrl, parseChapterNumber, normalizeTitle, cleanTitleForSearch } from './utils.js';
import { updateTelemetry, logGuardianEvent } from './telemetry.js';
import * as parsers from './parsers.js';
import { SOURCES } from './mirrors.js';

// Concurrency State
let activeChapterScrapes = 0;
const MAX_CONCURRENT_CHAPTERS = 10;
const inProgressManga = new Set();
const inProgressChapters = new Set();

/**
 * Task Execution Logic
 */
async function executeTask(taskRow) {
    activeChapterScrapes++;
    try {
        const payload = JSON.parse(taskRow.target);
        
        switch (taskRow.type) {
            case 'chapter_scrape': {
                const { chapId, url, source, force } = payload;
                await crawlChapterImages(chapId, url, source, force);
                break;
            }
            case 'manga_sync': {
                const { mangaId, url, source, earlyExit } = payload;
                await crawlFullMangaChapters(mangaId, url, source, earlyExit);
                break;
            }
            case 'system_discovery': {
                const { source, pageCount } = payload;
                await crawlLatest(source, pageCount);
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
        activeChapterScrapes--;
        setTimeout(processQueue, 10);
    }
}

/**
 * Queue Processor
 */
export async function processQueue() {
    const mem = process.memoryUsage().heapUsed / 1024 / 1024;
    const currentLimit = mem > 1100 ? 1 : MAX_CONCURRENT_CHAPTERS;

    const needed = currentLimit - activeChapterScrapes;
    if (needed <= 0) return;
    
    const pickRes = await query(`
        UPDATE crawlertasks
        SET status = 'processing', updated_at = NOW()
        WHERE id IN (
            SELECT id FROM crawlertasks
            WHERE status = 'pending'
            ORDER BY priority DESC, created_at ASC
            LIMIT @needed
            FOR UPDATE SKIP LOCKED
        )
        RETURNING id, type, target;
    `, { needed });

    const tasks = pickRes.recordset || [];
    if (tasks.length === 0) {
        setTimeout(processQueue, 3000);
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

export async function queueDiscovery(source, pageCount = 3, priority = 3) {
    const target = stringifySorted({ source, pageCount });
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
    inProgressManga.add(mangaId);

    try {
        console.log(`[Crawler][${mangaId}] Deep Sync Started: ${url}`);
        const response = await fetchWithRetry(url, { isDiscovery: true });
        const html = response.data;
        const metadata = source === 'nettruyen' ? parsers.parseNetTruyenManga(html) : parsers.parseTruyenQQManga(html);
        
        // Atomic Update Manga Metadata
        await query(`
            UPDATE manga SET 
                author = @author, 
                status = @status, 
                description = @description,
                last_crawled = NOW()
            WHERE id = @mangaId
        `, { 
            mangaId, 
            author: metadata.author || 'Đang cập nhật', 
            status: metadata.status || 'Đang cập nhật', 
            description: metadata.description || 'Nội dung đang được cập nhật.'
        });

        const $ = require('cheerio').load(html);
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
                    if (earlyExit && ++existingInARow >= 5) break;
                    continue;
                }
                existingInARow = 0;

                await query(`
                    INSERT INTO chapters (id, manga_id, title, source_url, chapter_number) 
                    VALUES (@chapId, @mangaId, @title, @url, @chapNum)
                `, { chapId, mangaId, title: chapTitle, url: chapUrl, chapNum });

                queueChapterScrape(chapId, chapUrl, source).catch(() => {});
                await new Promise(r => setTimeout(r, 20));
            } catch (chapterErr) {
                console.error(`[Crawler][Error] Failed to process chapter:`, chapterErr.message);
            }
        }
    } catch (err) {
        console.error(`Error in crawlFullMangaChapters for ${mangaId}:`, err.message);
    } finally {
        inProgressManga.delete(mangaId);
    }
}

/**
 * Discovery Engine: Finding new manga content
 */
export async function crawlLatest(source = 'nettruyen', pageCount = 1) {
    console.log(`[Crawler] Global Discovery Initiated: ${source} (${pageCount} pages)`);
    const base = source === 'nettruyen' ? SOURCES.NETTRUYEN : SOURCES.TRUYENQQ;
    
    for (let p = 1; p <= pageCount; p++) {
        try {
            const url = source === 'nettruyen' 
                ? `${base}?page=${p}` 
                : `${base}/latest-updates?page=${p}`; // Hypothetical latest page
                
            const response = await fetchWithRetry(url, { isDiscovery: true });
            const $ = require('cheerio').load(response.data);
            
            const mangaLinks = source === 'nettruyen' 
                ? $('.items .item .image a').toArray() 
                : $('.book_item .book_avatar a').toArray();
                
            for (const link of mangaLinks) {
                let mangaUrl = $(link).attr('href');
                if (!mangaUrl) continue;
                if (mangaUrl.startsWith('/')) mangaUrl = safeJoinUrl(base, mangaUrl);
                
                const slug = mangaUrl.split('/').pop()?.split('?')[0];
                const title = $(link).attr('title') || $(link).find('img').attr('alt') || slug;
                
                // Ensure manga exists in DB
                const check = await query("SELECT id FROM manga WHERE id = @slug OR source_url = @mangaUrl", { slug, mangaUrl });
                if (check.recordset.length === 0) {
                    await query(`
                        INSERT INTO manga (id, title, source_url) 
                        VALUES (@slug, @title, @mangaUrl)
                        ON CONFLICT (id) DO NOTHING
                    `, { slug, title, mangaUrl });
                }
                
                // Queue Sync for existing or new manga
                await queueMangaSync(slug, mangaUrl, source, true, 4);
                await new Promise(r => setTimeout(r, 100));
            }
        } catch (e) {
            console.error(`[Crawler] Page ${p} Discovery failed:`, e.message);
        }
    }
}

/**
 * Image Ingestion Engine
 */
export async function crawlChapterImages(chapId, url, source = 'nettruyen', force = false) {
    if (inProgressChapters.has(chapId)) return;
    inProgressChapters.add(chapId);

    try {
        if (!force) {
            const existing = await query('SELECT COUNT(*) as count FROM chapterimages WHERE chapter_id = @chapId', { chapId });
            if ((existing.recordset?.[0]?.count || 0) > 3) return existing.recordset[0].count;
        }

        updateTelemetry({ status: 'scraping_images', currentChapter: chapId });
        const response = await fetchWithRetry(url);
        const images = parsers.parseChapterImages(response.data, source);

        if (images.length === 0) throw new Error('ZERO_IMAGES_FOUND');

        await withTransaction(async (tx) => {
            if (force) await query("DELETE FROM chapterimages WHERE chapter_id = @chapId", { chapId }, tx);
            
            const batchImages = images.map((img, i) => ({
                chapter_id: chapId,
                image_url: img,
                order: i
            }));

            await bulkInsert('chapterimages', batchImages, tx);
            await query("UPDATE chapters SET updated_at = NOW() WHERE id = @chapId", { chapId }, tx);
        });

        updateTelemetry({ successCount: 1, imagesFound: images.length });
        return images.length;
    } catch (err) {
        updateTelemetry({ failCount: 1 });
        console.error(`[Crawler] Image scrape failed for ${chapId}:`, err.message);
        return 0;
    } finally {
        inProgressChapters.delete(chapId);
    }
}

/**
 * Task Queuing Specialized
 */
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

/**
 * Background Workers
 */
export async function runGuardianAutopilot() {
    if (global.guardianActive) return;
    global.guardianActive = true;
    
    console.log('[Titan] Autonomous Guardian Activated...');
    while (true) {
        try {
            updateTelemetry({ status: 'guardian_discovery' });
            await crawlLatest('nettruyen', 1);
            await rescueBrokenImages(10);
            await healChapterGaps(5);
            
            await new Promise(r => setTimeout(r, 300000)); // Cycle every 5 minutes
        } catch (e) {
            console.error('[Guardian] Engine Stalled:', e.message);
            await new Promise(r => setTimeout(r, 60000));
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
        WHERE ci.id IS NULL AND c.updated_at < NOW() - INTERVAL '5 minutes'
        LIMIT @batchSize
    `, { batchSize });

    for (const c of candidates.recordset) {
        const source = c.manga_url.includes('truyenqq') ? 'truyenqq' : 'nettruyen';
        queueChapterScrape(c.id, c.source_url, source, true, 2);
    }
}

export async function bootstrapCrawler() {
    console.log('Initializing Modular Crawler System...');
    await query(`
        UPDATE crawlertasks SET status = 'pending', updated_at = NOW() 
        WHERE status = 'processing' AND updated_at < NOW() - INTERVAL '2 hours'
    `);
    processQueue();
}


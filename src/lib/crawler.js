import axios from 'axios';
import * as cheerio from 'cheerio';
import http from 'http';
import https from 'https';
import { query, withTransaction, sql, bulkInsert } from './db.js';

// Titan-grade Connection Pooling
const axiosAgent = axios.create({
    httpAgent: new http.Agent({ keepAlive: true, maxSockets: 50 }),
    httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 50, rejectUnauthorized: false }),
    timeout: 30000
});

function safeJoinUrl(base, path) {
    if (!path) return base;
    if (path.startsWith('http')) return path;
    const baseUrl = base.endsWith('/') ? base.slice(0, -1) : base;
    const pathUrl = path.startsWith('/') ? path : '/' + path;
    return baseUrl + pathUrl;
}

export const SOURCES = {
    NETTRUYEN: 'https://www.nettruyenme.com/',
    NETTRUYEN_MIRRORS: [
        'https://www.nettruyenme.com/', 
        'https://www.nettruyenpro.com/', 
        'https://www.nettruyennew.com/', 
        'https://www.nettruyenking.com/', 
        'https://www.nettruyenon.com/',
        'https://www.nettruyenco.vn/',
        'https://www.nettruyenmax.com/',
        'https://www.nettruyenvi.com/',
        'https://www.nettruyencc.com/',
        'https://www.nettruyeninfo.com/',
        'https://www.nettruyenus.com/'
    ],
    TRUYENQQ: 'https://truyenqqno.com/'
};

// --- MIRROR INTELLIGENCE SCORING ---
global.mirrorScores = global.mirrorScores || {};
SOURCES.NETTRUYEN_MIRRORS.forEach(m => {
    if (global.mirrorScores[m] === undefined) global.mirrorScores[m] = 100;
});
global.globalFailureRate = global.globalFailureRate || 0;
global.lastFailureReset = global.lastFailureReset || Date.now();

// --- TITAN TELEMETRY CORE ---
global.crawlerState = global.crawlerState || {
    status: 'idle',
    currentManga: null,
    currentChapter: null,
    currentImage: null,
    successCount: 0,
    failCount: 0,
    imagesScrapedToday: 0,
    startTime: Date.now(),
    lastAction: Date.now()
};

let lastTelemetryWrite = 0;
const TELEMETRY_THROTTLE_MS = 1000;

function updateTelemetry(data) {
    if (!data) return;
    
    if (data.status) global.crawlerState.status = data.status;
    if (data.currentManga !== undefined) global.crawlerState.currentManga = data.currentManga;
    if (data.currentChapter !== undefined) global.crawlerState.currentChapter = data.currentChapter;
    if (data.currentImage !== undefined) global.crawlerState.currentImage = data.currentImage;
    if (data.successCount !== undefined) global.crawlerState.successCount = (global.crawlerState.successCount || 0) + (data.successCount || 0);
    if (data.failCount !== undefined) global.crawlerState.failCount = (global.crawlerState.failCount || 0) + (data.failCount || 0);
    
    if (data.imagesFound) {
        global.crawlerState.imagesScrapedToday = (global.crawlerState.imagesScrapedToday || 0) + data.imagesFound;
    }
    
    global.crawlerState.lastAction = Date.now();

    // Throttling persistent writes if we were to add any here
}

async function logGuardianEvent(mangaId, chapterTitle, eventType, message) {
    try {
        let cover = '';
        let mangaName = 'System';
        
        if (mangaId) {
            const res = await query('SELECT title, cover FROM "Manga" WHERE id = @mangaId LIMIT 1', { mangaId });
            const manga = res.recordset?.[0];
            if (manga) {
                mangaName = manga.title;
                cover = manga.cover;
            }
        }

        await query(`
            INSERT INTO guardianreports (manga_name, chapter_title, event_type, message, cover, created_at)
            VALUES (@name, @chap, @type, @msg, @cover, NOW())
        `, {
            name: mangaName,
            chap: chapterTitle || 'System',
            type: eventType,
            msg: message,
            cover: cover || ''
        });
        
        const logPrefix = `[Aegis:SYNC]`;
        console.log(`${logPrefix} ${eventType}: ${message}`);
    } catch (e) {
        console.error('[Guardian] Failed to log event:', e.message);
    }
}

/**
 * runInParallel: A RAM-aware concurrency controller
 * Limits the number of simultaneous active promises to prevent OOM.
 */
async function runInParallel(items, mapper, concurrency = 2) {
    const results = [];
    const executing = new Set();
    
    const usage = process.memoryUsage();
    const memUsed = usage.heapUsed / 1024 / 1024;
    const memTotal = usage.heapTotal / 1024 / 1024;
    
    // Even more conservative if heapTotal is nearing limits
    const finalLimit = (memUsed > 800 || memTotal > 1200) ? 1 : concurrency;

    for (const item of items) {
        const p = Promise.resolve().then(() => mapper(item, items));
        results.push(p);
        executing.add(p);
        const clean = () => executing.delete(p);
        p.then(clean).catch(clean);

        if (executing.size >= finalLimit) {
            await Promise.race(executing);
        }
    }
    return Promise.allSettled(results);
}

const MIN_IMAGE_COUNT = 1; // Leanest possible for JIT success

export function normalizeTitle(title) {
    if (!title) return '';
    return title.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-z0-9\s-]/g, "")  // Remove special chars keep spaces/dashes
        .replace(/\s+/g, '-')           // Spaces to dashes
        .replace(/-+/g, '-')            // Collapse multiple dashes
        .replace(/^-+|-+$/g, '')        // Trim dashes from ends
        .trim();
}

/**
 * Smart Mapping: Clean titles for cleaner cross-source discovery
 * Removes ads, chapter info, and suffixes like "Full", "Hot", etc.
 */
function cleanTitleForSearch(title) {
    if (!title) return '';
    return title.toLowerCase()
        .replace(/\(full\)/g, '')
        .replace(/\(m?i\)/g, '')
        .replace(/chapter\s*\d+/g, '')
        .replace(/chap\s*\d+/g, '')
        .replace(/t?m l?/g, '') // Remove genre noise for better matches
        .replace(/[-\s]+/g, ' ')
        .trim();
}

function parseChapterNumber(title) {
    if (!title) return null;
    
    // Industrial Precision Regex: Look for common chapter patterns first
    // Handles "Chap 123", "Chapter 123.5", "Chương 123 - Phần 2"
    const standardMatch = title.match(/(?:chương|chapter|chap|ch|c|[\s])\s*(\d+(?:\.\d+)?)/i);
    if (standardMatch) {
        let num = parseFloat(standardMatch[1]);
        
        // Sub-part detection: If "Phan 2" or "Part 2", add a small decimal if not already present
        if (title.match(/(?:phần|phan|part|p)\s*(\d+)/i)) {
            const partNum = parseInt(title.match(/(?:phần|phan|part|p)\s*(\d+)/i)[1]);
            if (partNum > 1 && !standardMatch[1].includes('.')) {
                num += partNum * 0.1; // e.g. Chap 10 Part 2 -> 10.2
            }
        }
        return num;
    }
    
    // Fallback: extract the first number found
    const fallbackMatch = title.match(/(\d+(?:\.\d+)?)/);
    return fallbackMatch ? parseFloat(fallbackMatch[1]) : null;
}

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0'
];

const SEARCH_REFERERS = [
    'https://www.google.com/',
    'https://www.bing.com/',
    'https://duckduckgo.com/',
    'https://www.facebook.com/',
    'https://t.co/', // Twitter
    'https://www.pinterest.com/'
];

// --- MIRROR ISOLATION & QUARANTINE ---
global.mirrorQuarantine = global.mirrorQuarantine || {}; // { mirror_url: timestamp_until_released }

async function fetchWithRetry(url, options = {}, retries = 2) {
    let mirrors = url.includes('nettruyen') ? [...SOURCES.NETTRUYEN_MIRRORS] : [url];
    
    const now = Date.now();
    mirrors = mirrors.filter(m => !global.mirrorQuarantine[m] || global.mirrorQuarantine[m] < now);
    if (mirrors.length === 0) {
        mirrors = url.includes('nettruyen') ? [...SOURCES.NETTRUYEN_MIRRORS] : [url];
    }
    if (url.includes('nettruyen')) {
        mirrors.sort((a, b) => (global.mirrorScores[b] || 0) - (global.mirrorScores[a] || 0));
    }

    const defaultTimeout = options.isDiscovery ? 12000 : 25000;
    const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    const searchReferer = SEARCH_REFERERS[Math.floor(Math.random() * SEARCH_REFERERS.length)];

    // TITAN-X RACING ENGINE: Support racing the top mirrors
    const tryMirror = async (mirrorUrl, attemptNum) => {
        let finalUrl = url;
        if (url.includes('nettruyen')) {
            try {
                const parsedUrl = new URL(url);
                finalUrl = safeJoinUrl(mirrorUrl, parsedUrl.pathname + parsedUrl.search);
            } catch (e) {
                finalUrl = url.startsWith('/') ? safeJoinUrl(mirrorUrl, url) : url;
            }
        }

        const isTruyenQQ = url.includes('truyenqq');
        const headers = { 
            'User-Agent': options.headers?.['User-Agent'] || ua,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
            'Referer': options.headers?.Referer || (isTruyenQQ ? 'https://truyenqqno.com/' : searchReferer),
            ...options.headers 
        };

        const response = await axios.get(finalUrl, { timeout: options.timeout || defaultTimeout, headers });
        
        // Cloudflare Sentinel
        if (response.data && typeof response.data === 'string') {
            const lowerData = response.data.toLowerCase();
            if (lowerData.includes('checking your browser') || lowerData.includes('ray id:') || lowerData.includes('captcha')) {
                throw { code: 'CHALLENGE_DETECTED', mirror: mirrorUrl };
            }
        }
        return { response, mirror: mirrorUrl };
    };

    // Racing Strategy: Start 1st, then 2nd after 2s if 1st hasn't finished
    const candidates = mirrors.slice(0, 2);
    
    try {
        const raceTasks = [tryMirror(candidates[0], 0)];
        if (candidates.length > 1) {
            raceTasks.push(new Promise(async (resolve, reject) => {
                await new Promise(r => setTimeout(r, 2000)); // 2s head start for primary
                tryMirror(candidates[1], 1).then(resolve).catch(reject);
            }));
        }

        const { response, mirror: winningMirror } = await Promise.any(raceTasks);

        // Success scoring
        if (url.includes('nettruyen')) {
            global.mirrorScores[winningMirror] = Math.min((global.mirrorScores[winningMirror] || 100) + 5, 200);
        }
        global.globalFailureRate = Math.max(0, global.globalFailureRate - 0.05);
        return response;

    } catch (err) {
        // Fallback to sequential retry if racing failed or exhausted
        const errorMirror = err.mirror || mirrors[0];
        const isBlock = err.code === 'ECONNRESET' || err.response?.status === 403 || err.code === 'ETIMEDOUT';
        
        if (isBlock) {
            global.mirrorQuarantine[errorMirror] = Date.now() + (url.includes('nettruyen') ? 7200000 : 60000);
        }
        
        global.globalFailureRate = Math.min(1.2, global.globalFailureRate + 0.1);
        
        // Final sequential fallback for remaining mirrors
        if (mirrors.length > 2) {
             for (let i = 2; i < Math.min(mirrors.length, 5); i++) {
                 try {
                     const { response } = await tryMirror(mirrors[i], i);
                     return response;
                 } catch (e) {}
             }
        }
        throw err;
    }
}

let activeDeepCrawls = 0;
const MAX_DEEP_CRAWLS = 3;
const inProgressManga = new Set();
const inProgressChapters = new Set();

// --- ARCHITECTURE UTILITY: DETERMINISTIC JSON ---
function stringifySorted(obj) {
    if (!obj || typeof obj !== 'object') return JSON.stringify(obj);
    const sorted = Object.keys(obj).sort().reduce((acc, key) => {
        acc[key] = obj[key];
        return acc;
    }, {});
    return JSON.stringify(sorted);
}

// --- RESOURCE HARNESS: CONCURRENCY CONTROL ---
let activeChapterScrapes = 0;
const MAX_CONCURRENT_CHAPTERS = 10; // TITAN-X: Doubled capacity for high throughput
const chapterScrapeQueue = [];
const pendingChapterIds = new Set(); // Track tasks waiting in the queue

async function processQueue() {
    const mem = process.memoryUsage().heapUsed / 1024 / 1024;
    const currentLimit = mem > 1100 ? 1 : MAX_CONCURRENT_CHAPTERS;

    const needed = currentLimit - activeChapterScrapes;
    if (needed <= 0) return;
    
    // TITAN BULK FETCH: Extract up to 'needed' pending tasks
    const pickRes = await query(`
        UPDATE CrawlerTasks
        SET status = 'processing', updated_at = NOW()
        WHERE id IN (
            SELECT id
            FROM CrawlerTasks
            WHERE status = 'pending'
            ORDER BY priority DESC, created_at ASC
            LIMIT @needed
            FOR UPDATE SKIP LOCKED
        )
        RETURNING id, type, target;
    `, { needed });

    const tasks = pickRes.recordset || [];
    if (tasks.length === 0) {
        // SMART HEARTBEAT: Reduced from 10s to 3s for faster reactivity
        setTimeout(processQueue, 3000);
        return;
    }

    // Process all picked tasks in parallel
    tasks.forEach(taskRow => {
        executeTask(taskRow).catch(e => console.error(`[Titan-X] Task failure:`, e.message));
    });

    // Immediate re-check if we still have slots
    if (activeChapterScrapes < currentLimit) {
        setTimeout(processQueue, 50);
    }
}

async function executeTask(taskRow) {
    activeChapterScrapes++;
    try {
        if (taskRow.type === 'chapter_scrape') {
            const { chapId, url, source, force } = JSON.parse(taskRow.target);
            inProgressChapters.add(chapId);
            const imagesIngested = await crawlChapterImages(chapId, url, source, force);
            if (imagesIngested === 0) {
                throw new Error('ZERO_IMAGES_FOUND');
            }
            inProgressChapters.delete(chapId);
        } else if (taskRow.type === 'manga_sync') {
            const { mangaId, url, source, earlyExit } = JSON.parse(taskRow.target);
            await crawlFullMangaChapters(mangaId, url, source, earlyExit);
        } else if (taskRow.type === 'system_discovery') {
            const { source, pageCount } = JSON.parse(taskRow.target);
            if (source === 'nettruyen') {
                for (let i = 1; i <= (pageCount || 2); i++) {
                    await crawlNetTruyen(i, false, false);
                }
            } else if (source === 'truyenqq') {
                for (let i = 1; i <= (pageCount || 2); i++) {
                    await crawlTruyenQQ(i, false, false);
                }
            }
        }
        
        // Mark as completed
        await query("UPDATE CrawlerTasks SET status = 'completed', updated_at = NOW() WHERE id = @id", { id: taskRow.id });
    } catch (e) {
        // Mark as failed and increment attempts
        await query(`
            UPDATE CrawlerTasks 
            SET status = CASE WHEN attempts >= 3 THEN 'failed' ELSE 'pending' END, 
                attempts = attempts + 1,
                last_error = @err,
                updated_at = NOW() 
            WHERE id = @id
        `, { id: taskRow.id, err: e.message });
    } finally {
        activeChapterScrapes--;
        
        // --- GUARDIAN OF SILENCE: Periodic Maintenance (1 in 100 chance) ---
        if (Math.random() < 0.01) {
            query("DELETE FROM CrawlLogs WHERE created_at < NOW() - INTERVAL '7 days'").catch(() => {});
            const now = Date.now();
            const twoHoursAgo = now - (120 * 60 * 1000);
            for (const mirror in (global.mirrorQuarantine || {})) {
                if (global.mirrorQuarantine[mirror] < twoHoursAgo) {
                    delete global.mirrorQuarantine[mirror];
                }
            }
        }

        // TIGHT CYCLE: Reduced to 10ms for ultra-fast task handover
        setTimeout(processQueue, 10); 
    }
}

export function queueChapterScrape(chapId, url, source, force = false, priority = 1) {
    const taskPayload = stringifySorted({ chapId, url, source, force });
    query(`
        INSERT INTO CrawlerTasks (type, target, priority) 
        SELECT 'chapter_scrape', @target, @priority
        WHERE EXISTS (SELECT 1 FROM Chapters WHERE id = @chapId)
        ON CONFLICT (target) DO UPDATE 
        SET priority = CASE WHEN CrawlerTasks.priority < @priority THEN @priority ELSE CrawlerTasks.priority END 
        WHERE CrawlerTasks.status = 'pending'
    `, { target: taskPayload, priority, chapId }).then(() => { processQueue(); }).catch(() => {});
    return Promise.resolve(null);
}

export function queueMangaSync(mangaId, url, source, earlyExit = false, priority = 5) {
    const taskPayload = stringifySorted({ mangaId, url, source, earlyExit });
    query(`
        INSERT INTO CrawlerTasks (type, target, priority) 
        VALUES ('manga_sync', @target, @priority)
        ON CONFLICT (target) DO UPDATE 
        SET priority = CASE WHEN CrawlerTasks.priority < @priority THEN @priority ELSE CrawlerTasks.priority END 
        WHERE CrawlerTasks.status = 'pending'
    `, { target: taskPayload, priority }).then(() => { processQueue(); }).catch(() => {});
    return Promise.resolve(null);
}

export function queueDiscovery(source = 'nettruyen', pageCount = 2, priority = 10) {
    const taskPayload = stringifySorted({ source, pageCount });
    query(`
        INSERT INTO CrawlerTasks (type, target, priority) 
        VALUES ('system_discovery', @target, @priority)
        ON CONFLICT (target) DO UPDATE 
        SET priority = CASE WHEN CrawlerTasks.priority < @priority THEN @priority ELSE CrawlerTasks.priority END 
        WHERE CrawlerTasks.status = 'pending'
    `, { target: taskPayload, priority }).then(() => { processQueue(); }).catch(() => {});
    return Promise.resolve(null);
}

/**
 * Startup Recovery: Resets any 'processing' tasks back to 'pending' 
 * in case of a crash during execution.
 */
export async function bootstrapCrawler() {
    console.log('Initializing Crawler Persistence System (Industrial Guard)...');
    try {
        // Recover orphan tasks: Any task stuck in 'processing' for > 2 hours is likely dead
        const recovery = await query(`
            UPDATE CrawlerTasks 
            SET status = 'pending', updated_at = NOW() 
            WHERE status = 'processing' 
            AND updated_at < NOW() - INTERVAL '2 hours'
        `);
        if (recovery.rowsAffected[0] > 0) {
            console.log(`[Guardian] Recovered ${recovery.rowsAffected[0]} orphaned tasks from the abyss.`);
        }
        
        processQueue(); // Start the motor
    } catch (e) {
        console.error('[Crawler] Bootstrap failed:', e.message);
    }
}

async function logCrawl(message, status = 'success') {
    try {
        console.log(`[CrawlLog][${status.toUpperCase()}] ${message}`);
        await query("INSERT INTO crawllogs (message, status) VALUES (@message, @status)", {
            message: message.substring(0, 500),
            status: status
        });
    } catch (e) {
        // Silently fail logging to prioritize crawl stability
    }
}




/**
 * Apogee V2: Gap Healing Engine
 * Automatically repairs broken chapter sequences in the database
 */
export async function healChapterGaps(limit = 5) {
    try {
        updateTelemetry({ status: 'healing_gaps' });
        
        // Find manga with inconsistent chapter counts, prioritize by Favorites & Views
        const targets = await query(`
            SELECT m.id, m.source_url, m.title, (SELECT COUNT(*) FROM favorites f WHERE f.manga_id = m.id) as fav_count
            FROM manga m
            JOIN (
                SELECT manga_id, MAX(chapter_number) as max_n, COUNT(*) as count_n
                FROM chapters
                GROUP BY manga_id
                HAVING MAX(chapter_number) > COUNT(*) + 1 
            ) gaps ON m.id = gaps.manga_id
            ORDER BY fav_count DESC, m.views DESC, m.last_crawled ASC
            LIMIT @limit
        `, { limit });

        if (targets.recordset.length > 0) {
            console.log(`[Guardian][Priority] Healing ${targets.recordset.length} hot manga first...`);
            for (const target of targets.recordset) {
                logCrawl(`[GAP-HEAL] Dang va chuong cho truyen HOT: ${target.title}`);
                await logGuardianEvent(target.id, 'Nhieu chuong', 'FIX_GAP', `He thong phat hien truyen chien luoc ${target.title} bi thieu chuong va da tu dong xu ly.`);
                await crawlFullMangaChapters(target.id, target.source_url);
            }
        }
    } catch (err) {
        console.error('[GapHealing] Error:', err.message);
    }
}

/**
 * rescueBrokenImages: Fixes chapters with 0 or low image counts
 */
export async function rescueBrokenImages(limit = 10) {
    try {
        updateTelemetry({ status: 'rescuing_images' });
        
        // Find chapters with fewer than 3 images, prioritizing Popular Manga & Newer chapters
        const targets = await query(`
            SELECT c.id, c.title, c.source_url, m.title as manga_title, m.id as manga_id, 
                   (SELECT COUNT(*) FROM favorites f WHERE f.manga_id = m.id) as fav_count
            FROM chapters c
            JOIN manga m ON c.manga_id = m.id
            WHERE (SELECT COUNT(*) FROM chapterimages ci WHERE ci.chapter_id = c.id) < 3
            AND (c.retry_count < 5 OR c.retry_count IS NULL)
            ORDER BY fav_count DESC, m.views DESC, c.updated_at DESC
            LIMIT @limit
        `, { limit });

        if (targets.recordset.length > 0) {
            console.log(`[Guardian][Priority] Rescuing ${targets.recordset.length} broken chapters...`);
            for (const target of targets.recordset) {
                logCrawl(`[RESCUE] Cuu ho uu tien: ${target.manga_title} - ${target.title}`);
                
                // Track retry attempts
                await query('UPDATE chapters SET retry_count = COALESCE(retry_count, 0) + 1 WHERE id = @id', { id: target.id });

                const success_count = await crawlChapterImages(target.id, target.source_url);
                
                if (success_count >= 3) {
                    await logGuardianEvent(target.manga_id, target.title, 'FIX_IMAGE', `He thong da phuc hoi thanh cong ${success_count} anh cho truyen chien luoc ${target.manga_title}.`);
                    await query('UPDATE chapters SET retry_count = 0, last_error = NULL WHERE id = @id', { id: target.id });
                }
            }
        }
    } catch (err) {
        console.error('[RescueImages] Error:', err.message);
    }
}

export async function crawlAllManga() {
    console.log('--- BAT DAU CHU KY CAO TOAN BO (APOGEE V2) ---');
    await maintainSystem(1);
    
    try {
        updateTelemetry({ startTime: Date.now(), successCount: 0, failCount: 0 });
        await logCrawl(`[APOGEE-V2] Bat dau chu ky cao Than Thu`);
        
        // Stage 1: Intelligence Refresh
        await refreshActiveManga(20);
        
        // Stage 2: Gap Healing
        await healChapterGaps(10);
        
        // Stage 3: Image Rescue (Broken/Missing images)
        await rescueBrokenImages(15);
        
        // Stage 4: Discovery
        await crawlNetTruyen(1, false, false);
        await crawlTruyenQQ(1, false, false);
        
        // Stage 5: Deep Archival
        await autoDeepCrawl(10);
        
        await logCrawl(`[APOGEE-V2] Hoan tat. Ti le thanh cong: ${Math.round((global.crawlerState.successCount / (global.crawlerState.successCount + global.crawlerState.failCount || 1)) * 100)}%`);
    } catch (err) {
        console.error('FATAL CRAWL ERROR:', err);
        await logCrawl(`[ERROR] He thong Apogee V2: ${err.message}`, 'error');
    }
}

export async function crawlLatest(full = false, limitless = false) {
    try {
        await maintainSystem(1);
        console.log(`--- Starting Priority-Based Crawl Process ${limitless ? '(LIMITLESS)' : (full ? '(FULL)' : '')} ---`);
        await logCrawl(`[START] Bat dau chu ky cao uu tien ${limitless ? '(Vo han)' : (full ? '(Day du)' : '')}`);
        
        // --- Phase 1: Refresh Active Manga (Favorites & Recent Activity) ---
        await logCrawl(`[PHASE-1] Lam moi cac bo truyen dang HOT/Yeu thich...`);
        await refreshActiveManga(full ? 50 : 20);
        
        // --- Phase 2: Discovery (Crawl Next/QQ Listings for new chapters) ---
        await logCrawl(`[PHASE-2] Kham pha truyen moi tu trang chu...`);
        const ntCount = await crawlNetTruyen(1, full, limitless);
        const qqCount = await crawlTruyenQQ(1, full, limitless);
        
        // --- Phase 3: Background Archival (Historical gaps) ---
        await logCrawl(`[PHASE-3] Lap day khoang trong lich su...`);
        await autoDeepCrawl(full ? 50 : 10);
        
        await logCrawl(`[DONE] Cao uu tien hoan tat. Da bao tri ${full ? '50' : '20'} bo quan trong.`);
        console.log('--- Crawl Process Finished Successfully ---');
    } catch (err) {
        console.error('FATAL CRAWL ERROR:', err);
        await logCrawl(`[ERROR] Loi cao tu dong: ${err.message}`, 'error');
    }
}

export async function refreshActiveManga(limit = 20) {
    try {
        const targets = await query(`
            SELECT m.id, m.source_url, m.title, m.status, m.last_crawled, COUNT(f.id) as fav_count
            FROM manga m
            LEFT JOIN favorites f ON m.id = f.manga_id
            GROUP BY m.id, m.source_url, m.title, m.status, m.last_crawled
            ORDER BY fav_count DESC, m.last_crawled ASC
            LIMIT @limit
        `, { limit });

        await runInParallel(targets.recordset, async (manga) => {
            // Aegis: Skip "Hoan thanh" manga if crawled within last 10 days
            if (manga.status?.includes('Hoan thanh')) {
                const lastCrawled = new Date(manga.last_crawled);
                const tenDaysAgo = new Date();
                tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
                if (lastCrawled > tenDaysAgo) {
                    console.log(`[Aegis] Skipping Completed Manga (Recent): ${manga.title}`);
                    return;
                }
            }

            updateTelemetry({ status: 'refreshing', currentManga: manga.title, currentChapter: 'Syncing Metadata' });
            console.log(`[Phase 1] Syncing active series: ${manga.title}`);
            const source = manga.source_url.includes('nettruyen') ? 'nettruyen' : 'truyenqq';
            await crawlFullMangaChapters(manga.id, manga.source_url, source, true); // Aegis: earlyExit=true
        }, 3); // 3 parallel manga refreshes

        updateTelemetry({ status: 'idle', currentManga: null });
    } catch (e) {
        console.error('Phase 1 refresh error:', e.message);
    }
}

export async function autoDeepCrawl(limit = 5) {
    try {
        const targets = await query(`
            SELECT m.id, m.source_url, m.title 
            FROM manga m
            LEFT JOIN (SELECT manga_id, COUNT(*) as c FROM chapters GROUP BY manga_id) ch ON m.id = ch.manga_id
            ORDER BY 
                CASE WHEN m.description IS NULL OR m.description = '' THEN 0 ELSE 1 END ASC,
                ch.c ASC, 
                m.last_crawled ASC
            LIMIT @limit
        `, { limit });

        await runInParallel(targets.recordset, async (manga) => {
            const source = manga.source_url.includes('nettruyen') ? 'nettruyen' : 'truyenqq';
            await crawlFullMangaChapters(manga.id, manga.source_url, source);
        }, 2); // 2 parallel deep crawls

        await logCrawl(`[DEEP] Hoan tat cao sau cho ${targets.recordset.length} truyen.`, 'success');
    } catch (e) {
        console.error('Deep crawl error:', e.message);
        await logCrawl(`[ERROR] Loi cao sau: ${e.message}`, 'error');
    }
}

export async function crawlNetTruyen(page = 1, full = false, limitless = false) {
  const url = page === 1 ? SOURCES.NETTRUYEN : `${SOURCES.NETTRUYEN}truyen-tranh?page=${page}`;
  console.log(`[NetTruyen] Crawling page ${page}: ${url}${limitless ? ' (LIMITLESS)' : (full ? ' (FULL)' : '')}`);
  
  try {
    const response = await fetchWithRetry(url, { isDiscovery: true });
    const $ = cheerio.load(response.data);
    const items = $('.items .item');
    
    if (items.length === 0) return 0;

    let newChaptersTotal = 0;
    let existingInARow = 0;

    for (let i = 0; i < items.length; i++) {
        const el = items[i];
        const title = $(el).find('h3 a').text().trim();
        const sourceUrl = $(el).find('h3 a').attr('href');
        const cover = $(el).find('img').attr('data-original') || $(el).find('img').attr('src');
        const id = sourceUrl.split('/').pop(); 
        const titleSlug = normalizeTitle(title);

        if (!id) continue;

        // --- FUZZY DEDUPLICATION 2.0 ---
        const existingManga = await query(`
            SELECT id FROM Manga 
            WHERE id = @id 
            OR id = @slug 
            OR title = @title 
            OR REPLACE(REPLACE(REPLACE(title, ' (Full)', ''), ' [Truyen Tranh]', ''), ' ', '-') = @slug
        `, { id, slug: titleSlug, title });
        
        const isNewManga = existingManga.recordset.length === 0;
        const targetId = existingManga.recordset[0]?.id || id;

        // Note: Manga insertion is now deferred to the atomic transaction below to ensure consistency.
        if (isNewManga) {
            if (activeDeepCrawls < MAX_DEEP_CRAWLS) {
                activeDeepCrawls++;
                crawlFullMangaChapters(targetId, sourceUrl, 'nettruyen').finally(() => { activeDeepCrawls--; });
            }
        }

        const latestChapEl = $(el).find('ul li:first-child a');
        if (latestChapEl.length === 0) continue;

        const chapTitle = latestChapEl.text().trim();
        const chapUrl = latestChapEl.attr('href');
        const chapNum = parseChapterNumber(chapTitle);
        const chapSlug = chapUrl.split('/').pop()?.split('?')[0];
        const chapId = `${targetId}_${chapSlug}`;

        const chapResult = await query(`
            SELECT id FROM Chapters WHERE id = @chapId OR (source_url = @url)
        `, { chapId, url: chapUrl });

        if (chapResult.recordset.length === 0) {
          updateTelemetry({ status: 'new_chapter', currentChapter: chapTitle });
          console.log(`[NetTruyen][New] ${title} -> ${chapTitle} (${chapNum})`);
          
          // --- GAP DETECTION ---
          // Check if we are missing chapters between our DB and this new one
          const maxNumRes = await query('SELECT MAX(chapter_number) as m FROM "Chapters" WHERE manga_id = @mangaId', { mangaId: targetId });
          const currentMax = maxNumRes.recordset?.[0]?.m || 0;
          
          // --- ATOMIC DISCOVERY: Manga & Chapter bound in one transaction ---
          await withTransaction(async (tx) => {
              await query(`
                INSERT INTO Manga (id, title, cover, source_url, normalized_title, last_crawled) 
                VALUES (@targetId, @title, @cover, @url, @normTitle, NOW())
                ON CONFLICT (id) DO UPDATE 
                SET cover = EXCLUDED.cover, last_crawled = NOW(), normalized_title = EXCLUDED.normalized_title
              `, { targetId, title, cover, url: sourceUrl, normTitle: titleSlug }, tx);

              await query(`
                INSERT INTO Chapters (id, manga_id, title, source_url, chapter_number) 
                VALUES (@chapId, @mangaId, @title, @url, @chapNum)
              `, { chapId, mangaId: targetId, title: chapTitle, url: chapUrl, chapNum }, tx);
              
              await query(`
                UPDATE Manga SET last_chap_num = @chapNum, last_crawled = NOW() WHERE id = @mangaId
              `, { mangaId: targetId, chapNum }, tx);
          });
          
          await queueChapterScrape(chapId, chapUrl, 'nettruyen');
          
          // Trigger backfill if gap detected
          if (chapNum > currentMax + 1.2 && currentMax > 0) {
              console.log(`[Gap-Detected] ${targetId}: DB ${currentMax} -> New ${chapNum}. Triggering deep sync.`);
              crawlFullMangaChapters(targetId, sourceUrl, 'nettruyen');
          }

          newChaptersTotal++;
          existingInARow = 0;
        } else {
          existingInARow++;
          const existingId = chapResult.recordset?.[0]?.id;
          if (existingId) {
            const imgCheck = await query('SELECT COUNT(*) as count FROM "ChapterImages" WHERE chapter_id = @existingId', { existingId });
            if ((imgCheck.recordset?.[0]?.count || 0) === 0) {
              await queueChapterScrape(existingId, chapUrl, 'nettruyen');
            }
          }
        }

        if (!full && !limitless && existingInARow >= 5) break;
    }

    const shouldContinue = limitless || (full && page < 5);
    if (shouldContinue) {
        await new Promise(r => setTimeout(r, limitless ? 3000 : 1000));
        newChaptersTotal += await crawlNetTruyen(page + 1, full, limitless);
    }
    return newChaptersTotal;
  } catch (err) {
      console.error(`[NetTruyen] Error on page ${page}:`, err.message);
      return 0;
  }
}

export async function crawlFullMangaChapters(mangaId, detailUrl, source = 'nettruyen', earlyExit = false) {
    if (inProgressManga.has(mangaId)) return;
    
    // URL Validation & Auto-Correction Guard
    try {
        if (!detailUrl) throw new Error('Detail URL is empty');
        
        // Auto-correct relative URLs from legacy data
        if (!detailUrl.startsWith('http')) {
            const base = source === 'nettruyen' ? SOURCES.NETTRUYEN : SOURCES.TRUYENQQ;
            detailUrl = safeJoinUrl(base, detailUrl);
            console.log(`[Crawler][Aegis] Auto-corrected relative URL for ${mangaId}: ${detailUrl}`);
        }
        new URL(detailUrl); 
    } catch (e) {
        console.error(`[Crawler][Skip] Skipping ${mangaId} due to malformed URL: ${detailUrl} (${e.message})`);
        return;
    }

    inProgressManga.add(mangaId);

    try {
        console.log(`[${source}][${earlyExit ? 'Early-Exit' : 'Full'}] Deep sync: ${mangaId}`);
        let response;
        try {
            response = await fetchWithRetry(detailUrl, { isDiscovery: true });
        } catch (err) {
            // Aegis Auto-Migration: If 404, look for alternative source
            if (err.response?.status === 404) {
                 console.warn(`[Aegis] Status 404 for ${mangaId}. Attempting auto-migration...`);
                 const mangaData = await query("SELECT title FROM manga WHERE id = @mangaId", { mangaId });
                 const title = mangaData.recordset[0]?.title;
                 if (title) {
                     await findAlternativeSource(mangaId, title, source);
                 }
            }
            throw err;
        }
        const $ = cheerio.load(response.data);
        
        let author = '';
        let status = '';
        let description = '';
        let alternativeTitles = '';
        let sourceViews = 0;
        let genres = [];

        if (source === 'nettruyen') {
            author = $('.author .col-xs-8').text().trim();
            status = $('.status .col-xs-8').text().trim();
            
            // Hardened "Clean Room" Extractions
            const descContainer = $('.detail-content').clone();
            descContainer.find('article, figure, div, ul, li, script, style, textarea, input, button, .breadcrumb, .nav, .comment, .reply, .list-info, .total-views, .star').remove();
            description = descContainer.find('p').map((i, p) => $(p).text().trim()).get().join('\n') || descContainer.text().trim();
            description = description.substring(0, 3000);
            
            alternativeTitles = $('.othername .col-xs-8').text().trim();
            const viewsText = $('.total-views .col-xs-8').text().replace(/\./g, '').replace(/,/g, '').trim();
            sourceViews = parseInt(viewsText) || 0;

            $('.kind .col-xs-8 a').each((i, el) => {
                genres.push($(el).text().trim());
            });
        } else {
            author = $('.list-info li:contains("Tac gia")').text().replace('Tac gia', '').trim() || 
                     $('.book_info li:nth-child(2)').text().trim();
            status = $('.list-info li:contains("Tinh trang")').text().replace('Tinh trang', '').trim();
            
            // Hardened Clean for TruyenQQ
            const descContainer = $('.book_detail, .detail-content').clone();
            descContainer.find('article, figure, div, ul, li, script, style, textarea, input, button, .breadcrumb, .nav, .comment, .reply, .list-info, .total-views, .star').remove();
            description = descContainer.find('p').map((i, p) => $(p).text().trim()).get().join('\n') || descContainer.text().trim();
            description = description.substring(0, 3000);
            
            alternativeTitles = $('.list-info li:contains("Ten khac")').text().replace('Ten khac', '').trim();
            const viewsText = $('.list-info li:contains("Luot xem")').text().replace(/[^0-9]/g, '');
            sourceViews = parseInt(viewsText) || 0;
            
            $('.list01 li a').each((i, el) => {
                genres.push($(el).text().trim());
            });
        }

        const maxNumRes = await query("SELECT MAX(chapter_number) as m FROM chapters WHERE manga_id = @mangaId", { mangaId });
        const lastChapNum = maxNumRes.recordset?.[0]?.m || '0';

        await query(`
            UPDATE Manga SET 
                author = @author, 
                status = @status, 
                description = @description,
                alternative_titles = @alt,
                views_at_source = @sourceViews,
                views = CASE WHEN views < @sourceViews THEN @sourceViews ELSE views END,
                last_chap_num = @lastChapNum,
                last_crawled = NOW()
            WHERE id = @mangaId
        `, { 
            mangaId, 
            author: author || 'Dang cap nhat', 
            status: status || 'Dang cap nhat', 
            description: description || 'Noi dung dang duoc cap nhat.',
            alt: alternativeTitles,
            sourceViews,
            lastChapNum: lastChapNum.toString()
        });


        if (genres.length > 0) {
            await saveGenres(mangaId, genres);
        }

        let chapterRows;
        if (source === 'nettruyen') {
            // --- DEEP DISCOVERY: NetTruyen AJAX Bridge ---
            // NetTruyen often limits the initial HTML to 20-50 chapters.
            // We need to hit the background ComicService to get the full list.
            let comicId = $('#ctl00_mainContent_hdId').val() || 
                           $('.star').attr('data-id') || 
                           $('input[name="comicId"]').val() ||
                           $('.subscribe').attr('data-id') ||
                           $('#hdMangaId').val() ||
                           $('[data-site-id]').attr('data-id') ||
                           $('.follow-link').attr('data-id');

            // Fallback: Extract from script or URL if standard selectors fail
            if (!comicId) {
                const scriptText = $('script').text() + $('body').html(); // Search entire body for var decls
                const idMatch = scriptText.match(/mangaId\s*=\s*(\d+)/i) || 
                                scriptText.match(/comicId\s*=\s*(\d+)/i) ||
                                scriptText.match(/id\s*:\s*(\d+)/i);
                if (idMatch) comicId = idMatch[1];
            }
            
            if (!comicId) {
                const idFromUrl = detailUrl.split('-').pop();
                if (/^\d+$/.test(idFromUrl)) comicId = idFromUrl;
            }

            if (comicId) {
                let baseUrl;
                try {
                    baseUrl = new URL(detailUrl).origin;
                } catch (e) {
                    baseUrl = source === 'nettruyen' ? SOURCES.NETTRUYEN : SOURCES.TRUYENQQ;
                    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
                }
                // Try multiple AJAX endpoints used by different mirrors
                const ajaxEndpoints = [
                    `${baseUrl}/Comic/Services/ComicService.asmx/GetChapters?comicId=${comicId}`,
                    `${baseUrl}/Comic/Services/ComicService.asmx/GetChapters?comicId=${comicId}&isIframe=true`
                ];

                for (const ajaxUrl of ajaxEndpoints) {
                    try {
                        console.log(`[NetTruyen] Deep-Syncing via: ${ajaxUrl}`);
                        const ajaxRes = await fetchWithRetry(ajaxUrl, { 
                            isDiscovery: true,
                            headers: { 
                                'X-Requested-With': 'XMLHttpRequest',
                                'Referer': detailUrl
                            }
                        });
                        if (ajaxRes.data && ajaxRes.data.length > 200) { // basic size check
                            const $ajax = cheerio.load(ajaxRes.data);
                            const found = $ajax('li, .row, .item');
                            if (found.length > 0) {
                                chapterRows = found;
                                console.log(`[NetTruyen] Successfully found ${chapterRows.length} chapters via AJAX.`);
                                break; 
                            }
                        }
                    } catch (ajaxErr) {
                        console.error(`[NetTruyen] AJAX Attempt failed for ${mangaId}:`, ajaxErr.message);
                    }
                }
            }
            
            // Fallback: Use initial HTML + Hidden containers
            if (!chapterRows || chapterRows.length === 0) {
                chapterRows = $('#nt_listchapter .row, .list-chapter li, .chapter-list div.item, #list-chapter li, .chapter-name a');
                console.log(`[NetTruyen] Fallback to DOM: Found ${chapterRows.length} items.`);
            }
        } else if (source === 'truyenqq') {
            chapterRows = $('.list-chapters li, .chapter-list li, .list_chapter li, .works-chapter-item, .list01 li');
        } else {
            throw new Error(`Unsupported source for deep crawl: ${source}`);
        }

        if (!chapterRows || chapterRows.length === 0) {
            console.warn(`[${source}] Warning: No chapters found for ${mangaId}. Checking backup...`);
            // Fallback: Try a generic regex link search for any chapter-like URL
            const backupLinks = $('a').filter((i, el) => {
                const href = $(el).attr('href') || '';
                return /chap-|chapter-|chuong-/i.test(href);
            });
            if (backupLinks.length > 0) {
                console.log(`[${source}] Found ${backupLinks.length} backup chapter links via Regex.`);
                chapterRows = backupLinks;
            } else {
                logCrawl('Canh bao: Khong the tim thay danh sach chuong cho ' + mangaId, 'info');
            }
        }

        // --- ATOMIC DE-DUPLICATION ---
        // Ensure we don't process duplicate nodes from overlapping selectors
        const processedUrls = new Set();
        const uniqueChapterRows = [];
        
        for (let i = 0; i < (chapterRows?.length || 0); i++) {
            const row = chapterRows[i];
            const a = $(row).is('a') ? $(row) : $(row).find('a').first();
            const href = a.attr('href');
            if (href && !processedUrls.has(href)) {
                processedUrls.add(href);
                uniqueChapterRows.push(row);
            }
        }

        // --- BATCH CHAPTER CHECK ---
        // Fetch all existing chapter IDs and source URLs for this manga once to avoid N+1 queries
        const existingChapters = await query("SELECT id, source_url FROM Chapters WHERE manga_id = @mangaId", { mangaId });
        const existingIds = new Set(existingChapters.recordset.map(r => r.id));
        const existingUrls = new Set(existingChapters.recordset.map(r => r.source_url));

        console.log(`[Crawler] Final unique chapters to process: ${uniqueChapterRows.length}`);

        // --- SEQUENCE GUARD: Final Sort Before Batching ---
        // Ensure that even if the DOM order was messy, we process in logical sequence.
        uniqueChapterRows.sort((a, b) => {
            const getNum = (row) => {
                const el = $(row).is('a') ? $(row) : $(row).find('a').first();
                return parseChapterNumber(el.text().trim() || $(row).text().trim()) || 0;
            };
            return getNum(a) - getNum(b);
        });

        let existingInARow = 0;

        for (let i = 0; i < uniqueChapterRows.length; i++) {
            const row = uniqueChapterRows[i];
            const a = $(row).is('a') ? $(row) : $(row).find('a').first();
            const chapTitle = a.text().trim() || $(row).text().trim();
            let chapUrl = a.attr('href');
            if (!chapUrl) continue;
            
            if (chapUrl.startsWith('/')) {
                const base = source === 'nettruyen' ? SOURCES.NETTRUYEN : SOURCES.TRUYENQQ;
                chapUrl = safeJoinUrl(base, chapUrl);
            }

            try {
                const chapNum = parseChapterNumber(chapTitle);
                if (chapNum === null) {
                    console.log(`[Crawler][Skip] Link does not appear to be a chapter: ${chapTitle}`);
                    continue;
                }
                const chapSlug = chapUrl.split('/').pop()?.split('?')[0] || chapNum.toString().replace('.', '-');
                const chapId = `${mangaId}_${chapSlug}`;

                // --- TITAN DEDUPLICATION 3.0 ---
                // We check existingIds (Slugs) AND existingNums (By MangaId + ChapNum)
                const existingNumCheck = await query("SELECT id FROM chapters WHERE manga_id = @mangaId AND chapter_number = @chapNum", { mangaId, chapNum });
                const alreadyExists = existingIds.has(chapId) || existingUrls.has(chapUrl) || existingNumCheck.recordset.length > 0;

                if (alreadyExists) {
                    if (earlyExit) {
                        existingInARow = (existingInARow || 0) + 1;
                        if (existingInARow >= 5) {
                            console.log(`[Aegis][${mangaId}] 5 consecutive existing chapters. Stopping early.`);
                            break; 
                        }
                    }
                    continue; 
                }
                existingInARow = 0;

                await query(`
                    INSERT INTO chapters (id, manga_id, title, source_url, chapter_number) 
                    VALUES (@chapId, @mangaId, @title, @url, @chapNum)
                `, { chapId, mangaId, title: chapTitle, url: chapUrl, chapNum });

                    // Processing chapter images (Background Queue)
                    queueChapterScrape(chapId, chapUrl, source).catch(() => {});
                    
                    await new Promise(r => setTimeout(r, 20)); // TITAN WARP: Accelerated pace (Sub-20ms)
            } catch (chapterErr) {
                console.error(`[Crawler][Error] Failed to process chapter ${chapTitle}:`, chapterErr.message);
            }

        }
        
        // --- TITAN IMAGE RECOVERY (BATCH OPTIMIZED) ---
        const allChapterMeta = uniqueChapterRows.map(row => {
            const a = $(row).is('a') ? $(row) : $(row).find('a').first();
            let chapUrl = a.attr('href');
            if (!chapUrl) return null;
            if (chapUrl.startsWith('/')) {
                const base = source === 'nettruyen' ? SOURCES.NETTRUYEN : SOURCES.TRUYENQQ;
                chapUrl = safeJoinUrl(base, chapUrl);
            }
            const chapSlug = chapUrl.split('/').pop()?.split('?')[0];
            return { chapId: `${mangaId}_${chapSlug}`, url: chapUrl };
        }).filter(Boolean);

        // 1. Get all chapters of this manga that ALREADY have images
        const chaptersWithImages = await query("SELECT DISTINCT chapter_id FROM chapterimages WHERE chapter_id LIKE @pattern", { pattern: `${mangaId}_%` });
        const existingSet = new Set(chaptersWithImages.recordset.map(r => r.chapter_id));

        // 2. Queue ONLY those that are truly missing
        let queuedCount = 0;
        const RESCUE_CAP = earlyExit ? 100 : 500; // ATOMIC SCALE: Increase cap for full syncs
        
        for (const meta of allChapterMeta) {
            if (!existingSet.has(meta.chapId)) {
                queueChapterScrape(meta.chapId, meta.url, source).catch(() => {});
                queuedCount++;
                if (queuedCount >= RESCUE_CAP) {
                    console.log(`[Titan][${mangaId}] Safety cap reached (${RESCUE_CAP}).`);
                    break; 
                }
            }
        }
        console.log(`[Titan][${mangaId}] Batch recovery: Queued ${queuedCount} missing chapters for image scraping.`);

            // --- CHAPTER PRUNING (PHANTOM CLEANUP) ---
            // TITAN GUARD: Only prune if we found a significant number of chapters (>10)
            // and the number of phantom chapters is not suspiciously high (< 50% of total)
            if (uniqueChapterRows.length > 10 && !earlyExit) {
                const dbChapters = await query("SELECT source_url FROM chapters WHERE manga_id = @mangaId", { mangaId });
                const sourceBase = source === 'nettruyen' ? 'nettruyen' : 'truyenqq';
                
                const toDelete = dbChapters.recordset.filter(row => {
                    if (!row.source_url) return false;
                    if (!row.source_url.includes(sourceBase)) return false;
                    return !processedUrls.has(row.source_url);
                });

                const safetyThreshold = Math.ceil(uniqueChapterRows.length * 0.5);
                if (toDelete.length > 0 && toDelete.length < safetyThreshold) {
                    console.log(`[Prune][${mangaId}] Removing ${toDelete.length} phantom chapters.`);
                    for (const ghost of toDelete) {
                        await query("DELETE FROM chapters WHERE manga_id = @mangaId AND source_url = @url", { mangaId, url: ghost.source_url });
                    }
                } else if (toDelete.length >= safetyThreshold) {
                    console.warn(`[Guardian][Safety] Phantom cleanup BLOCKED for ${mangaId}. Suspiciously high deletion count (${toDelete.length}). Possible source site DOM change.`);
                    await logGuardianEvent(mangaId, 'Prune Safety', 'CLEANUP_BLOCKED', `He thong da ngan chan viec xoa ${toDelete.length} chuong vi con so nay vuot qua nguong an toan (50%). Co the trang nguon da thay doi cau truc.`);
                }
            }
    } catch (err) {
        console.error(`Error in crawlFullMangaChapters for ${mangaId}:`, err.message);
    } finally {
        inProgressManga.delete(mangaId);
    }
}

async function saveGenres(mangaId, genres) {
    try {
        if (!genres || genres.length === 0) return;

        // 1. Fetch current Genres to map names to IDs
        const allGenresRes = await query("SELECT id, name FROM genres");
        const genreMap = new Map(allGenresRes.recordset.map(g => [g.name.toLowerCase(), g.id]));
        
        const associations = [];

        for (const genreName of genres) {
            if (!genreName || genreName === 'Dang cap nhat' || genreName.includes('The loai')) continue;
            
            let genreId = genreMap.get(genreName.toLowerCase());
            
            // If genre doesn't exist, create it (Slow path, but infrequent)
            if (!genreId) {
                const slug = genreName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
                await query(`
                    INSERT INTO genres (name, slug) VALUES (@name, @slug) ON CONFLICT (name) DO NOTHING
                `, { name: genreName, slug });
                
                const newGenreRes = await query("SELECT id FROM genres WHERE name = @name", { name: genreName });
                genreId = newGenreRes.recordset[0]?.id;
                if (genreId) genreMap.set(genreName.toLowerCase(), genreId);
            }

            if (genreId) {
                associations.push({ manga_id: mangaId, genre_id: genreId });
            }
        }

        if (associations.length > 0) {
            await withTransaction(async (tx) => {
                await query("DELETE FROM mangagenres WHERE manga_id = @mangaId", { mangaId }, tx);
                
                let values = [];
                let params = { mangaId };
                associations.forEach((assoc, idx) => {
                    params[`g${idx}`] = assoc.genre_id;
                    values.push(`(@mangaId, @g${idx})`);
                });

                const sqlStr = `INSERT INTO mangagenres (manga_id, genre_id) VALUES ${values.join(', ')}`;
                await query(sqlStr, params, tx);
            });
        }
    } catch (e) {
        console.error(`[Crawler] Genre sync error for ${mangaId}:`, e.message);
    }
}


export async function crawlTruyenQQ(page = 1, full = false, limitless = false) {
  const url = page === 1 ? (SOURCES.TRUYENQQ + '/truyen-moi-cap-nhat.html') : `${SOURCES.TRUYENQQ}/truyen-moi-cap-nhat/trang-${page}.html`;
  console.log(`[TruyenQQ] Crawling page ${page}: ${url}${limitless ? ' (LIMITLESS)' : (full ? ' (FULL)' : '')}`);
  
  try {
    const response = await fetchWithRetry(url, { isDiscovery: true });
    const $ = cheerio.load(response.data);
    const items = $('.list_grid li');
    
    if (items.length === 0) return 0;

    let newChaptersTotal = 0;
    let existingInARow = 0;

    for (let i = 0; i < items.length; i++) {
        const el = items[i];
        const title = $(el).find('.book_name a').text().trim();
        const sourceUrl = $(el).find('.book_name a').attr('href');
        const cover = $(el).find('img').attr('src');
        const id = sourceUrl.split('/').pop(); 
        const titleSlug = normalizeTitle(title);

        if (!id) continue;

        // --- SMART DEDUPLICATION ---
        const existingManga = await query(`
            SELECT id FROM manga 
            WHERE id = @id 
            OR id = @slug 
            OR title = @title 
            OR REPLACE(REPLACE(title, ' ', '-'), ':', '') = @slug
        `, { id, slug: titleSlug, title });

        const isNewManga = existingManga.recordset.length === 0;
        const actualMangaId = existingManga.recordset?.[0]?.id || id;

        // Note: Manga insertion deferred to atomic transaction below
        if (isNewManga) {
            if (activeDeepCrawls < MAX_DEEP_CRAWLS) {
                activeDeepCrawls++;
                crawlFullMangaChapters(actualMangaId, sourceUrl, 'truyenqq').finally(() => { activeDeepCrawls--; });
            }
        }

        const latestChapEl = $(el).find('.last_chapter a');
        if (latestChapEl.length === 0) continue;

        const chapTitle = latestChapEl.text().trim();
        let chapUrl = latestChapEl.attr('href');
        if (chapUrl && chapUrl.startsWith('/')) chapUrl = safeJoinUrl(SOURCES.TRUYENQQ, chapUrl);
        
        const chapNum = parseChapterNumber(chapTitle);
        const chapSlug = chapUrl.split('/').pop()?.split('?')[0];
        const chapId = `${actualMangaId}_${chapSlug}`;

        const chapResult = await query(`
            SELECT id FROM Chapters WHERE id = @chapId OR (source_url = @url)
        `, { chapId, url: chapUrl });
            
        if (chapResult.recordset.length === 0) {
            console.log(`[TruyenQQ][New] ${title} -> ${chapTitle} (${chapNum})`);
            
            // --- GAP DETECTION ---
            const maxNumRes = await query("SELECT MAX(chapter_number) as m FROM Chapters WHERE manga_id = @mangaId", { mangaId: actualMangaId });
            const currentMax = maxNumRes.recordset[0]?.m || 0;

            // --- ATOMIC DISCOVERY: Manga & Chapter bound in one transaction ---
            await withTransaction(async (tx) => {
                await query(`
                    INSERT INTO manga (id, title, cover, source_url, normalized_title, last_crawled) 
                    VALUES (@actualMangaId, @title, @cover, @url, @normTitle, NOW())
                    ON CONFLICT (id) DO UPDATE 
                    SET cover = EXCLUDED.cover, last_crawled = NOW(), normalized_title = EXCLUDED.normalized_title
                `, { actualMangaId, title, cover, url: sourceUrl, normTitle: titleSlug }, tx);

                await query(`
                    INSERT INTO Chapters (id, manga_id, title, source_url, chapter_number) 
                    VALUES (@chapId, @mangaId, @title, @url, @chapNum);
                    
                    UPDATE Manga SET last_chap_num = @chapNum, last_crawled = NOW() WHERE id = @mangaId;
                `, { chapId, mangaId: actualMangaId, title: chapTitle, url: chapUrl, chapNum }, tx);
            });
            
            await queueChapterScrape(chapId, chapUrl, 'truyenqq');

            if (chapNum > currentMax + 1.2 && currentMax > 0) {
                console.log(`[Gap-Detected] ${actualMangaId}: DB ${currentMax} -> New ${chapNum}. Triggering deep sync.`);
                crawlFullMangaChapters(actualMangaId, sourceUrl, 'truyenqq');
            }

            newChaptersTotal++;
            existingInARow = 0;
        } else {
            existingInARow++;
            const existingId = chapResult.recordset?.[0]?.id;
            if (existingId) {
                const imgCheck = await query('SELECT COUNT(*) as count FROM "ChapterImages" WHERE chapter_id = @existingId', { existingId });
                if ((imgCheck.recordset?.[0]?.count || 0) === 0) {
                    await queueChapterScrape(existingId, chapUrl, 'truyenqq');
                }
            }
        }

        if (!full && !limitless && existingInARow >= 5) break;
    }

    const shouldContinue = limitless || (full && page < 5);
    if (shouldContinue) {
        await new Promise(r => setTimeout(r, limitless ? 3000 : 1000));
        newChaptersTotal += await crawlTruyenQQ(page + 1, full, limitless);
    }
    return newChaptersTotal;
  } catch (err) {
    console.error(`[TruyenQQ] Error on page ${page}:`, err.message);
    return 0;
  }
}

export async function crawlChapterImages(chapId, url, source = 'nettruyen', force = false, isJitSync = false) {
  // Concurrency Guard: Early return if already processing to avoid busy-wait loops
  if (inProgressChapters.has(chapId)) {
      console.log(`[Crawler] Chapter ${chapId} is already being processed. skipping.`);
      return;
  }
  
  inProgressChapters.add(chapId);


  try {
    if (!force) {
        const existing = await query('SELECT COUNT(*) as count FROM "ChapterImages" WHERE chapter_id = @chapId', { chapId });
        const count = existing.recordset?.[0]?.count || 0;
        if (count > 3) {
            inProgressChapters.delete(chapId);
            return count;
        }
    }

    const mangaInfo = await query('SELECT m.title, m.id as manga_id FROM "Manga" m JOIN "Chapters" c ON m.id = c.manga_id WHERE c.id = @chapId', { chapId });
    const mangaTitle = mangaInfo.recordset?.[0]?.title || 'Unknown Manga';

    const isTruyenQQ = source === 'truyenqq' || url.includes('truyenqq');
    const strategies = isTruyenQQ ? [
        { ref: url ? new URL(url).origin : 'https://truyenqqno.com/', name: 'Dynamic-Origin' },
        { ref: 'https://www.google.com/', name: 'Search-Engine' },
        { ref: '', name: 'Clean-Request' }
    ] : [
        { ref: url ? new URL(url).origin : 'https://www.nettruyenme.com/', source: 'dynamic-mirror' },
        { ref: 'https://www.nettruyenking.com/', source: 'king-mirror' },
        { ref: 'https://nettruyenon.com/', name: 'On-Domain' },
        { ref: '', name: 'Clean-Request' }
    ];

    let imagesFound = 0;

    const tryStrategy = async (strat) => {
        const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
        const response = await fetchWithRetry(url, { 
            headers: { 
                'Referer': strat.ref || url,
                'User-Agent': ua
            }
        });

        if (response.status === 404) throw new Error('404_LINK_DIE');

        const $ = cheerio.load(response.data);
        let imgElements = $(`
            .page-chapter img, .reading-detail .page-chapter img, 
            #chapter_content .page-chapter img, .chapter_content img, 
            #chapter_content img, .chapter-content img, .read-content img,
            .box-chap img, img.lazy, img[data-src], img[data-original], 
            img[data-cdn], img[data-index]
        `);
        
        if (imgElements.length < MIN_IMAGE_COUNT) throw new Error('NOT_ENOUGH_IMAGES');

        const batchImages = [];
        let currentOrder = 0;
        const IMAGE_BLACKLIST = ['lazyload.', 'pixel.', 'loading.', 'spacer.', 'transparent.', 'base64,', 'logo.', 'icon.'];

        for (let i = 0; i < imgElements.length; i++) {
            if (currentOrder >= 400) break; 
            const el = imgElements[i];
            const imgUrl = $(el).attr('data-src') || $(el).attr('data-original') || $(el).attr('data-cdn') || $(el).attr('src');
            
            if (!imgUrl || imgUrl.length < 12) continue;
            if (IMAGE_BLACKLIST.some(k => imgUrl.toLowerCase().includes(k))) continue;

            let finalUrl = imgUrl.startsWith('//') ? `https:${imgUrl}` : imgUrl;
            if (!finalUrl.startsWith('http')) {
                try {
                    finalUrl = new URL(finalUrl, url).href;
                } catch (e) {}
            }
            batchImages.push({ chapId, url: finalUrl, order: currentOrder++ });
        }

        if (batchImages.length < MIN_IMAGE_COUNT) throw new Error('EXTRACTION_FAILED');
        return { batchImages, strategy: strat.name || strat.source };
    };

    try {
        updateTelemetry({ status: 'scraping_images', currentManga: mangaTitle, currentImage: 'Racing strategies...' });
        
        // Race the top 2 strategies first, then fallback to others sequentially if needed
        const primaryStrategies = strategies.slice(0, 2);
        const { batchImages, strategy: winningStrategy } = await Promise.any(
            primaryStrategies.map(s => tryStrategy(s))
        ).catch(async () => {
            // Fallback: Sequential for the rest if racing failed
            for (const strat of strategies.slice(2)) {
                try {
                    return await tryStrategy(strat);
                } catch (e) {}
            }
            throw new Error('ALL_STRATEGIES_FAILED');
        });

        // TITAN ATOMIC INGESTION: Perform delete and insert in a single transaction
        await withTransaction(async (tx) => {
            await query("DELETE FROM chapterimages WHERE chapter_id = @chapId", { chapId }, tx);
            await bulkInsert('chapterimages', ['chapter_id', 'image_url', 'order'], batchImages.map(img => ({
                chapter_id: img.chapId,
                image_url: img.url,
                order: img.order
            })), tx);
        });
        
        imagesFound = batchImages.length;

    } catch (e) {
        console.error(`[Crawler] All strategies failed for ${chapId}:`, e.message);
    }

    // --- MAXIMUM INGESTION FALLBACK ---
    // If all primary mirrors failed, trigger a cross-platform recursive search
    if (imagesFound < MIN_IMAGE_COUNT && !isJitSync) {
        console.log(`[Aegis] Strategy failover for ${mangaTitle}. Attempting Cross-Platform Search...`);
        try {
            const altSource = source === 'nettruyen' ? 'truyenqq' : 'nettruyen';
            // searchAndIngestChapter is a helper that performs a headless-like search and ingestion
            const discoveryRes = await searchAndIngestChapter(mangaTitle, chapId, altSource);
            if (discoveryRes > 0) {
                success = true;
                imagesFound = discoveryRes;
            }
        } catch (err) {
            console.warn(`[Aegis] Ultimate failover failed:`, err.message);
        }
    }

    if (imagesFound >= MIN_IMAGE_COUNT) {
        updateTelemetry({ successCount: 1 });
        await logCrawl(`[OK] Da cao thanh cong ${imagesFound} anh cho: ${mangaTitle}`, 'success');
        return imagesFound;
    } else {
        updateTelemetry({ failCount: 1 });
        const diagInfo = imagesFound === 0 ? ` (Length: ${response?.data?.length || 0}, Snippet: ${String(response?.data || '').substring(0, 100).replace(/\s+/g, ' ')})` : '';
        await logCrawl(`[FAIL] Khong du anh (${imagesFound}/${MIN_IMAGE_COUNT}) cho: ${mangaTitle}${diagInfo}`, 'error');
        
        // --- AEGIS AUTO-MIGRATION TRIGGER ---
        // If we failed to find images, and this is a TruyenQQ source, attempt auto-migration
            const mangaIdCheck = await query('SELECT m.id, m.source_url, m.title FROM "Manga" m JOIN "Chapters" c ON m.id = c.manga_id WHERE c.id = @chapId', { chapId });
            const row = mangaIdCheck.recordset?.[0];
            if (row) {
                const { id, title, source_url } = row;
                console.warn(`[Aegis] Triggering emergency migration for blocked manga: ${title}`);
                // findAlternativeSource will update the DB if a match is found
                await findAlternativeSource(id, title, 'truyenqq');
            }
        
        return 0;
    }
    
  } catch (err) {
    console.error(`Error crawling images for ${chapId}:`, err.message);
    return 0;
    } finally {
        inProgressChapters.delete(chapId);
        // Phantom GC: Suggest memory release
        if (typeof global.gc === 'function' && process.memoryUsage().heapUsed > 800 * 1024 * 1024) {
            global.gc();
        }
    }
}

/**
 * Guardian Autopilot V2 (Infinite Background Worker)
 * Automatically handles discovery, gap healing, and image rescue.
 */
export async function runGuardianAutopilot() {
    if (global.guardianActive) return;
    global.guardianActive = true;
    
    
    console.log('[Titan] Continuous Streaming Activated. Engine Warming Up...');
    logCrawl('[System:Titan] Continuous Streaming mode has been activated.');

    let cycleCount = 0;

    while (true) {
        try {
            const startStr = new Date().toLocaleTimeString();
            cycleCount++;

            // --- RAM GUARD & Tẩy Tủy ---
            const mem = process.memoryUsage().heapUsed / 1024 / 1024;
            if (mem > 600) {
                console.log(`[Titan] High Memory Detected (${mem.toFixed(0)}MB). Performing system maintenance...`);
                await maintainSystem(cycleCount % 5 === 0 ? 1 : 0);
                await new Promise(r => setTimeout(r, 10000)); // Cool down
            }

            // --- ADAPTIVE BACKOFF (IP PROTECTION) ---
            if (global.globalFailureRate > 0.6) {
                console.warn(`[Titan] High failure rate (${(global.globalFailureRate * 100).toFixed(1)}%). Cooling down for 5 minutes...`);
                updateTelemetry({ status: 'cooling_down' });
                await new Promise(r => setTimeout(r, 5 * 60 * 1000));
                global.globalFailureRate = Math.max(0, global.globalFailureRate - 0.3); // Partial reset
            }

            // --- TITAN FLOW: SEQUENTIAL PIPELINE ---
            
            // Step 1: Rapid Discovery (Always New items)
            updateTelemetry({ status: 'titan_discovery' });
            await crawlLatest(false, false);
            
            // Step 2: Micro-Healing (2 items at a time to keep RAM low)
            updateTelemetry({ status: 'titan_healing' });
            await healChapterGaps(2);
            
            // Step 3: Micro-Rescue (3 items at a time)
            updateTelemetry({ status: 'titan_rescue' });
            await rescueBrokenImages(3);

            // Step 4: Metadata Refetch
            if (cycleCount % 3 === 0) {
                updateTelemetry({ status: 'titan_refresh' });
                await refreshActiveManga(5);
            }

            // TITAN BREATH: Very short pause to clear Event Loop (15 - 30 seconds)
            const breathSeconds = 15 + Math.floor(Math.random() * 15);
            updateTelemetry({ 
                status: 'idle', 
                guardianNextCycle: new Date(Date.now() + breathSeconds * 1000).toISOString(),
                guardianActive: true 
            });
            
            console.log(`[Titan] Cycle #${cycleCount} completed. Breathing for ${breathSeconds}s...`);
            await new Promise(r => setTimeout(r, breathSeconds * 1000));

        } catch (e) {
            console.error('[Titan] Engine Stalled:', e.message);
            await logCrawl(`[System:Error] Titan Stream Error: ${e.message}`, 'error');
            await new Promise(r => setTimeout(r, 30000)); // Quick 30s reset
        }
    }
}

/**
 * searchSource: Performs a keyword search on NetTruyen or TruyenQQ
 */
async function searchSource(queryStr, source = 'nettruyen') {
    const encoded = encodeURIComponent(queryStr);
    const url = source === 'nettruyen' 
        ? `${SOURCES.NETTRUYEN}tim-truyen?keyword=${encoded}`
        : `${SOURCES.TRUYENQQ}tim-kiem.html?q=${encoded}`;
    
    try {
        const res = await fetchWithRetry(url, { isDiscovery: true });
        const $ = cheerio.load(res.data);
        const results = [];

        if (source === 'nettruyen') {
            $('.items .item').each((i, el) => {
                const title = $(el).find('h3 a').text().trim();
                const url = $(el).find('h3 a').attr('href');
                if (title && url) results.push({ title, url });
            });
        } else {
            $('.list_chapter li, .book_item').each((i, el) => {
                const title = $(el).find('h3 a').text().trim();
                const url = $(el).find('h3 a').attr('href');
                if (title && url) results.push({ title, url });
            });
        }
        return results;
    } catch (e) {
        console.error(`[Search][${source}] Search failed for ${queryStr}:`, e.message);
        return [];
    }
}

/**
 * findAlternativeSource: Aegis V4 Migration Engine
 * Triggered on 404 to find a working link on a different source.
 */
async function findAlternativeSource(mangaId, title, fromSource) {
    // Throttling: Check if this manga has migrated too many times
    const meta = await query("SELECT migration_count FROM Manga WHERE id = @mangaId", { mangaId });
    if (meta.recordset[0]?.migration_count >= 3) {
        console.warn(`[Aegis][Block] Manga "${title}" has reached migration limit (3). Abandoning automated rescue.`);
        return null;
    }

    const targetSource = fromSource === 'truyenqq' || fromSource === 'qq' ? 'nettruyen' : 'truyenqq';
    console.log(`[Aegis] Searching alternative for "${title}" on ${targetSource}...`);
    
    // Normalize query: Remove noise that makes search fail
    const queryStr = cleanTitleForSearch(title)
        .replace(/truyện tranh/gi, '')
        .replace(/manga/gi, '')
        .trim();

    const results = await searchSource(queryStr, targetSource);
    if (results.length === 0) {
        console.warn(`[Aegis] No alternatives found for "${title}" on ${targetSource}.`);
        return null;
    }

    // Fuzzy matching 3.0: High-confidence scoring
    const cleanOriginal = normalizeTitle(title);
    const match = results.find(r => {
        const cleanCandidate = normalizeTitle(r.title);
        // Direct match or significant overlap
        return cleanCandidate === cleanOriginal || 
               cleanCandidate.includes(cleanOriginal) || 
               cleanOriginal.includes(cleanCandidate) ||
               (cleanCandidate.length > 5 && cleanOriginal.substring(0, 10) === cleanCandidate.substring(0, 10));
    });

    if (match) {
        console.log(`[Aegis] FOUND MATCH: "${match.title}" -> ${match.url}`);
        
        // Ensure URL is absolute for consistency
        let finalMatchUrl = match.url;
        if (!finalMatchUrl.startsWith('http')) {
            const base = targetSource === 'nettruyen' ? SOURCES.NETTRUYEN : SOURCES.TRUYENQQ;
            finalMatchUrl = safeJoinUrl(base, finalMatchUrl);
        }

        await query("UPDATE Manga SET source_url = @url, migration_count = COALESCE(migration_count, 0) + 1, last_crawled = NOW() WHERE id = @mangaId", { 
            url: finalMatchUrl, 
            mangaId 
        });
        
        
        await logCrawl(`[Aegis:Sync] Automatically migrated manga "${title}" to new source (${targetSource})`, 'info');
        await logGuardianEvent(mangaId, 'Migration', 'AEGIS_ACTIVE', `System automatically migrated data source for ${title} to bypass provider blocks.`);
        
        // Immediate priority re-sync
        return crawlFullMangaChapters(mangaId, finalMatchUrl, targetSource, true);
    } else {
        console.warn(`[Aegis] Search found ${results.length} items but no high-confidence match for "${title}".`);
        return null;
    }
}

/**
 * Maintenance Engine
 * Attempts explicit garbage collection if launched with --expose-gc
 */
export async function maintainSystem(level = 0) {
    try {
        const { cleanLegacyEncoding } = await import('./db.js');
        await cleanLegacyEncoding();

        if (typeof global.gc === 'function') {
            global.gc();
        }
        
        // Prune logs if level 1+ (PostgreSQL Native Syntax)
        if (level > 0) {
            await query("DELETE FROM CrawlLogs WHERE created_at < NOW() - INTERVAL '5 days'");
            await query("DELETE FROM GuardianReports WHERE created_at < NOW() - INTERVAL '7 days'");
        }
    } catch (e) {}
}

/**
 * searchAndIngestChapter: The ultimate 'Aegis' failover for JIT-Sync
 * Searches for a manga on a different platform and attempts to ingest a specific chapter.
 */
export async function searchAndIngestChapter(title, originalChapId, targetPlatform = 'truyenqq') {
    try {
        console.log(`[Aegis-JIT] Searching for "${title}" on ${targetPlatform}...`);
        const searchResults = await searchSource(title, targetPlatform);
        
        if (searchResults.length === 0) return 0;
        
        const cleanTitle = normalizeTitle(title);
        const match = searchResults.find(r => normalizeTitle(r.title).includes(cleanTitle) || cleanTitle.includes(normalizeTitle(r.title)));
        
        if (!match) return 0;
        
        console.log(`[Aegis-JIT] Found candidate: ${match.title} at ${match.url}`);
        
        // Fetch the candidate manga page to get chapter list
        const res = await fetchWithRetry(match.url, { isDiscovery: true });
        const $ = cheerio.load(res.data);
        const chapters = [];
        
        if (targetPlatform === 'truyenqq') {
            $('.works-chapter-list .works-chapter-item a').each((i, el) => {
                chapters.push({ title: $(el).text().trim(), url: $(el).attr('href') });
            });
        } else {
            $('.list-chapter li.row a').each((i, el) => {
                chapters.push({ title: $(el).text().trim(), url: $(el).attr('href') });
            });
        }
        
        // Find original chapter number
        const origData = await query("SELECT chapter_number FROM Chapters WHERE id = @id", { id: originalChapId });
        const targetNum = origData.recordset[0]?.chapter_number;
        
        if (!targetNum) return 0;
        
        const targetChap = chapters.find(c => {
            const numMatch = c.title.match(/(\d+(\.\d+)?)/);
            return numMatch && parseFloat(numMatch[0]) === targetNum;
        });
        
        if (targetChap) {
            console.log(`[Aegis-JIT] Found matching chapter ${targetNum} at ${targetChap.url}`);
            return await crawlChapterImages(originalChapId, targetChap.url, targetPlatform, true);
        }
        
        return 0;
    } catch (e) {
        console.error(`[Aegis-JIT] Failover ingestion failed:`, e.message);
        return 0;
    }
}

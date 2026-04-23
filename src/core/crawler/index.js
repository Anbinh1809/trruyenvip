/**
 * Titan Crawler V2 - Modular Engine
 */
import axios from 'axios';
import http from 'http';
import https from 'https';
import { query, withTransaction, bulkInsert } from '../database/connection.js';
import { safeJoinUrl, normalizeTitle, parseChapterNumber, cleanTitleForSearch, inferAlternativeMirrors } from './utils.js';
import { getOptimizedMirrors, quarantineMirror, rewardMirror, USER_AGENTS, SEARCH_REFERERS } from './mirrors.js';
import { updateTelemetry, logGuardianEvent } from './telemetry.js';

const axiosAgent = axios.create({
    httpAgent: new http.Agent({ keepAlive: true, maxSockets: 32 }),
    httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 32, rejectUnauthorized: false }),
    timeout: 60000 
});

/**
 * Core networking engine with racing mirror support
 */
export async function fetchWithRetry(url, options = {}, retries = 2) {
    const mirrors = getOptimizedMirrors(url);
    const defaultTimeout = options.isDiscovery ? 60000 : 95000;
    const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    const searchReferer = SEARCH_REFERERS[Math.floor(Math.random() * SEARCH_REFERERS.length)];
    
    // Random jitter to avoid fingerprinting
    await new Promise(r => setTimeout(r, Math.floor(Math.random() * 600) + 200));

    const tryMirror = async (mirrorUrl, delay = 0) => {
        if (delay > 0) await new Promise(r => setTimeout(r, delay));
        
        let finalUrl = url;
        if (url.startsWith('/') || url.includes('nettruyen') || url.includes('truyenqq') || url.includes('nettruyeno') || url.includes('ye2030.co.uk') || url.includes('truyenqqno.com') || url.includes('truyenqqq.com')) {
            try {
                const parsedUrl = new URL(url);
                finalUrl = safeJoinUrl(mirrorUrl, parsedUrl.pathname + parsedUrl.search);
            } catch (e) {
                finalUrl = url.startsWith('/') ? safeJoinUrl(mirrorUrl, url) : url;
            }
        }

        const headers = { 
            'User-Agent': options.headers?.['User-Agent'] || ua,
            'Referer': options.headers?.Referer || searchReferer,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8',
            ...options.headers
        };

        try {
            const startTime = Date.now();
            const response = await axiosAgent.get(finalUrl, { timeout: options.timeout || defaultTimeout, headers });
            const latency = Date.now() - startTime;
            
            // Titan Challenge Detection
            if (response.data && typeof response.data === 'string') {
                const lowerData = response.data.toLowerCase();
                const isChallenge = lowerData.includes('just a moment') || 
                                  lowerData.includes('checking your browser') ||
                                  lowerData.includes('cloudflare-static') ||
                                  lowerData.includes('ddos-guard');
                
                if (isChallenge) throw { code: 'CHALLENGE_DETECTED', mirror: mirrorUrl };
            }
            
            rewardMirror(mirrorUrl);
            updateTelemetry({ currentLatency: latency });
            return response;
        } catch (err) {
            // Do not quarantine a healthy mirror just because the specific chapter URL is 404
            if (err.response && err.response.status === 404) {
                throw { code: 'CONTENT_NOT_FOUND', message: 'Chapter or Manga deleted from source (404)' };
            }
            quarantineMirror(mirrorUrl);
            throw err;
        }
    };

    // POLARIS SEQUENTIAL ATTEMPTS: Stable and respectful to mirrors
    for (const mirror of mirrors) {
        try {
            return await tryMirror(mirror);
        } catch (err) {
            if (err.code === 'CONTENT_NOT_FOUND') {
                throw new Error(`CONTENT_NOT_FOUND: ${url}`);
            }
            const errMsg = err?.message || err?.code || JSON.stringify(err);
            console.warn(`[Crawler:Mirror] Failed for ${mirror}: ${errMsg}`);
            continue;
        }
    }

    // AEGIS INTELLIGENCE: Autonomous Mirror Inference
    const inferred = inferAlternativeMirrors(mirrors[0]);
    if (inferred.length > 0) {
        console.log(`[Aegis:Intelligence] Hardcoded mirrors failed. Attempting domain inference...`);
        for (const mirror of inferred.slice(0, 3)) {
            try { return await tryMirror(mirror); } catch (err) {}
        }
    }

    throw new Error('ALL_MIRRORS_FAILED');
}


/**
 * Public API Exports
 */
export { 
    queueMangaSync, 
    crawlFullMangaChapters, 
    crawlChapterImages,
    healChapterGaps,
    rescueBrokenImages,
    bootstrapCrawler,
    queueChapterScrape,
    queueDiscovery,
    processQueue,
    runTitanWorker,
    crawlLatest,
    runGuardianAutopilot
} from './engine.js';

export { 
    parseChapterNumber, 
    normalizeTitle, 
    safeJoinUrl, 
    cleanTitleForSearch 
} from './utils.js';

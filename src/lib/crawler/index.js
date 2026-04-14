/**
 * Titan Crawler V2 - Modular Engine
 */
import axios from 'axios';
import http from 'http';
import https from 'https';
import { query, withTransaction, bulkInsert } from '../db.js';
import { safeJoinUrl, normalizeTitle, parseChapterNumber, cleanTitleForSearch } from './utils.js';
import { getOptimizedMirrors, quarantineMirror, rewardMirror, USER_AGENTS, SEARCH_REFERERS } from './mirrors.js';
import { updateTelemetry, logGuardianEvent } from './telemetry.js';

const axiosAgent = axios.create({
    httpAgent: new http.Agent({ keepAlive: true, maxSockets: 50 }),
    httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 50, rejectUnauthorized: false }),
    timeout: 30000
});

/**
 * Core networking engine with racing mirror support
 */
export async function fetchWithRetry(url, options = {}, retries = 2) {
    const mirrors = getOptimizedMirrors(url);
    const defaultTimeout = options.isDiscovery ? 25000 : 40000;
    const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    const searchReferer = SEARCH_REFERERS[Math.floor(Math.random() * SEARCH_REFERERS.length)];

    const tryMirror = async (mirrorUrl, delay = 0) => {
        if (delay > 0) await new Promise(r => setTimeout(r, delay));
        
        let finalUrl = url;
        if (url.includes('nettruyen') || url.includes('truyenqq')) {
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
            quarantineMirror(mirrorUrl);
            throw err;
        }
    };

    // TITAN V3 SUPER RACING: Fast, simultaneous mirror racing
    // We race the top 3 mirrors with slight staggering to optimize resources
    const racers = [
        tryMirror(mirrors[0], 0),
        mirrors[1] ? tryMirror(mirrors[1], 400) : null,
        mirrors[2] ? tryMirror(mirrors[2], 1200) : null
    ].filter(Boolean);

    try {
        return await Promise.any(racers);
    } catch (e) {
        // AEGIS INTELLIGENCE: Autonomous Mirror Inference
        // If hardcoded mirrors fail, predict the next evolution based on common patterns
        const inferred = inferAlternativeMirrors(mirrors[0]);
        if (inferred.length > 0) {
            console.log(`[Aegis:Intelligence] Hardcoded mirrors failed. Attempting domain inference for ${mirrors[0]}...`);
            for (const mirror of inferred.slice(0, 3)) {
                try { return await tryMirror(mirror); } catch (err) {}
            }
        }

        // Emergency Fallback: Sequential try for all others
        const remaining = mirrors.slice(3);
        if (remaining.length === 0) throw new Error('ALL_MIRRORS_FAILED');
        
        for (const mirror of remaining) {
            try { return await tryMirror(mirror); } catch (err) {}
        }
        throw new Error('ALL_MIRRORS_FAILED');
    }
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
    runTitanWorker
} from './engine.js';

export { 
    parseChapterNumber, 
    normalizeTitle, 
    safeJoinUrl, 
    cleanTitleForSearch 
} from './utils.js';

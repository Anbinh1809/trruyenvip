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
    const defaultTimeout = options.isDiscovery ? 12000 : 25000;
    const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    const searchReferer = SEARCH_REFERERS[Math.floor(Math.random() * SEARCH_REFERERS.length)];

    const tryMirror = async (mirrorUrl) => {
        let finalUrl = url;
        if (url.includes('nettruyen')) {
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
            ...options.headers
        };

        try {
            const response = await axiosAgent.get(finalUrl, { timeout: options.timeout || defaultTimeout, headers });
            
            // Challenge detection
            if (response.data && typeof response.data === 'string') {
                const lowerData = response.data.toLowerCase();
                const isChallenge = lowerData.includes('just a moment') || lowerData.includes('please wait');
                if (isChallenge) throw { code: 'CHALLENGE_DETECTED', mirror: mirrorUrl };
            }
            
            rewardMirror(mirrorUrl);
            return response;
        } catch (err) {
            quarantineMirror(mirrorUrl);
            throw err;
        }
    };

    // Racing Strategy
    const primaryMirrors = mirrors.slice(0, 2);
    try {
        return await Promise.any(primaryMirrors.map(m => tryMirror(m)));
    } catch (e) {
        // Fallback to sequential for others
        for (const mirror of mirrors.slice(2)) {
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
    runGuardianAutopilot, 
    healChapterGaps,
    rescueBrokenImages,
    bootstrapCrawler,
    queueChapterScrape,
    queueDiscovery
} from './engine.js';

export { 
    parseChapterNumber, 
    normalizeTitle, 
    safeJoinUrl, 
    cleanTitleForSearch 
} from './utils.js';

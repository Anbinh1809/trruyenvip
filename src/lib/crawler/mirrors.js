/**
 * Mirror Intelligence & Racing Engine
 */

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

// Global state tracking
global.mirrorScores = global.mirrorScores || {};
SOURCES.NETTRUYEN_MIRRORS.forEach(m => {
    if (global.mirrorScores[m] === undefined) global.mirrorScores[m] = 100;
});

global.mirrorQuarantine = global.mirrorQuarantine || {};

export const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0'
];

export const SEARCH_REFERERS = [
    'https://www.google.com/',
    'https://www.bing.com/',
    'https://duckduckgo.com/',
    'https://www.facebook.com/'
];

/**
 * Returns sorted mirrors by score
 */
export function getOptimizedMirrors(sourceUrl) {
    if (!sourceUrl.includes('nettruyen')) return [sourceUrl];
    
    const now = Date.now();
    let mirrors = [...SOURCES.NETTRUYEN_MIRRORS].filter(m => !global.mirrorQuarantine[m] || global.mirrorQuarantine[m] < now);
    
    if (mirrors.length === 0) mirrors = [...SOURCES.NETTRUYEN_MIRRORS];
    
    return mirrors.sort((a, b) => (global.mirrorScores[b] || 0) - (global.mirrorScores[a] || 0));
}

/**
 * Quarantines a mirror on failure
 */
export function quarantineMirror(mirrorUrl, durationMs = 300000) {
    global.mirrorQuarantine[mirrorUrl] = Date.now() + durationMs;
    global.mirrorScores[mirrorUrl] = Math.max(0, (global.mirrorScores[mirrorUrl] || 100) - 20);
}

/**
 * Rewards a mirror on success
 */
export function rewardMirror(mirrorUrl) {
    global.mirrorScores[mirrorUrl] = Math.min(100, (global.mirrorScores[mirrorUrl] || 100) + 1);
}

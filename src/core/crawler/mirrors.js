/**
 * Mirror Intelligence & Racing Engine
 */

export const SOURCES = {
    NETTRUYEN: 'https://nettruyenww.com/',
    NETTRUYEN_MIRRORS: [
        'https://nettruyenww.com/',
        'https://nettruyenplus.com/',
        'https://nettruyenviet.com/',
        'https://nettruyenio.com/',
        'https://www.nettruyen.me/'
    ],
    TRUYENQQ: 'https://truyenqqq.com/',
    TRUYENQQ_MIRRORS: [
        'https://truyenqqq.com/',
        'https://truyenqq.top/',
        'https://truyenqq.info/',
        'https://truyenqqvn.com/',
    ]
};

// Global state tracking
global.mirrorScores = global.mirrorScores || {};
[...SOURCES.NETTRUYEN_MIRRORS, ...SOURCES.TRUYENQQ_MIRRORS].forEach(m => {
    if (global.mirrorScores[m] === undefined) global.mirrorScores[m] = 100;
});

global.mirrorQuarantine = global.mirrorQuarantine || {};

export const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0',
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36'
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
    let sourceMirrors = [];
    if (sourceUrl.includes('nettruyen')) {
        sourceMirrors = SOURCES.NETTRUYEN_MIRRORS;
    } else if (sourceUrl.includes('truyenqq')) {
        sourceMirrors = SOURCES.TRUYENQQ_MIRRORS;
    } else {
        return [sourceUrl];
    }
    
    const now = Date.now();
    let mirrors = [...sourceMirrors].filter(m => !global.mirrorQuarantine[m] || global.mirrorQuarantine[m] < now);
    
    if (mirrors.length === 0) mirrors = [...sourceMirrors];
    
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

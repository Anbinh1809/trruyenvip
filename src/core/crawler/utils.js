/**
 * Titan Crawler Utilities
 */

/**
 * Robustly joins base URL and a path
 */
export function safeJoinUrl(base, path) {
    if (!path) return base;
    if (path.startsWith('http')) return path;
    const baseUrl = base.endsWith('/') ? base.slice(0, -1) : base;
    const pathUrl = path.startsWith('/') ? path : '/' + path;
    return baseUrl + pathUrl;
}

/**
 * Normalized slug creation
 */
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
 * Clean titles for better matching during cross-source discovery
 */
export function cleanTitleForSearch(title) {
    if (!title) return '';
    return title.toLowerCase()
        .replace(/\(full\)/g, '')
        .replace(/\(m?i\)/g, '')
        .replace(/chapter\s*\d+/g, '')
        .replace(/chap\s*\d+/g, '')
        .replace(/tóm lược/g, '') 
        .replace(/[-\s]+/g, ' ')
        .trim();
}

/**
 * Industrial-grade chapter number parsing
 */
export function parseChapterNumber(title) {
    if (!title) return null;
    
    // Support for: Chương, Chapter, Chap, Ch, Hồi
    // N2 FIX: Removed [\s] wildcard that caused false positives (e.g. "ABC 2024" → 2024)
    const standardMatch = title.match(/(?:chương|chapter|chap|ch\.|hồi|hoi)\s*(\d+(?:\.\d+)?)/i);
    if (standardMatch) {
        let num = parseFloat(standardMatch[1]);
        
        // Handle "Phần" or "Part" suffixes
        const partMatch = title.match(/(?:phần|phan|part|p)\s*(\d+)/i);
        if (partMatch) {
            const partNum = parseInt(partMatch[1]);
            if (partNum > 1 && !standardMatch[1].includes('.')) {
                num += partNum * 0.1;
            }
        }
        return num;
    }
    
    const fallbackMatch = title.match(/(\d+(?:\.\d+)?)/);
    return fallbackMatch ? parseFloat(fallbackMatch[1]) : null;
}
/**
 * TITAN DOMAIN INFERENCE: Predicts potential new domains when old ones die
 */
export function inferAlternativeMirrors(mirrorUrl) {
    if (!mirrorUrl) return [];
    try {
        const url = new URL(mirrorUrl);
        const domain = url.hostname;
        const base = domain.split('.').slice(0, -1).join('.');
        
        // Common TLD evolution patterns in Vietnam
        const tlds = ['tv', 'com', 'us', 'win', 'pro', 'me', 'info', 'asia'];
        return tlds
            .map(tld => `${url.protocol}//${base}.${tld}/`)
            .filter(m => m !== mirrorUrl);
    } catch {
        return [];
    }
}

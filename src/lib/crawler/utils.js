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
        .replace(/t?m l?/g, '') 
        .replace(/[-\s]+/g, ' ')
        .trim();
}

/**
 * Industrial-grade chapter number parsing
 */
export function parseChapterNumber(title) {
    if (!title) return null;
    
    // Support for: Chương, Chapter, Chap, Ch, C, Hồi
    const standardMatch = title.match(/(?:chương|chapter|chap|ch|c|hồi|hoi|[\s])\s*(\d+(?:\.\d+)?)/i);
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

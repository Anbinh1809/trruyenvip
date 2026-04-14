import crypto from 'crypto';

const PROXY_SECRET = process.env.PROXY_SECRET || 'titan-default-9381-secret-kjsd8';

/**
 * Generates a deterministic signature for a proxy request.
 * @param {string} url - The target image URL.
 * @param {number|string} w - Width parameter.
 * @param {number|string} q - Quality parameter.
 * @returns {string} - The HMAC signature hex string.
 */
export function generateProxySignature(url, w, q) {
    const data = `${url}|${w}|${q}`;
    return crypto.createHmac('sha256', PROXY_SECRET)
                 .update(data)
                 .digest('hex')
                 .substring(0, 16); // 16 chars is enough for this use case
}

/**
 * Verifies if a given signature matches the current secret for the given parameters.
 */
export function verifyProxySignature(url, w, q, sig) {
    if (!sig) return false;
    const expected = generateProxySignature(url, w, q);
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

/**
 * Helper to build a signed proxy URL.
 */
export function getSignedProxyUrl(url, w = 0, q = 75) {
    if (!url) return '/placeholder-manga.svg';
    const sig = generateProxySignature(url, w, q);
    return `/api/proxy?url=${encodeURIComponent(url)}&w=${w}&q=${q}&sig=${sig}`;
}

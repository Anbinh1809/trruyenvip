/**
 * crypto.js — Titan Proxy Security
 * 
 * IMPORTANT: generateProxySignature and verifyProxySignature use Node.js `crypto`
 * and must only be called in server-side code (API routes, server components).
 *
 * getSignedProxyUrl MUST ONLY BE CALLED ON THE SERVER.
 */

import crypto from 'crypto';

const PROXY_SECRET = process.env.PROXY_SECRET;
const FALLBACK_SECRET = 'titan-industrial-fallback-9381-secret-kjsd8';
const ACTIVE_SECRET = PROXY_SECRET || FALLBACK_SECRET;

if (!PROXY_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('[Titan:Crypto] WARNING: PROXY_SECRET is missing. Security is using fallback. Ensure secrets are set in your production environment!');
}

/**
 * Server-side: Generates a deterministic HMAC signature.
 * Only call from API routes / server components.
 */
export function generateProxySignature(url, w, q) {
    const data = `${url}|${w}|${q}`;
    return crypto.createHmac('sha256', ACTIVE_SECRET)
                 .update(data)
                 .digest('hex')
                 .substring(0, 16);
}

/**
 * Server-side: Verifies a proxy signature.
 */
export function verifyProxySignature(url, w, q, sig) {
    if (!sig) return false;
    try {
        const expected = generateProxySignature(url, w, q);
        return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
    } catch {
        return false;
    }
}


/**
 * Server-Side Proxy URL Builder
 * Generates an HMAC-signed proxy URL.
 */
export function getSignedProxyUrl(url, w = 0, q = 75) {
    if (!url) return '/placeholder-manga.svg';
    const sig = generateProxySignature(url, w, q);
    return `/api/proxy?url=${encodeURIComponent(url)}&w=${w}&q=${q}&sig=${sig}`;
}

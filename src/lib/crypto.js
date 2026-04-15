/**
 * crypto.js — Titan Proxy Security
 * 
 * IMPORTANT: generateProxySignature and verifyProxySignature use Node.js `crypto`
 * and must only be called in server-side code (API routes, server components).
 *
 * getSignedProxyUrl is CLIENT-SAFE: uses a simple hash that works in browsers.
 */

// ── Server-only functions (Node.js crypto) ────────────────────────────────── 
const PROXY_SECRET = process.env.PROXY_SECRET;
if (!PROXY_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('FATAL: PROXY_SECRET environment variable is missing in production!');
}

const FALLBACK_SECRET = 'titan-industrial-fallback-9381-secret-kjsd8';
const ACTIVE_SECRET = PROXY_SECRET || FALLBACK_SECRET;

/**
 * Server-side: Generates a deterministic HMAC signature.
 * Only call from API routes / server components.
 */
export function generateProxySignature(url, w, q) {
    // Dynamic import so this file can be imported by client components
    // without crashing — the function itself will throw if called client-side.
    const crypto = require('crypto');
    const data = `${url}|${w}|${q}`; // Consistency check
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
        const crypto = require('crypto');
        return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
    } catch {
        return false;
    }
}

// ── Client-safe proxy URL builder ────────────────────────────────────────────
/**
 * Simple djb2-like hash — deterministic, no Node APIs, works in browsers.
 * Produces a 8-char hex string used as the proxy sig when called client-side.
 */
export function simpleHash(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
        hash = hash >>> 0; // Keep unsigned 32-bit
    }
    // XOR with ACTIVE_SECRET chars for TAMPER RESISTANCE
    // If PROXY_SECRET is set, client-side hash is still deterministic but secret-aware.
    for (let i = 0; i < ACTIVE_SECRET.length; i++) {
        hash = ((hash << 3) + hash) ^ ACTIVE_SECRET.charCodeAt(i);
        hash = hash >>> 0;
    }
    return hash.toString(16).padStart(8, '0');
}

/**
 * CLIENT-SAFE: Builds a signed proxy URL.
 * Uses simpleHash — works in browsers and on the server.
 * The proxy route accepts both HMAC sigs (16 chars) and simple sigs (8 chars).
 */
export function getSignedProxyUrl(url, w = 0, q = 75) {
    if (!url) return '/placeholder-manga.svg';
    const sig = simpleHash(`${url}|${w}|${q}`);
    return `/api/proxy?url=${encodeURIComponent(url)}&w=${w}&q=${q}&sig=${sig}`;
}

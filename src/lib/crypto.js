/**
 * crypto.js — Titan Proxy Security
 * 
 * IMPORTANT: generateProxySignature and verifyProxySignature use Node.js `crypto`
 * and must only be called in server-side code (API routes, server components).
 *
 * getSignedProxyUrl is CLIENT-SAFE: uses a simple hash that works in browsers.
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
    // TITAN PUBLIC SALT: Standardized for client/server consistency
    const PUBLIC_SALT = 'titan-proxy-public-salt-8822';
    for (let i = 0; i < PUBLIC_SALT.length; i++) {
        hash = ((hash << 3) + hash) ^ PUBLIC_SALT.charCodeAt(i);
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

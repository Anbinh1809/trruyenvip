/**
 * TITAN PWA - SERVICE WORKER
 * Optimized for high-speed manga reading shell.
 */

const CACHE_NAME = 'truyenvip-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/manifest.json',
    '/favicon.ico',
    '/apple-icon.png',
    '/placeholder-manga.svg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Only cache GET requests
    if (request.method !== 'GET') return;

    // Don't cache API or proxy requests to avoid stale data/OOM
    if (request.url.includes('/api/')) return;

    // Stale-while-revalidate for static assets
    event.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.match(request).then((response) => {
                const fetchPromise = fetch(request).then((networkResponse) => {
                    if (networkResponse.ok) {
                        cache.put(request, networkResponse.clone());
                    }
                    return networkResponse;
                });
                return response || fetchPromise;
            });
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) return caches.delete(name);
                })
            );
        })
    );
});

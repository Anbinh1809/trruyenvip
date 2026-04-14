'use client';

import { useEffect } from 'react';

/**
 * TITAN SW REGISTRATION
 * Safe, client-side lifecycle management for the Service Worker.
 */
export default function SWRegistration() {
    useEffect(() => {
        if ('serviceWorker' in navigator && window.location.protocol === 'https:' || window.location.hostname === 'localhost') {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then((registration) => {
                        console.log('[Titan PWA] Service Worker registered:', registration.scope);
                    })
                    .catch((err) => {
                        console.error('[Titan PWA] Service Worker registration failed:', err);
                    });
            });
        }
    }, []);

    return null; // pure logic component
}

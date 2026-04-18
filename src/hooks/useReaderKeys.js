'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useReaderKeys(mId, prevId, nextId) {
    const router = useRouter();

    useEffect(() => {
        const handleKeys = (e) => {
            // Ignore if user is typing in comments/search
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

            switch (e.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    if (prevId) {
                        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
                        router.push(`/manga/${mId}/chapter/${prevId}`);
                    }
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    if (nextId) {
                        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
                        router.push(`/manga/${mId}/chapter/${nextId}`);
                    }
                    break;
                case 'h':
                case 'H':
                    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
                    router.push(`/manga/${mId}`);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [mId, prevId, nextId, router]);
}

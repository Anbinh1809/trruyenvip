'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ReaderManager({ prevChapterId, nextChapterId, mangaId }) {
    const router = useRouter();

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Only trigger if not typing in an input/textarea
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.key === 'ArrowLeft' && prevChapterId && !e.ctrlKey && !e.shiftKey && !e.altKey) {
                router.push(`/manga/${mangaId}/chapter/${prevChapterId}`);
            } else if (e.key === 'ArrowRight' && nextChapterId && !e.ctrlKey && !e.shiftKey && !e.altKey) {
                router.push(`/manga/${mangaId}/chapter/${nextChapterId}`);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [prevChapterId, nextChapterId, mangaId, router]);

    return null;
}

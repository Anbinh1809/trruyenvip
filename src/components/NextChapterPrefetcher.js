'use client';

import { useEffect, useState } from 'react';

/**
 * NextChapterPrefetcher
 * Stealthily pre-loads images for the next chapter into the browser cache
 */
export default function NextChapterPrefetcher({ nextChapterId, nextChapterImages = [] }) {
  const [prefetched, setPrefetched] = useState(false);

  useEffect(() => {
    if (!nextChapterId || prefetched) return;

    const prefetchImages = async () => {
        // Wait slightly after main content loads to avoid competing for bandwidth
        await new Promise(r => setTimeout(r, 3000));
        
        // ORACLE PRE-SYNC: If no images found in DB, trigger a silent JIT-Sync
        if (nextChapterImages.length === 0) {
            console.log(`[Oracle] Neural Gap Detected. Silently triggering JIT-Sync for: ${nextChapterId}`);
            try {
                await fetch('/api/crawler/jit-sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chapterId: nextChapterId })
                });
                // Note: We don't wait for it to finish, as the CrawlerTasks will handle it.
                setPrefetched(true);
                return;
            } catch (e) {
                console.error('[Oracle] JIT-Sync Trigger failed:', e.message);
            }
        }

        console.log(`[Oracle] Optimistically pre-fetching ${nextChapterImages.length} images for chapter: ${nextChapterId}`);
        
        // Pre-fetch only the first 5 images to save bandwidth while still giving a massive performance boost
        const slice = nextChapterImages.slice(0, 5);
        
        const promises = slice.map(img => {
            return new Promise((resolve) => { 
                const i = new Image();
                i.onload = resolve;
                i.onerror = resolve; 
                i.src = img.image_url.startsWith('http') 
                    ? `/api/proxy?url=${encodeURIComponent(img.image_url)}&w=1200` 
                    : img.image_url;
            });
        });

        await Promise.all(promises);
        setPrefetched(true);
        console.log(`[Oracle] Next chapter pre-fetch complete.`);
    };

    prefetchImages();
  }, [nextChapterId, nextChapterImages, prefetched]);

  return null; // Invisible sentinel
}

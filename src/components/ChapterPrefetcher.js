'use client';

import { useEffect, useRef } from 'react';
import { useHistory } from '@/context/HistoryContext';
import { useAuth } from '@/context/AuthContext';

/**
 * ChapterPrefetcher - Proactively syncs chapters based on user history.
 * This runs silently in the background of the Manga Detail page.
 */
export default function ChapterPrefetcher({ mangaId, chapters = [] }) {
  const { history, mounted } = useHistory();
  const { isAuthenticated } = useAuth();
  const hasPrefetchedRef = useRef(false);

  useEffect(() => {
    if (!mounted || !isAuthenticated || chapters.length === 0 || hasPrefetchedRef.current) return;

    const prefetchChapters = async () => {
        hasPrefetchedRef.current = true;
        
        // 1. Identify Target Chapters
        const targets = [];
        
        // Find if user has a history with this manga
        const record = history.find(h => h.mangaId === mangaId);
        
        if (record) {
            // Find current index in the chapter list
            const currentIdx = chapters.findIndex(c => c.id === record.chapterId);
            if (currentIdx > 0) {
                // Since chapters are DESC, currentIdx - 1 is the NEXT chapter
                targets.push(chapters[currentIdx - 1].id);
                // Also prefetch the one after that if it exists
                if (currentIdx > 1) {
                    targets.push(chapters[currentIdx - 2].id);
                }
            }
        } else {
            // New reader: Prefetch Chapter 1 and 2 (last and second to last in the DESC list)
            if (chapters.length > 0) targets.push(chapters[chapters.length - 1].id);
            if (chapters.length > 1) targets.push(chapters[chapters.length - 2].id);
        }

        // Always prefetch the latest chapter as secondary
        if (chapters[0] && !targets.includes(chapters[0].id)) {
            targets.push(chapters[0].id);
        }

        // Silent Pre-sync for instant loading
        // console.log(`[Prefetcher] Proactively syncing ${targets.length} chapters...`);

        // 2. Trigger JIT-Sync for targets
        for (const chapId of targets) {
            try {
                // Non-blocking fire and forget
                fetch('/api/crawler/jit-sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chapterId: chapId })
                });
                
                // Small delay between targets to keep server happy
                await new Promise(r => setTimeout(r, 1000));
            } catch (e) {
                // Silently ignore prefetch errors
            }
        }
    };

    prefetchChapters();
  }, [mounted, chapters, mangaId, history, isAuthenticated]);

  return null;
}

'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const HistoryContext = createContext();

export function HistoryProvider({ children }) {
  const [history, setHistory] = useState([]);
  const [mounted, setMounted] = useState(false);

  // Initial Load (Stable)
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('truyenvip_history');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setTimeout(() => setHistory(parsed), 0);
            } catch (e) {
                console.error('Failed to parse history', e);
            }
        }
        setTimeout(() => setMounted(true), 0);
    }
  }, []);

  const addToHistory = useCallback((manga, chapter) => {
    setHistory((prev) => {
      // Logic: Move to Top + Avoid Duplicates
      const filtered = prev.filter(h => h.mangaId !== manga.id);
      
      const newEntry = {
        mangaId: manga.id,
        mangaTitle: manga.title,
        mangaCover: manga.cover,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        chapterNumber: chapter.chapter_number,
        timestamp: Date.now()
      };
      
      const updated = [newEntry, ...filtered].slice(0, 50);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('truyenvip_history', JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem('truyenvip_history');
    setHistory([]);
  }, []);

  // Memoized value object to prevent unnecessary re-renders of children
  const value = useMemo(() => ({
    history,
    addToHistory,
    clearHistory,
    mounted
  }), [history, addToHistory, clearHistory, mounted]);

  return (
    <HistoryContext.Provider value={value}>
      {children}
    </HistoryContext.Provider>
  );
}

export const useHistory = () => useContext(HistoryContext);

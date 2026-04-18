'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useIsMounted } from '@/hooks/useIsMounted';

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState([]);
  const mounted = useIsMounted();

  const { isAuthenticated, user } = useAuth() || {};

  // Load from LocalStorage (initial)
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('truyenvip_favorites');
        if (saved) {
            try {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setFavorites(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse favorites', e);
            }
        }
    }
  }, []);


  // Sync with Server (Authenticated)
  useEffect(() => {
    if (isAuthenticated && mounted) {
        const syncWithServer = async () => {
            try {
                const res = await fetch('/api/favorites');
                if (res.ok) {
                    const serverFavorites = await res.json();
                    
                    // Merge logic: Server takes precedence, but we can merge if needed
                    // For TruyenVip, server is the source of truth for logged in users
                    setFavorites(serverFavorites);
                    localStorage.setItem('truyenvip_favorites', JSON.stringify(serverFavorites));
                }
            } catch (e) {
                console.error('Failed to sync favorites', e);
            }
        };
        syncWithServer();
    }
  }, [isAuthenticated, mounted]);

  const toggleFavorite = useCallback(async (manga) => {
    // Optimistic UI Update
    setFavorites((prev) => {
      const exists = prev.find(f => f.id === manga.id);
      let updated;
      if (exists) {
        updated = prev.filter(f => f.id !== manga.id);
      } else {
        const entry = {
          id: manga.id,
          title: manga.title,
          cover: manga.cover,
          timestamp: Date.now()
        };
        updated = [entry, ...prev];
      }
      localStorage.setItem('truyenvip_favorites', JSON.stringify(updated));
      return updated;
    });

    // Server-side Update if Logged In
    if (isAuthenticated) {
        try {
            await fetch('/api/favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mangaId: manga.id })
            });
        } catch (e) {
            console.error('Server sync failed', e);
        }
    }
  }, [isAuthenticated]);

  const isFavorite = (mangaId) => {
    return favorites.some(f => f.id === mangaId);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, mounted }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => useContext(FavoritesContext);

'use client';

import { useFavorites } from '@/NguCanh/FavoritesContext';
import { Heart } from 'lucide-react';

export default function FavoriteButton({ manga, className = "btn btn-glass fav-btn-titan shadow-titan" }) {
  const { toggleFavorite, isFavorite, mounted } = useFavorites();
  const favorited = mounted && isFavorite(manga.id);

  if (!mounted) {
    return (
        <button className={className} disabled>
            <Heart size={20} /> TIáº¾P NHáº¬N...
        </button>
    );
  }

  return (
    <button 
        className={`${className} ${favorited ? 'active' : ''}`}
        onClick={() => toggleFavorite(manga)}
        aria-label={favorited ? "Xà³a khoi yêu thà­ch" : "Thêm và o yêu thà­ch"}
    >
        {favorited ? (
            <><Heart size={20} fill="var(--accent)" color="var(--accent)" /> Äàƒ THàCH</>
        ) : (
            <><Heart size={20} /> YàŠU THàCH</>
        )}
    </button>
  );
}


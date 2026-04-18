'use client';

import { useFavorites } from '@/contexts/FavoritesContext';
import { Heart } from 'lucide-react';

export default function FavoriteButton({ manga, className = "btn btn-glass fav-btn-titan shadow-titan" }) {
  const { toggleFavorite, isFavorite, mounted } = useFavorites();
  const favorited = mounted && isFavorite(manga.id);

  if (!mounted) {
    return (
        <button className={className} disabled>
            <Heart size={20} /> TIẾP NHẬN...
        </button>
    );
  }

  return (
    <button 
        className={`${className} ${favorited ? 'active' : ''}`}
        onClick={() => toggleFavorite(manga)}
        aria-label={favorited ? "X�a kho�i y�u th�ch" : "Th�m v�o y�u th�ch"}
    >
        {favorited ? (
            <><Heart size={20} fill="var(--accent)" color="var(--accent)" /> Đ� TH�CH</>
        ) : (
            <><Heart size={20} /> Y�U TH�CH</>
        )}
    </button>
  );
}


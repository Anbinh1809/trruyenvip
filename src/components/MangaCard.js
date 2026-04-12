'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, memo } from 'react';
import { useFavorites } from '@/context/FavoritesContext';

function MangaCard({ manga, isNew = false }) {
  const coverUrl = manga.cover?.startsWith('http') 
    ? `/api/proxy?url=${encodeURIComponent(manga.cover)}` 
    : manga.cover;
    
  const [imgSrc, setImgSrc] = useState(coverUrl);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toggleFavorite, isFavorite } = useFavorites();
  const favorited = isFavorite(manga.id);
  const views = manga.views || 0;
  
  const handleImgError = () => {
    if (imgSrc !== '/placeholder-manga.svg') {
        setImgSrc('/placeholder-manga.svg');
    }
  };

  const formatViews = (val) => {
    if (!val || isNaN(val)) return '0';
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
    return val.toString();
  };


  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Vừa xong';
    const now = new Date();
    const past = new Date(dateStr);
    const diffInMinutes = Math.floor((now - past) / 60000);
    
    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    return past.toLocaleDateString('vi-VN');
  };

  return (
    <Link href={`/manga/${manga.id}`} className="manga-card-titan fade-up">
      <div 
        className={`card-media-titan ${!isLoaded ? 'skeleton-shimmer' : ''}`} 
        style={{ 
            aspectRatio: '4/5.2', 
            borderRadius: '16px', 
            overflow: 'hidden', 
            position: 'relative',
            background: '#0a0a0a' // Solid anchor to prevent transparency flicker
        }}
      >
        <Image 
          src={imgSrc} 
          alt={manga.title} 
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
          className="card-img-titan" 
          style={{ opacity: isLoaded ? 1 : 0, transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}
          onLoad={() => setIsLoaded(true)}
          onError={handleImgError}
          priority={isNew}
        />
        
        {/* Badges on Top-Left */}
        <div className="manga-badge-container">
            <span className="nebula-badge badge-time">
                {formatTimeAgo(manga.last_crawled)}
            </span>
            {(isNew || manga.trending) && (
                <span className={`nebula-badge ${manga.trending ? 'badge-hot' : 'badge-status'}`}>
                    {manga.trending ? 'Hot' : 'New'}
                </span>
            )}
        </div>

        {/* Bookmark Button on Top-Right */}
        <button 
            className={`bookmark-btn-nebula ${favorited ? 'active' : ''}`}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleFavorite(manga);
            }}
        >
            {favorited ? '🔖' : '📑'}
        </button>

        {/* Subtle hover overlay */}
        <div className="card-overlay-titan">
             <div style={{ display: 'flex', gap: '10px', fontSize: '0.75rem', fontWeight: 800, color: 'white' }}>
                  <span>{manga.rating || '4.5'} ★</span>
                  <span>{formatViews(views)} lượt xem</span>
             </div>
        </div>
      </div>

      {/* Centered Text Content */}
      <h3 className="card-title-centered">{manga.title}</h3>
      <p className="card-chapter-centered">
        {manga.last_chap_num && isNaN(manga.last_chap_num) ? manga.last_chap_num : `Chapter ${manga.last_chap_num || '0'}`}
      </p>
    </Link>
  );
}

export default memo(MangaCard, (prev, next) => {
    return prev.manga.id === next.manga.id && 
           prev.manga.last_chap_num === next.manga.last_chap_num &&
           prev.manga.views === next.manga.views;
});

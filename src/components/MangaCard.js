'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, memo } from 'react';
import { useFavorites } from '@/context/FavoritesContext';
import { Bookmark, Star, Eye } from 'lucide-react';

function MangaCard({ manga, isNew = false }) {
  const coverUrl = manga.cover?.startsWith('http') 
    ? `/api/proxy?url=${encodeURIComponent(manga.cover)}` 
    : (manga.cover || '/placeholder-manga.svg');
    
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
    const num = Number(val);
    if (!val || isNaN(num) || num === 0) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
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
      <div className={`card-media-titan ${!isLoaded ? 'skeleton-shimmer' : ''}`}>
        <Image 
          src={imgSrc} 
          alt={manga.title} 
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
          className={`card-img-titan ${isLoaded ? 'is-loaded' : ''}`} 
          onLoad={() => setIsLoaded(true)}
          onError={handleImgError}
          priority={isNew}
        />
        
        <div className="manga-badge-container">
            <span className="manga-tag badge-time">
                {formatTimeAgo(manga.last_crawled)}
            </span>
            {(isNew || manga.trending) && (
                <span className={`manga-tag ${manga.trending ? 'badge-hot' : 'badge-status'}`}>
                    {manga.trending ? 'Hot' : 'New'}
                </span>
            )}
        </div>

        <button 
            className={`bookmark-btn ${favorited ? 'active' : ''}`}
            aria-label={favorited ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleFavorite(manga);
            }}
        >
            {favorited ? <Bookmark size={18} fill="currentColor" /> : <Bookmark size={18} />}
        </button>

        <div className="card-overlay-titan">
             <div className="card-stats-row">
                  <span className="stat-item rating-text">
                      {manga.rating || '4.5'} <Star size={11} fill="var(--accent)" color="var(--accent)" />
                  </span>
                  <span className="stat-divider">|</span>
                  <span className="stat-item view-text">
                    <Eye size={12} className="inline-icon" /> {formatViews(views)}
                  </span>
             </div>
        </div>
      </div>

      <h3 className="card-title-centered truncate-1">{manga.title}</h3>
      <p className="card-chapter-centered">
        {manga.last_chap_num && isNaN(manga.last_chap_num) ? 
            manga.last_chap_num : 
            (manga.last_chap_num && manga.last_chap_num !== '0' ? `Chương ${manga.last_chap_num}` : 'Đang cập nhật')
        }
      </p>

      <style jsx>{`
        .card-stats-row {
            display: flex; 
            align-items: center; 
            gap: 8px; 
            font-size: 0.75rem; 
            font-weight: 950; 
            color: white;
        }
        .stat-item {
            display: flex; 
            align-items: center; 
            gap: 4px;
        }
        .stat-divider {
            opacity: 0.3;
        }
        .inline-icon {
            opacity: 0.6;
        }
        .card-img-titan {
            opacity: 0;
            transition: opacity 0.5s ease;
        }
        .card-img-titan.is-loaded {
            opacity: 1;
        }
      `}</style>
    </Link>
  );
}

export default memo(MangaCard);

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, memo } from 'react';
import { useFavorites } from '@/contexts/FavoritesContext';
import { Bookmark, Star, Eye } from 'lucide-react';
import { useIsMounted } from '@/hooks/useIsMounted';

import { getSignedProxyUrl } from '@/core/security/crypto';

function MangaCard({ manga, isNew = false, priority = false }) {
  const coverUrl = manga.cover 
    ? (manga.cover.includes('/api/proxy') ? manga.cover : getSignedProxyUrl(manga.cover, 400, 75)) 
    : '/placeholder-manga.svg';
    
  const [imgSrc, setImgSrc] = useState(coverUrl);
  const [isLoaded, setIsLoaded] = useState(false);
  const isMounted = useIsMounted();
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
    if (!dateStr) return 'Vá»«a xong';
    const now = new Date();
    const past = new Date(dateStr);
    const diffInMinutes = Math.floor((now - past) / 60000);
    
    if (diffInMinutes < 1) return 'Vá»«a xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phÃºt trÆ°á»›c`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giá» trÆ°á»›c`;
    return past.toLocaleDateString('vi-VN');
  };

  return (
    <Link 
      href={`/manga/${manga.normalized_title || manga.id}`} 
      className="manga-card-titan fade-up"
      itemScope 
      itemType="http://schema.org/CreativeWork"
    >
      <meta itemProp="url" content={`https://truyenvip.com/manga/${manga.normalized_title || manga.id}`} />
      <div className={`card-media-titan ${!isLoaded ? 'skeleton-shimmer' : ''}`}>
        <Image 
          src={imgSrc} 
          alt={`áº¢nh bÃ¬a truyá»‡n ${manga.title}`} 
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
          className={`card-img-titan ${isLoaded ? 'is-loaded' : ''}`} 
          onLoad={() => setIsLoaded(true)}
          onError={handleImgError}
          priority={priority || isNew}
          fetchPriority={priority ? "high" : "auto"}
          itemProp="image"
        />
        
        <div className="manga-badge-container">
            <span className="manga-tag badge-time">
                {isMounted ? formatTimeAgo(manga.last_crawled) : '...'}
            </span>
            {(isNew || manga.trending) && (
                <span className={`manga-tag ${manga.trending ? 'badge-hot' : 'badge-status'}`}>
                    {manga.trending ? 'Hot' : 'New'}
                </span>
            )}
        </div>

        <button 
            className={`bookmark-btn ${favorited ? 'active' : ''}`}
            aria-label={favorited ? `XÃ³a ${manga.title} khá»i yÃªu thÃ­ch` : `ThÃªm ${manga.title} vÃ o yÃªu thÃ­ch`}
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

      <h3 className="card-title-centered truncate-1" itemProp="name">{manga.title}</h3>
      <p className="card-chapter-centered">
        {manga.latest_chapter_number ? (
            `ChÆ°Æ¡ng ${manga.latest_chapter_number}`
        ) : (manga.last_chap_num && isNaN(manga.last_chap_num) ? 
            manga.last_chap_num : 
            (manga.last_chap_num && manga.last_chap_num !== '0' ? `ChÆ°Æ¡ng ${manga.last_chap_num}` : 'Äang cáº­p nháº­t'))
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
            text-shadow: 0 2px 4px rgba(0,0,0,0.5);
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
            transition: opacity 0.5s ease, transform 0.8s var(--ease-titan);
        }
        .card-img-titan.is-loaded {
            opacity: 1;
        }
        
        .manga-card-titan:hover .card-img-titan {
            transform: scale(1.1) rotate(1deg);
        }

        /* Premium Shine Sweep */
        .card-media-titan::after {
            content: '';
            position: absolute;
            top: -100%;
            left: -100%;
            width: 200%;
            height: 200%;
            background: linear-gradient(
                135deg,
                transparent 0%,
                transparent 45%,
                rgba(255, 255, 255, 0.08) 50%,
                transparent 55%,
                transparent 100%
            );
            transition: all 0.6s var(--ease-titan);
            z-index: 5;
            pointer-events: none;
        }
        
        .manga-card-titan:hover .card-media-titan::after {
            top: 0;
            left: 0;
        }

        .card-title-centered {
            text-shadow: 0 10px 20px rgba(0,0,0,0.2);
            transition: color 0.3s var(--ease-titan);
        }
        
        .manga-card-titan:hover .card-title-centered {
            color: var(--accent);
        }
      `}</style>
    </Link>
  );
}

export default memo(MangaCard);



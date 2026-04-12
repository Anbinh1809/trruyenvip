'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useFavorites } from '@/context/FavoritesContext';

export default function Hero({ manga }) {
  const { toggleFavorite, isFavorite } = useFavorites();
  
  if (!manga) return null;

  const favorited = isFavorite(manga.id);

  return (
    <section className="titan-hero">
      <div className="titan-hero-bg" style={{ backgroundImage: `url(${manga.cover || '/placeholder-manga.svg'})` }} />
      <div className="titan-hero-overlay" />
      
      <div className="container hero-container" style={{ position: 'relative', zIndex: 10, display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)', alignItems: 'center', gap: '50px' }}>
        <div className="hero-content fade-in" style={{ position: 'relative', zIndex: 20 }}>
          <div style={{ display: 'inline-block', padding: '6px 16px', background: 'rgba(255, 62, 62, 0.2)', color: '#ff3e3e', borderRadius: '50px', fontWeight: 700, fontSize: '0.85rem', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>🔥 Đang Thịnh Hành</div>
          <h1 className="titan-hero-title">{manga.title}</h1>
          <p style={{ fontSize: '1.15rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6', marginBottom: '30px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {manga.description || 'Khám phá bộ truyện tranh đầy hấp dẫn này ngay bây giờ tại TruyenVip. Dữ liệu được cập nhật liên tục từ các nguồn hàng đầu.'}
          </p>
          <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
            <span>📅 2024</span>
            <span>⭐ 4.9/5</span>
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <Link href={`/manga/${manga.id}`} className="btn btn-primary" style={{ padding: '15px 40px', fontSize: '1.1rem' }}>
              📖 Đọc Ngay
            </Link>
            <button 
                className={`btn btn-outline ${favorited ? 'active' : ''}`} 
                onClick={() => toggleFavorite(manga)}
                style={{ border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', backdropFilter: 'blur(10px)', padding: '15px 30px' }}
            >
              {favorited ? '❤️ Đã yêu thích' : '+ Thêm vào yêu thích'}
            </button>
          </div>
        </div>
        
        <div className="titan-hero-artwork fade-in">
             <div style={{ position: 'relative', width: '320px', height: '480px' }}>
                <Image 
                    src={manga.cover || '/placeholder-manga.svg'} 
                    alt={manga.title} 
                    fill 
                    sizes="320px"
                    priority
                    style={{ objectFit: 'cover' }}
                />
             </div>
        </div>
      </div>
    </section>
  );
}

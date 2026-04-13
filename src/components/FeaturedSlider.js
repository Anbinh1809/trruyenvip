'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function FeaturedSlider({ mangaList }) {
  const slides = (mangaList || []).slice(0, 5); // Top 5
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);
  
  const touchStart = useRef(0);
  const touchEnd = useRef(0);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
        setCurrent((prev) => (prev + 1) % slides.length);
    }, 7000);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length === 0) return;
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [slides.length, resetTimer]);

  const handleManualNav = useCallback((index) => {
    setCurrent(index);
    resetTimer();
  }, [resetTimer]);

  const handleTouchStart = (e) => {
    touchStart.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEnd.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    const distance = touchStart.current - touchEnd.current;
    
    if (distance > 70) {
        handleManualNav((current + 1) % slides.length);
    } else if (distance < -70) {
        handleManualNav((current - 1 + slides.length) % slides.length);
    }
    
    touchStart.current = 0;
    touchEnd.current = 0;
  };

  if (slides.length === 0) return null;

  return (
    <section 
        className="titan-slider"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
    >
        <div className="titan-slider-container" style={{ position: 'relative', overflow: 'hidden' }}>
            {slides.map((manga, idx) => {
                const coverUrl = manga.cover?.startsWith('http') 
                    ? `/api/proxy?url=${encodeURIComponent(manga.cover)}` 
                    : manga.cover;
                
                return (
                    <div 
                        key={manga.id} 
                        className={`titan-slide ${idx === current ? 'active' : ''}`}
                        style={{ 
                            transition: 'opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1), transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            zIndex: idx === current ? 10 : 1,
                        }}
                    >
                        <Image 
                            src={coverUrl} 
                            alt={manga.title || 'Manga Cover'} 
                            fill 
                            priority={idx <= 1} 
                            loading={idx > 1 ? 'lazy' : undefined}
                            className="titan-slide-image-masked"
                        />
                        <div className="titan-slide-overlay-premium" />
                        <div className="titan-slide-content-premium container">
                            <div className="badge-red" style={{ padding: '8px 18px', borderRadius: '50px', fontSize: '0.7rem', letterSpacing: '1px', marginBottom: '25px', width: 'fit-content' }}>TRUYỆN NỔI BẬT</div>
                            <h2 className="hero-title-titan">{manga.title}</h2>
                            <p style={{ fontSize: '1.2rem', color: 'var(--text-primary)', opacity: 0.9, marginBottom: '40px', lineHeight: '1.6', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', maxWidth: '600px', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                                Khám phá hành trình đầy kịch tính của {manga.title}. Đọc ngay để theo dõi những tình tiết mới nhất vừa được cập nhật tại TruyenVip.
                            </p>
                            <div style={{ display: 'flex', gap: '20px' }}>
                                <Link href={`/manga/${manga.id}`} className="btn btn-primary" style={{ padding: '16px 36px' }}>Đọc ngay</Link>
                                <Link href={`/manga/${manga.id}`} className="btn btn-outline" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>Chi tiết</Link>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>

        <div style={{ position: 'absolute', bottom: '50px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '15px', zIndex: 20 }}>
            {slides.map((_, idx) => (
                <div 
                    key={idx} 
                    className={`titan-slider-indicator ${idx === current ? 'active' : ''}`} 
                    onClick={() => handleManualNav(idx)}
                />
            ))}
        </div>
    </section>
  );
}

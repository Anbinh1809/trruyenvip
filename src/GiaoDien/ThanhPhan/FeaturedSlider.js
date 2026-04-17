'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Info } from 'lucide-react';

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
        className="titan-slider fade-in"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
    >
        <div className="titan-slider-container">
            {slides.map((manga, idx) => {
                const coverUrl = manga.cover?.startsWith('http') 
                    ? `/api/proxy?url=${encodeURIComponent(manga.cover)}` 
                    : manga.cover;
                
                return (
                    <div 
                        key={manga.id} 
                        className={`titan-slide ${idx === current ? 'active' : ''}`}
                    >
                        <Image 
                            src={coverUrl || '/placeholder-manga.svg'} 
                            alt={manga.title || 'Manga Cover'} 
                            fill 
                            priority={idx === 0}
                            sizes="100vw"
                            className="titan-slide-image-masked"
                        />
                        <div className="titan-slide-overlay-premium" />
                        <div className="titan-slide-content-premium container">
                            <div className="hero-tag-industrial">TRUYỆN NỔI BẬT</div>
                            <h2 className="hero-title-titan">{manga.title}</h2>
                            <p className="hero-desc-industrial">
                                Khám phá hành trình đầy kịch tính của {manga.title}. Đọc ngay để theo dõi những tình tiết mới nhất vừa được cập nhật tại TruyenVip.
                            </p>
                            <div className="hero-actions-industrial">
                                <Link href={`/manga/${manga.id}`} className="btn btn-primary hero-btn-main">
                                    <Play size={18} fill="currentColor" /> ĐỌC NGAY
                                </Link>
                                <Link href={`/manga/${manga.id}`} className="btn btn-glass hero-btn-sub">
                                    <Info size={18} /> CHI TIẾT
                                </Link>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>

        <div className="titan-slider-indicators">
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

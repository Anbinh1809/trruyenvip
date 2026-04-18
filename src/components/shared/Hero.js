'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Play, Info, Calendar, Star } from 'lucide-react';

export default function Hero({ manga }) {
  if (!manga) return null;

  return (
    <section className="titan-hero-section">
      <div 
        className="titan-hero-bg" 
        style={{ '--hero-cover': `url(${manga.cover || '/placeholder-manga.svg'})` }} 
      />
      
      <div className="container hero-grid-industrial">
        <div className="hero-content fade-in">
          <div className="hero-tag-industrial">
            <Star size={14} fill="currentColor" /> TRUYỆN NỔI BẬT
          </div>
          
          <h1 className="hero-title-titan">{manga.title}</h1>
          
          <p className="hero-desc-industrial">
            {manga.description || 'Đang cập nhật nội dung cho tác phẩm này...'}
          </p>
          
          <div className="hero-meta-industrial">
            <span className="meta-item"><Calendar size={14} /> 2024</span>
            <span className="meta-item accent-text"><Star size={14} fill="currentColor" /> 4.9/5</span>
            <span className="meta-item desktop-only">
              {manga.genres?.slice(0, 2).map((g) => g.name).join(' • ')}
            </span>
          </div>
          
          <div className="hero-actions-industrial">
            <Link href={`/manga/${manga.id}`} className="btn btn-primary hero-btn-main">
              <Play size={18} fill="currentColor" /> ĐỌC NGAY
            </Link>
            <Link href={`/manga/${manga.id}`} className="btn btn-glass hero-btn-sub">
              <Info size={18} /> CHI TIẾT
            </Link>
          </div>
        </div>

        <div className="hero-right-industrial fade-in">
             <div className="hero-cover-container-industrial">
                <Image 
                    src={manga.cover || '/placeholder-manga.svg'} 
                    alt={manga.title} 
                    fill 
                    priority
                    sizes="320px"
                    className="hero-cover-img-industrial"
                />
             </div>
        </div>
      </div>

      <style jsx>{`
        .titan-hero-bg {
            background-image: var(--hero-cover);
        }
        .hero-title-titan {
            font-size: clamp(2.5rem, 5vw, 4.5rem);
            font-weight: 950;
            color: var(--text-primary);
            line-height: 1.1;
            margin-bottom: 25px;
            letter-spacing: -2px;
        }
        .hero-desc-industrial {
            font-size: 1.1rem;
            color: var(--text-secondary);
            line-height: 1.6;
            margin-bottom: 35px;
            display: -webkit-box;
            WebkitLineClamp: 3;
            WebkitBoxOrient: vertical;
            overflow: hidden;
            max-width: 600px;
        }
        .accent-text {
            color: var(--accent);
        }
        .hero-actions-industrial {
            display: flex;
            gap: 20px;
        }
        .hero-btn-main {
            padding: 16px 45px;
            font-size: 1.1rem;
            display: flex;
            align-items: center;
            gap: 12px;
            font-weight: 950;
        }
        .hero-btn-sub {
            padding: 16px 35px;
            font-size: 1rem;
            display: flex;
            align-items: center;
            gap: 10px;
            background: var(--glass-bg);
            backdrop-filter: blur(10px);
            border-color: var(--glass-border);
            color: var(--text-primary);
            font-weight: 850;
        }
        .hero-cover-container-industrial {
            position: relative;
            width: 300px;
            aspect-ratio: 2/3;
            border-radius: 20px;
            overflow: hidden;
            border: 1px solid var(--glass-border);
            box-shadow: 0 40px 80px rgba(0,0,0,0.6);
            transform: perspective(1000px) rotateY(-10deg);
            transition: all 0.5s;
        }
        .hero-cover-container-industrial:hover {
            transform: perspective(1000px) rotateY(0deg);
            border-color: var(--accent);
        }
        .hero-cover-img-industrial {
            object-fit: cover;
        }
        .meta-item {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        @media (max-width: 768px) {
            .hero-actions-industrial {
                flex-direction: column;
            }
            .hero-btn-main, .hero-btn-sub {
                width: 100%;
                justify-content: center;
            }
            .hero-cover-container-industrial {
                display: none;
            }
        }
      `}</style>
    </section>
  );
}

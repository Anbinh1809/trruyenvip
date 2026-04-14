'use client';

import { useHistory } from '@/context/HistoryContext';
import Link from 'next/link';
import Image from 'next/image';
import { Play, History } from 'lucide-react';
import './RecentlyRead.css';

export default function RecentlyRead() {
  const { history, mounted } = useHistory();

  if (!mounted || history.length === 0) return null;

  const mostRecent = history[0];
  const otherHistory = history.slice(1, 4);

  return (
    <section className="recently-read-titan fade-in">
      <div className="recent-section-header-industrial">
          <h2 className="title-titan section-title-industrial">TIẾP TỤC ĐỌC</h2>
          <Link href="/history" className="view-all-link-industrial">XEM TẤT CẢ</Link>
      </div>

      {mostRecent && (
        <div className="quick-resume-banner-titan industrial-shadow-nebula">
          <div 
            className="banner-bg-titan" 
            style={{ '--cover-url': `url(${mostRecent.mangaCover?.startsWith('http') ? `/api/proxy?url=${encodeURIComponent(mostRecent.mangaCover)}` : (mostRecent.mangaCover || '/placeholder-manga.svg')})` }} 
          />
          <div className="banner-content-titan">
            <div className="banner-label-titan">
                <span className="pulse-dot-industrial" /> ĐANG ĐỌC DỞ
            </div>
            <h3 className="banner-title-titan truncate-1">{mostRecent.mangaTitle}</h3>
            <p className="banner-sub-titan">Chương {mostRecent.chapterNumber} • {mostRecent.mangaAuthor || 'Đang cập nhật'}</p>
            <Link 
              href={`/manga/${mostRecent.mangaId}/chapter/${mostRecent.chapterId}`} 
              className="btn btn-primary banner-btn-titan-industrial"
            >
              TIẾP TỤC ĐỌC
            </Link>
          </div>
        </div>
      )}

      {otherHistory.length > 0 && (
        <div className="other-history-titan-industrial">
            <div className="recent-section-header-industrial low-margin">
                <div className="recent-history-label-industrial">
                    <History size={16} color="var(--accent)" />
                    <span className="badge-history-titan">Lịch sử khác</span>
                </div>
            </div>
            
            <div className="titan-recent-grid">
                {otherHistory.map((item, idx) => (
                    <Link 
                        key={`${item.mangaId}-${idx}`} 
                        href={`/manga/${item.mangaId}/chapter/${item.chapterId}`}
                        className="titan-recent-card-industrial"
                    >
                        <div className="titan-recent-image-industrial">
                            <Image 
                                src={item.mangaCover?.startsWith('http') ? `/api/proxy?url=${encodeURIComponent(item.mangaCover)}&w=50` : (item.mangaCover || '/placeholder-manga.svg')} 
                                alt={item.mangaTitle} 
                                fill 
                                sizes="50px"
                                className="titan-recent-img-tag"
                            />
                        </div>
                        <div className="titan-recent-info-industrial">
                            <h4 className="titan-recent-title-industrial truncate-1">{item.mangaTitle}</h4>
                            <span className="titan-recent-badge-industrial">Chương {item.chapterNumber}</span>
                        </div>
                        <div className="play-icon-mini-industrial">
                            <Play size={14} fill="currentColor" />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
      )}
      <style jsx>{`
        .recent-section-header-industrial {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
        }
        .recent-section-header-industrial.low-margin {
            margin-bottom: 20px;
        }
        .view-all-link-industrial {
            font-size: 0.75rem;
            font-weight: 950;
            color: var(--accent);
            text-decoration: none;
            letter-spacing: 1px;
            opacity: 0.6;
            transition: all 0.3s;
        }
        .view-all-link-industrial:hover {
            opacity: 1;
            transform: translateX(-5px);
        }
        .banner-bg-titan {
            background-image: var(--cover-url);
        }
        .other-history-titan-industrial {
            margin-top: 50px;
        }
        .recent-history-label-industrial {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .titan-recent-card-industrial {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 12px 18px;
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid var(--glass-border);
            border-radius: 12px;
            text-decoration: none;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            position: relative;
            overflow: hidden;
        }
        .titan-recent-card-industrial:hover {
            background: rgba(255, 255, 255, 0.05);
            border-color: var(--accent);
            transform: translateX(5px);
        }
        .titan-recent-image-industrial {
            width: 45px;
            height: 45px;
            border-radius: 8px;
            overflow: hidden;
            flex-shrink: 0;
            position: relative;
            border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .titan-recent-img-tag {
            object-fit: cover;
        }
        .titan-recent-info-industrial {
            flex: 1;
            min-width: 0;
        }
        .titan-recent-title-industrial {
            font-size: 0.9rem;
            font-weight: 900;
            color: white;
            margin: 0;
            letter-spacing: -0.3px;
        }
        .titan-recent-badge-industrial {
            font-size: 0.75rem;
            font-weight: 750;
            color: rgba(255, 255, 255, 0.3);
            display: block;
            margin-top: 2px;
        }
        .play-icon-mini-industrial {
            opacity: 0;
            color: var(--accent);
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            transform: scale(0.5);
        }
        .titan-recent-card-industrial:hover .play-icon-mini-industrial {
            opacity: 1;
            transform: scale(1);
        }
        .pulse-dot-industrial {
            width: 8px;
            height: 8px;
            background: var(--accent);
            border-radius: 50%;
            display: inline-block;
            margin-right: 8px;
            box-shadow: 0 0 10px var(--accent);
            animation: titan-pulse 2s infinite;
        }
        @keyframes titan-pulse {
            0% { transform: scale(0.95); opacity: 0.8; }
            50% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(0.95); opacity: 0.8; }
        }
        .banner-btn-titan-industrial {
            padding: 12px 35px;
            font-weight: 950;
            letter-spacing: 1px;
            font-size: 0.85rem;
        }
      `}</style>
    </section>
  );
}

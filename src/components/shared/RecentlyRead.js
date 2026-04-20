'use client';

import { useHistory } from '@/contexts/HistoryContext';
import Link from 'next/link';
import Image from 'next/image';
import { Play, History } from 'lucide-react';
import { getSignedProxyUrl } from '@/core/security/crypto';
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
            style={{ '--cover-url': `url(${mostRecent.mangaCover?.includes('/api/proxy') ? mostRecent.mangaCover : mostRecent.mangaCover?.startsWith('http') ? getSignedProxyUrl(mostRecent.mangaCover, 800, 75) : (mostRecent.mangaCover || '/placeholder-manga.svg')})` }} 
          />
          <div className="banner-content-titan">
            <div className="banner-label-titan">
                <span className="pulse-dot-industrial" /> ĐANG ĐỌC DỞ
            </div>
            <h3 className="banner-title-titan truncate-1">{mostRecent.mangaTitle}</h3>
            <p className="banner-sub-titan">Chương {mostRecent.chapterNumber} • {mostRecent.mangaAuthor || 'Đang cập nhật'}</p>
            <Link 
              href={`/manga/${mostRecent.mangaNormalizedTitle || mostRecent.mangaId}/chapter/${mostRecent.chapterId}`} 
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
                        href={`/manga/${item.mangaNormalizedTitle || item.mangaId}/chapter/${item.chapterId}`}
                        className="titan-recent-card-industrial"
                    >
                        <div className="titan-recent-image-industrial">
                            <Image 
                                src={item.mangaCover?.includes('/api/proxy') ? item.mangaCover : item.mangaCover?.startsWith('http') ? getSignedProxyUrl(item.mangaCover, 100, 70) : (item.mangaCover || '/placeholder-manga.svg')} 
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

    </section>
  );
}



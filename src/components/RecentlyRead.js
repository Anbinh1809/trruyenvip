'use client';

import { useHistory } from '@/context/HistoryContext';
import Link from 'next/link';
import Image from 'next/image';

export default function RecentlyRead() {
  const { history, mounted } = useHistory();

  if (!mounted) {
    return (
      <section className="recently-read-titan">
        <div className="section-header-titan">
          <h2 className="title-titan" style={{ fontSize: '1.4rem' }}>Đọc Tiếp</h2>
        </div>
        <div className="recent-skeleton-titan">
          {[1, 2, 3].map(i => (
            <div key={i} className="recent-skeleton-item skeleton-shimmer">
              <div className="recent-skeleton-img"></div>
              <div className="recent-skeleton-text">
                <div className="skeleton-bar-title"></div>
                <div className="skeleton-bar-sub"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!history || history.length === 0) return null;

  const mostRecent = history[0];
  const others = history.slice(1, 4);

  return (
    <section className="recently-read-titan fade-in">
      {/* High-Impact Quick Resume Banner */}
      <div className="quick-resume-banner-titan" style={{ marginBottom: '40px' }}>
          <div className="banner-bg-titan" style={{ backgroundImage: `url(${mostRecent.mangaCover?.startsWith('http') ? `/api/proxy?url=${encodeURIComponent(mostRecent.mangaCover)}` : (mostRecent.mangaCover || '/placeholder-manga.svg')})` }}></div>
          <div className="banner-content-titan">
              <div className="banner-label-titan">
                  <span className="pulse-dot"></span> ĐANG ĐỌC DỞ
              </div>
              <h2 className="banner-title-titan">{mostRecent.mangaTitle}</h2>
              <p className="banner-sub-titan">Bạn đã đọc đến Chương {mostRecent.chapterNumber || 'N/A'}</p>
              <Link href={`/manga/${mostRecent.mangaId}/chapter/${mostRecent.chapterId}`} className="btn btn-primary banner-btn-titan">
                  Tiếp tục hành trình →
              </Link>
          </div>
      </div>

      {others.length > 0 && (
        <>
            <div className="section-header-titan" style={{ marginBottom: '20px' }}>
                <div className="header-label">
                <span className="badge-blue" style={{ fontSize: '0.65rem' }}>LỊCH SỬ KHÁC</span>
                </div>
                <Link href="/history" className="btn-view-all">Tất cả →</Link>
            </div>
            
            <div className="titan-recent-grid">
                {others.map((item) => (
                <Link key={item.mangaId} href={`/manga/${item.mangaId}/chapter/${item.chapterId}`} className="titan-recent-card">
                    <div className="titan-recent-image">
                    <Image 
                        src={item.mangaCover ? (item.mangaCover.startsWith('http') ? `/api/proxy?url=${encodeURIComponent(item.mangaCover)}` : item.mangaCover) : '/placeholder-manga.svg'} 
                        alt={item.mangaTitle || 'Manga'} 
                        fill
                        sizes="120px"
                        className="titan-recent-img"
                    />
                    </div>
                    <div className="titan-recent-info" style={{ minWidth: 0, flex: 1 }}>
                    <h4 className="titan-recent-title" style={{ 
                        margin: 0, 
                        fontSize: '0.95rem', 
                        fontWeight: 800, 
                        display: '-webkit-box', 
                        WebkitLineClamp: 1, 
                        WebkitBoxOrient: 'vertical', 
                        overflow: 'hidden' 
                    }}>
                        {item.mangaTitle}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                        <span style={{ 
                            background: 'rgba(255,255,255,0.05)', 
                            padding: '2px 8px', 
                            borderRadius: '4px', 
                            fontSize: '0.7rem', 
                            fontWeight: 700, 
                            color: 'rgba(255,255,255,0.6)'
                        }}>
                        C. {item.chapterNumber || 'N/A'}
                        </span>
                    </div>
                    </div>
                </Link>
                ))}
            </div>
        </>
      )}
    </section>
  );
}

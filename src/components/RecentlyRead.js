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

  return (
    <section className="recently-read-titan fade-in" style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="section-header-titan">
        <div className="header-label" style={{ position: 'relative' }}>
          <span className="badge-blue">LỊCH SỬ</span>
          <h2 className="title-titan" style={{ fontSize: '1.4rem', margin: '10px 0 0' }}>Đọc Tiếp</h2>
        </div>
        <Link href="/history" className="btn-view-all">Tất cả →</Link>
      </div>
      
      <div className="titan-recent-grid" style={{ position: 'relative' }}>
        {history.slice(0, 4).map((item) => (
          <Link key={item.mangaId} href={`/manga/${item.mangaId}/chapter/${item.chapterId}`} className="titan-recent-card" style={{ position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
            <div className="titan-recent-image" style={{ position: 'relative', flexShrink: 0 }}>
              <Image 
                src={item.mangaCover ? (item.mangaCover.startsWith('http') ? `/api/proxy?url=${encodeURIComponent(item.mangaCover)}` : item.mangaCover) : '/placeholder-manga.svg'} 
                alt={item.mangaTitle || 'Manga'} 
                fill
                sizes="150px"
                className="titan-recent-img"
              />
            </div>
            <div className="titan-recent-info" style={{ position: 'relative', paddingLeft: '10px', minWidth: 0 }}>
              <h4 className="titan-recent-title" style={{ margin: 0 }}>{item.mangaTitle}</h4>
              <p className="titan-recent-chapter" style={{ margin: '4px 0 0' }}>C. {item.chapterTitle?.replace(/[^0-9.]/g, '') || 'N/A'}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

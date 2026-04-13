'use client';

import Header from '@/components/Header';
import MangaCard from '@/components/MangaCard';
import { useFavorites } from '@/context/FavoritesContext';
import { useAuth } from '@/context/AuthContext';
import { useHistory } from '@/context/HistoryContext';
import Link from 'next/link';
import EmptyState from '@/components/EmptyState';
import { Gem, Sparkles } from 'lucide-react';

export default function FavoritesPage() {
  const { favorites, mounted } = useFavorites();
  const { isAuthenticated } = useAuth();
  const { history } = useHistory();
  
  return (
    <main className="main-wrapper titan-bg" style={{ minHeight: '100vh', paddingBottom: '100px', color: 'white' }}>
      <Header />
      
      <div className="content container fade-in" style={{ marginTop: '120px' }}>
        <section className="section-titan">
          <div className="section-header-titan">
            <div className="header-label">
              <h2 className="title-titan" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Gem size={28} color="var(--accent)" />
                  Bộ sưu tập của bạn
              </h2>
              <p className="subtitle-titan">
                {!mounted 
                    ? 'Đang tải bộ sưu tập...' 
                    : favorites.length > 0 
                        ? `Lưu giữ ${favorites.length} bộ truyện tuyệt phẩm` 
                        : 'Bắt đầu xây dựng danh sách của bạn.'}
              </p>
            </div>
            {!isAuthenticated && mounted && (
                <div className="badge-red" style={{ padding: '8px 20px', fontSize: '0.8rem' }}>
                    Hãy đăng nhập để đồng bộ vĩnh viễn
                </div>
            )}
          </div>

          {!mounted ? (
            <div className="manga-grid-titan">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="skeleton-shimmer" style={{ height: '350px', borderRadius: '30px' }}></div>
              ))}
            </div>
          ) : favorites.length > 0 ? (
            <div className="manga-grid-titan">
              {favorites.map(manga => {
                const historyEntry = history.find(h => h.mangaId === manga.id);
                const isNew = manga.latest_chapter_number && (!historyEntry || manga.latest_chapter_number > historyEntry.chapterNumber);
                
                return <MangaCard key={manga.id} manga={manga} isNew={isNew} />;
              })}
            </div>
          ) : (
            <EmptyState 
              title="Danh sách trống"
              subtitle="Hãy cùng khám phá hàng ngàn bộ truyện hấp dẫn tại trang chủ ngay!"
              actionText="Khám phá ngay"
              actionUrl="/"
            />
          )}
        </section>
      </div>
    </main>
  );
}

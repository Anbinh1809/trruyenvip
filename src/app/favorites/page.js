'use client';

import Header from '@/components/Header';
import MangaCard from '@/components/MangaCard';
import { useFavorites } from '@/context/FavoritesContext';
import { useAuth } from '@/context/AuthContext';
import { useHistory } from '@/context/HistoryContext';
import Link from 'next/link';
import EmptyState from '@/components/EmptyState';

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
              <h2 className="title-titan">💎 Bộ sưu tập của bạn</h2>
              <p className="subtitle-titan">
                {!mounted 
                    ? 'Đang triệu hồi bộ sưu tập...' 
                    : favorites.length > 0 
                        ? `Lưu giữ ${favorites.length} bộ truyện tuyệt phẩm` 
                        : 'Đạo hữu chưa tìm được bộ truyện nào tâm đắc sao?'}
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
              title="Thư tịch còn trống"
              subtitle="Đạo hữu chưa tìm được bộ truyện nào tâm đắc sao? Hãy cùng linh thú khám phá vạn hành tinh truyện tranh ngay!"
              actionText="Khai phá thế giới"
              actionUrl="/"
            />
          )}
        </section>
      </div>
    </main>
  );
}

'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MangaCard from '@/components/shared/MangaCard';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useAuth } from '@/contexts/AuthContext';
import { useHistory } from '@/contexts/HistoryContext';
import Link from 'next/link';
import EmptyState from '@/components/shared/EmptyState';
import { Gem, Lock } from 'lucide-react';

export default function FavoritesPage() {
  const { favorites, mounted } = useFavorites();
  const { isAuthenticated } = useAuth() || {};
  const { history } = useHistory();
  
  return (
    <main className="main-wrapper titan-bg favorites-page">
      <Header />
      
      <div className="container favorites-container fade-in">
        <section className="favorites-content-industrial">
          <header className="favorites-header-industrial fade-up">
            <div className="header-left-industrial">
              <div className="library-badge-titan">BỘ SƯU TẬP CỦA BẠN</div>
              <h1 className="favorites-title-industrial">TRUYỆN YÊU THÍCH</h1>
              <p className="favorites-subtitle">
                {!mounted 
                    ? 'Đang truy xuất dữ liệu bộ sưu tập...' 
                    : favorites.length > 0 
                        ? `Lưu giữ ${favorites.length} tuyệt phẩm tinh hoa` 
                        : 'Bắt đầu xây dựng danh bạ truyện của riêng bạn.'}
              </p>
            </div>
            {!isAuthenticated && mounted && (
                <div className="login-prompt-titan shadow-titan">
                    <Lock size={16} /> Đăng nhập để đồng bộ vĩnh viễn
                </div>
            )}
          </header>

          {!mounted ? (
            <div className="manga-grid-titan">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="skeleton-card-industrial" />
              ))}
            </div>
          ) : favorites.length > 0 ? (
            <div className="manga-grid-titan">
              {favorites.map(manga => {
                const historyEntry = history.find(h => h.mangaId === manga.id);
                const isNew = manga.last_chap_num && (!historyEntry || manga.last_chap_num > historyEntry.chapterNumber);
                
                return <MangaCard key={manga.id} manga={manga} isNew={isNew} />;
              })}
            </div>
          ) : (
            <EmptyState 
              title="KHO TRUYỆN CÒN TRỐNG"
              subtitle="Hãy cùng khám phá hàng ngàn bộ truyện hấp dẫn tại trang chủ ngay!"
              actionText="KHÁM PHÁ NGAY"
              actionUrl="/"
            />
          )}
        </section>
      </div>
      <Footer />
      <style>{`
        .header-left-industrial { flex: 1; }
        .login-prompt-titan { background: rgba(255, 62, 62, 0.1); border: 1px solid rgba(255, 62, 62, 0.2); pointer-events: none; padding: 12px 25px; border-radius: 12px; font-size: 0.85rem; font-weight: 850; color: var(--accent); display: flex; align-items: center; gap: 10px; letter-spacing: 0.5px; }
        .skeleton-card-industrial { height: 400px; background: rgba(255,255,255,0.02); border-radius: 20px; animation: pulse 2s infinite; }
        @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 0.8; } 100% { opacity: 0.5; } }
      `}</style>
    </main>
  );
}

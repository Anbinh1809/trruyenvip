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
              <div className="library-badge-titan">B? SƯU TẬP Co�A BẠN</div>
              <h1 className="favorites-title-industrial">TRUY?N Y�U TH�CH</h1>
              <p className="favorites-subtitle">
                {!mounted 
                    ? 'Đang truy xuất d? li?u bo� suu tập...' 
                    : favorites.length > 0 
                        ? `Luu gi? ${favorites.length} tuy?t ph?m tinh hoa` 
                        : 'B?t d?u x�y d?ng danh bạ truy?n c?a ri�ng bạn.'}
              </p>
            </div>
            {!isAuthenticated && mounted && (
                <div className="login-prompt-titan shadow-titan">
                    <Lock size={16} /> Đăng nhập đo� đ?nng bo� vinh vi?n
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
                const isNew = manga.latest_chapter_number && (!historyEntry || manga.latest_chapter_number > historyEntry.chapterNumber);
                
                return <MangaCard key={manga.id} manga={manga} isNew={isNew} />;
              })}
            </div>
          ) : (
            <EmptyState 
              title="KHO TRUY?N C�N TRo�NG"
              subtitle="H�y c�ng kh�m ph� h�ng ng�n bo� truy?n hấp dẫn tại trang ch? ngay!"
              actionText="KH�M PH� NGAY"
              actionUrl="/"
            />
          )}
        </section>
      </div>
      <Footer />
      <style jsx>{`
        .header-left-industrial { flex: 1; }
        .login-prompt-titan { background: rgba(255, 62, 62, 0.1); border: 1px solid rgba(255, 62, 62, 0.2); pointer-events: none; padding: 12px 25px; border-radius: 12px; font-size: 0.85rem; font-weight: 850; color: var(--accent); display: flex; align-items: center; gap: 10px; letter-spacing: 0.5px; }
        .skeleton-card-industrial { height: 400px; background: rgba(255,255,255,0.02); border-radius: 20px; animation: pulse 2s infinite; }
        @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 0.8; } 100% { opacity: 0.5; } }
      `}</style>
    </main>
  );
}


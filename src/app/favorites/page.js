'use client';

import Header from '@/GiaoDien/BoCuc/Header';
import Footer from '@/GiaoDien/BoCuc/Footer';
import MangaCard from '@/GiaoDien/ThanhPhan/MangaCard';
import { useFavorites } from '@/NguCanh/FavoritesContext';
import { useAuth } from '@/NguCanh/AuthContext';
import { useHistory } from '@/NguCanh/HistoryContext';
import Link from 'next/link';
import EmptyState from '@/GiaoDien/ThanhPhan/EmptyState';
import { Gem, Lock } from 'lucide-react';

export default function FavoritesPage() {
  const { favorites, mounted } = useFavorites();
  const { isAuthenticated } = useAuth();
  const { history } = useHistory();
  
  return (
    <main className="main-wrapper titan-bg favorites-page">
      <Header />
      
      <div className="container favorites-container fade-in">
        <section className="favorites-content-industrial">
          <header className="favorites-header-industrial fade-up">
            <div className="header-left-industrial">
              <div className="library-badge-titan">Bộ SÆ¯U Táº¬P Co¦A Báº N</div>
              <h1 className="favorites-title-industrial">TRUYộN YàŠU THàCH</h1>
              <p className="favorites-subtitle">
                {!mounted 
                    ? 'Äang truy xuáº¥t dữ liệu bo™ sưu táº­p...' 
                    : favorites.length > 0 
                        ? `Lưu giữ ${favorites.length} tuyệt phẩm tinh hoa` 
                        : 'Bắt đầu xây dựng danh báº¡ truyện của riêng báº¡n.'}
              </p>
            </div>
            {!isAuthenticated && mounted && (
                <div className="login-prompt-titan shadow-titan">
                    <Lock size={16} /> ÄÄƒng nháº­p Ä‘oƒ Ä‘ồnng bo™ vĩnh viễn
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
              title="KHO TRUYỆN Cà’N TRoNG"
              subtitle="Hà£y cà¹ng khám phá hà ng ngà n bo™ truyện háº¥p dáº«n táº¡i trang chủ ngay!"
              actionText="KHàM PHà NGAY"
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


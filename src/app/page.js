import Header from '@/components/Header';
import RecentlyRead from '@/components/RecentlyRead';
import MangaCard from '@/components/MangaCard';
import Footer from '@/components/Footer';
import { query, MANGA_CARD_FIELDS } from '@/lib/db';
import Link from 'next/link';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'TruyenVip - Nền tảng Đọc Truyện Tranh Online Cao Cấp',
  description: 'Trải nghiệm đọc truyện tranh đỉnh cao với tốc độ siêu nhanh, giao diện cinematic và kho truyện khổng lồ từ NetTruyen, TruyenQQ được cập nhật liên tục.',
  keywords: ['đọc truyện tranh', 'nettruyen', 'truyenqq', 'manga online', 'truyenvip', 'truyện hot'],
};

async function getManga() {
  try {
        const result = await query(`
            SELECT ${MANGA_CARD_FIELDS}
            FROM "Manga" 
            ORDER BY last_crawled DESC
            LIMIT 60
        `);

    return (result.recordset || []).map(m => ({
      ...m,
      cover: m.cover?.startsWith('http') ? `/api/proxy?url=${encodeURIComponent(m.cover)}` : (m.cover || '/placeholder-manga.svg'),
    }));
  } catch (err) {
    console.error('DB Fetch Error:', err.message);
    return [];
  }
}

export default async function Home() {
  const mangaList = await getManga();
  const trendingManga = mangaList.slice(0, 12);
  const recentManga = mangaList;

  return (
    <main className="home-page titan-bg" style={{ minHeight: '100vh', paddingBottom: '100px', color: 'white' }}>
      <Header />
      
      {/* SEO Source of Truth */}
      <h1 style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }}>
          TruyenVip - Nền tảng Đọc Truyện Tranh Online Cao Cấp từ NetTruyen và TruyenQQ
      </h1>

      <div className="container" style={{ position: 'relative', marginTop: '40px', zIndex: 100 }}>
        
        <div style={{ marginBottom: '40px' }}>
            <Suspense fallback={<div className="skeleton-loader" />}>
                <RecentlyRead />
            </Suspense>
        </div>

        <section className="section-titan fade-in">
          <div className="section-header-nebula" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Truyện Đang Hot</h2>
            </div>
          </div>
          <div className="manga-grid-titan">
            {trendingManga.map(manga => (
              <MangaCard key={manga.id} manga={manga} />
            ))}
          </div>
        </section>

        <section className="section-titan fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="section-header-nebula" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Vừa Cập Nhật</h2>
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
                <Link href="/genres" className="btn-view-all" style={{ alignSelf: 'center' }}>Xem tất cả →</Link>
            </div>
          </div>
          <div className="manga-grid-titan">
            {recentManga.map(manga => (
              <MangaCard key={manga.id} manga={manga} />
            ))}
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}

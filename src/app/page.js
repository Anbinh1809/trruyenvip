import Header from '@/components/Header';
import FeaturedSlider from '@/components/FeaturedSlider';
import DailyCheckIn from '@/components/DailyCheckIn';
import MangaCard from '@/components/MangaCard';
import RecentlyRead from '@/components/RecentlyRead';
import TrendingTicker from '@/components/TrendingTicker';
import RecommendedForYou from '@/components/RecommendedForYou';
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
            SELECT TOP 60 ${MANGA_CARD_FIELDS}
            FROM Manga 
            ORDER BY last_crawled DESC
        `);

    return result.recordset.map(m => ({
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
      
      <div className="hero-section-titan">
          <FeaturedSlider mangaList={mangaList} />
      </div>
      
      <div className="container" style={{ position: 'relative', marginTop: '-120px', zIndex: 100 }}>
        <TrendingTicker />
        <div className="top-grid-titan fade-up">
            <DailyCheckIn />
            <Suspense fallback={<div className="skeleton-loader" />}>
                <RecentlyRead />
            </Suspense>
        </div>
        
        <Suspense fallback={<div className="skeleton-loader" style={{ height: '300px', margin: '40px 0' }} />}>
            <div className="recommended-wrapper-titan">
                <RecommendedForYou />
            </div>
        </Suspense>

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

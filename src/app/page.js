import Header from '@/components/Header';
import RecentlyRead from '@/components/RecentlyRead';
import MangaCard from '@/components/MangaCard';
import Footer from '@/components/Footer';
import { query, MANGA_CARD_FIELDS } from '@/lib/db';
import Link from 'next/link';
import { Suspense } from 'react';

export const revalidate = 300; // ISR: Revalidate every 5 minutes

export const metadata = {
  title: 'TruyenVip - Nền tảng Đọc Truyện Tranh Online Cao Cấp',
  description: 'Trải nghiệm đọc truyện tranh đỉnh cao với tốc độ siêu nhanh, giao diện cinematic và kho truyện khổng lồ từ NetTruyen, TruyenQQ được cập nhật liên tục.',
  keywords: ['đọc truyện tranh', 'nettruyen', 'truyenqq', 'manga online', 'truyenvip', 'truyện hot'],
};

async function getManga() {
  try {
        const result = await query(`
            SELECT ${MANGA_CARD_FIELDS}
            FROM manga 
            ORDER BY last_crawled DESC
            LIMIT 60
        `);

    return (result.recordset || []).map(m => ({
      ...m,
      cover: m.cover?.startsWith('http') ? `/api/proxy?url=${encodeURIComponent(m.cover)}&w=400&q=75` : (m.cover || '/placeholder-manga.svg'),
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
      
      {/* Hero Section: Premium Branding & SEO */}
      <div className="home-hero-glow" style={{ position: 'relative', overflow: 'hidden', paddingTop: '120px', paddingBottom: '60px', background: 'radial-gradient(circle at 50% -20%, rgba(255, 62, 62, 0.15) 0%, transparent 70%)' }}>
          <div className="container" style={{ textAlign: 'center', position: 'relative', zIndex: 10 }}>
              <div style={{ display: 'inline-block', padding: '5px 15px', background: 'rgba(255, 62, 62, 0.1)', border: '1px solid rgba(255, 62, 62, 0.2)', borderRadius: '20px', color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 900, letterSpacing: '2px', marginBottom: '20px' }}>PREMIUM READING EXPERIENCE</div>
              <h1 style={{ fontSize: '3.5rem', fontWeight: 950, letterSpacing: '-2px', marginBottom: '15px', lineHeight: 1.1 }}>
                  Truyen<span style={{ color: 'var(--accent)' }}>Vip</span>: Thế Giới Truyện Tranh <br/> Đỉnh Cao
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.2rem', fontWeight: 600, maxWidth: '700px', margin: '0 auto 40px' }}>
                  Trải nghiệm đọc truyện cinematic, tốc độ siêu nhanh và kho truyện khổng lồ từ những nguồn tốt nhất Việt Nam.
              </p>
          </div>
      </div>

      <div className="container" style={{ position: 'relative', zIndex: 100 }}>
        
        <div style={{ marginBottom: '60px', marginTop: '-20px' }}>
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

import Header from '@/GiaoDien/BoCuc/Header';
import RecentlyRead from '@/GiaoDien/ThanhPhan/RecentlyRead';
import MangaCard from '@/GiaoDien/ThanhPhan/MangaCard';
import Footer from '@/GiaoDien/BoCuc/Footer';
import { query, MANGA_CARD_FIELDS } from '@/HeThong/Database/CoSoDuLieu';
import { getSignedProxyUrl } from '@/HeThong/BaoMat/crypto';
import Link from 'next/link';
import { Suspense } from 'react';
import { Sparkles, Zap, ChevronRight } from 'lucide-react';

export const revalidate = 300; // ISR: Revalidate every 5 minutes

export const metadata = {
  title: 'TruyenVip - Non tảng Äoc Truyện Tranh Online Cao Cấp',
  description: 'Trải nghiệm Ä‘oc truyện tranh đỉnh cao với tốc độ siêu nhanh, giao diện cinematic và  kho truyện khổng lồ từ NetTruyen, TruyenQQ Ä‘ưo£c cập nhật liên to¥c.',
  keywords: ['Ä‘oc truyện tranh', 'nettruyen', 'truyenqq', 'manga online', 'truyenvip', 'truyện hot'],
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
      cover: m.cover || '/placeholder-manga.svg',
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
    <main className="main-wrapper titan-bg home-page">
      <Header />
      
      {/* Hero Section: Premium Branding & SEO */}
      <div className="home-hero-glow">
          <div className="container center-content-titan">
              <div className="hero-badge-titan">PREMIUM READING EXPERIENCE</div>
              <h1 className="home-title-industrial">
                  TRUYỆN<span className="accent-text-titan">VIP</span>: THẾ GIỚI TRUYộN TRANH <br/> ÄốNH CAO
              </h1>
              <p className="home-subtitle-industrial">
                  Trải nghiệm Ä‘oc truyện cinematic, tốc độ siêu nhanh và  kho truyện khổng lồ từ những nguồn tốt nháº¥t Việt Nam.
              </p>
          </div>
      </div>

      <div className="container relative-z-100">
        
        <div className="home-history-wrapper">
            <Suspense fallback={<div className="skeleton-loader-industrial" />}>
                <RecentlyRead />
            </Suspense>
        </div>

        <section className="section-titan fade-in">
          <div className="section-header-nebula-industrial">
            <div className="section-title-box-titan">
                <Sparkles size={24} color="var(--accent)" />
                <h2 className="section-title-industrial">TRUYộN ÄANG HOT</h2>
            </div>
          </div>
          <div className="manga-grid-titan">
            {trendingManga.map((manga, idx) => (
              <MangaCard key={manga.id} manga={manga} priority={idx < 4} />
            ))}
          </div>
        </section>

        <section className="section-titan fade-in">
          <div className="section-header-nebula-industrial">
            <div className="section-title-box-titan">
                <Zap size={24} color="#60a5fa" />
                <h2 className="section-title-industrial">VỪA CẬP NHáº¬T</h2>
            </div>
            <Link href="/genres" className="btn-view-all-industrial">
                XEM TẤT CẢ <ChevronRight size={18} />
            </Link>
          </div>
          <div className="manga-grid-titan">
            {recentManga.map(manga => (
              <MangaCard key={manga.id} manga={manga} priority={false} />
            ))}
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}


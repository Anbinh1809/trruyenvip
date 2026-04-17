import Header from '@/GiaoDien/BoCuc/Header';
import MangaCard from '@/GiaoDien/ThanhPhan/MangaCard';
import MobileGenreNav from '@/GiaoDien/BoCuc/MobileGenreNav';
import { query, MANGA_CARD_FIELDS } from '@/HeThong/Database/CoSoDuLieu';
import Link from 'next/link';
import { headers } from 'next/headers';
import Footer from '@/GiaoDien/BoCuc/Footer';
import IndustrialEmptyState from '@/GiaoDien/TienIch/IndustrialEmptyState';

export const revalidate = 600; // ISR: Revalidate every 10 minutes

export async function generateMetadata({ searchParams }) {
  const { type } = await searchParams;
  let genreName = 'Thoƒ loáº¡i';
  
  if (type) {
    const genreRes = await query('SELECT name FROM genres WHERE slug = @slug', { slug: type });
    if (genreRes.recordset && genreRes.recordset.length > 0) genreName = genreRes.recordset[0].name;
  }

  return {
    title: `${genreName} - Khám phá truyện tranh táº¡i TruyenVip`,
    description: `Khám phá những bo™ truyện tranh thuo™c thoƒ loáº¡i ${genreName} hay nháº¥t, cháº¥t lưo£ng cao nháº¥t táº¡i TruyenVip.`
  };
}

async function getData(currentSlug) {
    const genresRes = await query('SELECT name, slug FROM genres ORDER BY name ASC');
    const allGenres = genresRes.recordset || [];

    let manga = [];
    let activeGenre = null;

    if (currentSlug) {
        // Optimized for Scale: TOP 36 instead of all
        const mangaRes = await query(`
            SELECT DISTINCT m.id, m.title, m.cover, m.last_chap_num, m.rating, m.views, m.author, m.status, m.last_crawled, m.views_at_source
            FROM manga m
            JOIN mangagenres mg ON m.id = mg.manga_id
            JOIN genres g ON mg.genre_id = g.id
            WHERE g.slug = @slug
            ORDER BY m.views_at_source DESC, m.last_crawled DESC
            LIMIT 36
        `, { slug: currentSlug });

        manga = (mangaRes.recordset || []).map(item => ({
            ...item,
            cover: item.cover?.startsWith('http') ? `/api/proxy?url=${encodeURIComponent(item.cover)}&w=400&q=75` : (item.cover || '/placeholder-manga.svg')
        }));

        activeGenre = allGenres.find(g => g.slug === currentSlug);
    } else {
        const mangaRes = await query(`SELECT ${MANGA_CARD_FIELDS} FROM manga ORDER BY last_crawled DESC LIMIT 36`);
        manga = (mangaRes.recordset || []).map(item => ({
            ...item,
            cover: item.cover?.startsWith('http') ? `/api/proxy?url=${encodeURIComponent(item.cover)}&w=400&q=75` : (item.cover || '/placeholder-manga.svg')
        }));
    }

    return { allGenres, manga, activeGenre };
}

export default async function GenresPage({ searchParams }) {
  const { type } = await searchParams;
  const { allGenres, manga, activeGenre } = await getData(type);

  const host = (await headers()).get('host') || 'truyenvip.com';
  const protocol = host.startsWith('localhost') ? 'http' : 'https';
  const origin = `${protocol}://${host}`;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Trang chủ',
        'item': `${origin}`
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'Thoƒ loáº¡i',
        'item': `${origin}/genres`
      }
    ]
  };

  if (activeGenre) {
    breadcrumbJsonLd.itemListElement.push({
      '@type': 'ListItem',
      'position': 3,
      'name': activeGenre.name,
      'item': `${origin}/genres?type=${encodeURIComponent(activeGenre.slug)}`
    });
  }

  return (
    <main className="main-wrapper titan-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') }}
      />
      <Header />
      
      <div className="container genres-container fade-in">
        <header className="library-header-industrial fade-up">
            <div className="library-badge-titan">THÆ¯ VIộN TRUYộN TRANH</div>
            <h1 className="library-title-industrial">
                {activeGenre ? activeGenre.name : 'Khám Phá Táº¥t Cả'}
            </h1>
            <p className="library-desc-industrial">
                {activeGenre 
                    ? `Danh sách các bo™ truyện thuo™c thoƒ loáº¡i ${activeGenre.name} mo›i nháº¥t.` 
                    : 'Tà¬m kiáº¿m táº­p ho£p tinh hoa truyện tranh theo soŸ thà­ch và  thoƒ loáº¡i báº¡n yêu thà­ch.'}
            </p>
        </header>

        <div className="titan-genres-layout">
            <aside className="titan-genres-sidebar">
                <div className="titan-nav-card shadow-titan">
                    <h3 className="sidebar-title-titan">THo‚ LOáº I</h3>
                    <div className="titan-genre-scroll">
                        <Link 
                            href="/genres"
                            className={`titan-nav-item ${!type ? 'active' : ''}`}
                        >
                            Táº¥t cả nội dung
                        </Link>
                        {allGenres.map(g => (
                            <Link 
                                key={g.slug}
                                href={`/genres?type=${encodeURIComponent(g.slug)}`}
                                className={`titan-nav-item ${type === g.slug ? 'active' : ''}`}
                            >
                                {g.name}
                            </Link>
                        ))}
                    </div>
                </div>
            </aside>

            <div className="titan-content">
                <MobileGenreNav genres={allGenres} />
                {manga.length > 0 ? (
                    <div className="manga-grid-titan">
                        {manga.map(item => (
                            <MangaCard key={item.id} manga={item} />
                        ))}
                    </div>
                ) : (
                    <IndustrialEmptyState 
                        title="Do® LIộU ÄANG CẬP NHáº¬T"
                        message={`Hiện táº¡i thư viện <span class="text-accent-titan">${activeGenre?.name || 'nà y'}</span> chưa cà³ bản ghi nà o Ä‘ưo£c lưu trữ. Vui lòng quay láº¡i sau.`}
                        buttonText="Quay Láº¡i Trang Chủ"
                    />
                )}
            </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}


import Header from '@/components/layout/Header';
import MangaCard from '@/components/shared/MangaCard';
import MobileGenreNav from '@/components/layout/MobileGenreNav';
import { query, MANGA_CARD_FIELDS } from '@/core/database/connection';
import { getSignedProxyUrl } from '@/core/security/crypto';
import Link from 'next/link';
import { headers } from 'next/headers';
import Footer from '@/components/layout/Footer';
import IndustrialEmptyState from '@/components/widgets/IndustrialEmptyState';
import '../genres.css';

export const revalidate = 600; // ISR: Revalidate every 10 minutes

export async function generateMetadata({ searchParams }) {
  const { type } = await searchParams;
  let genreName = 'Thể loại';
  
  if (type) {
    const genreRes = await query('SELECT name FROM genres WHERE slug = @slug', { slug: type });
    if (genreRes.recordset && genreRes.recordset.length > 0) genreName = genreRes.recordset[0].name;
  }

  return {
    title: `${genreName} - Khám phá truyện tranh tại TruyenVip`,
    description: `Khám phá những bộ truyện tranh thuộc thể loại ${genreName} hay nhất, chất lượng cao nhất tại TruyenVip.`
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
            SELECT DISTINCT TOP(36) m.id, m.title, m.cover, m.last_chap_num, m.rating, m.views, m.author, m.status, m.last_crawled, m.views_at_source, m.normalized_title
            FROM manga m
            JOIN mangagenres mg ON m.id = mg.manga_id
            JOIN genres g ON mg.genre_id = g.id
            WHERE g.slug = @slug
            ORDER BY m.views_at_source DESC, m.last_crawled DESC
        `, { slug: currentSlug });

        manga = (mangaRes.recordset || []).map(item => ({
            ...item,
            cover: item.cover ? getSignedProxyUrl(item.cover, 400, 75) : '/placeholder-manga.svg'
        }));

        activeGenre = allGenres.find(g => g.slug === currentSlug);
    } else {
        const mangaRes = await query(`SELECT TOP(36) ${MANGA_CARD_FIELDS} FROM manga ORDER BY last_crawled DESC`);
        manga = (mangaRes.recordset || []).map(item => ({
            ...item,
            cover: item.cover ? getSignedProxyUrl(item.cover, 400, 75) : '/placeholder-manga.svg'
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
        'name': 'Thể loại',
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
            <div className="library-badge-titan">THƯ VIỆN TRUYỆN TRANH</div>
            <h1 className="library-title-industrial">
                {activeGenre ? activeGenre.name : 'Khám Phá Tất Cả'}
            </h1>
            <p className="library-desc-industrial">
                {activeGenre 
                    ? `Danh sách các bộ truyện thuộc thể loại ${activeGenre.name} mới nhất.` 
                    : 'Tìm kiếm tập hợp tinh hoa truyện tranh theo sở thích và thể loại bạn yêu thích.'}
            </p>
        </header>

        <div className="titan-genres-layout">
            <aside className="titan-genres-sidebar">
                <div className="titan-nav-card shadow-titan">
                    <h3 className="sidebar-title-titan">THỂ LOẠI</h3>
                    <div className="titan-genre-scroll glass-scrollbar">
                        <Link 
                            href="/genres"
                            className={`titan-nav-item ${!type ? 'active' : ''}`}
                        >
                            Tất cả nội dung
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
                        title="DỮ LIỆU ĐANG CẬP NHẬT"
                        message={
                            <>
                                Hiện tại thư viện <span className="text-accent-titan">{activeGenre?.name || 'này'}</span> chưa có bản ghi nào được lưu trữ. Vui lòng quay lại sau.
                            </>
                        }
                        buttonText="Quay Lại Trang Chủ"
                    />
                )}
            </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

import Header from '@/components/Header';
import MangaCard from '@/components/MangaCard';
import MobileGenreNav from '@/components/MobileGenreNav';
import { query, MANGA_CARD_FIELDS } from '@/lib/db';
import Link from 'next/link';
import { headers } from 'next/headers';
import Footer from '@/components/Footer';
import GuardianBeastEmptyState from '@/components/GuardianBeastEmptyState';

export const dynamic = 'force-dynamic';


export async function generateMetadata({ searchParams }) {
  const { type } = await searchParams;
  let genreName = 'Thể loại';
  
  if (type) {
    const genreRes = await query("SELECT name FROM Genres WHERE slug = @slug", { slug: type });
    if (genreRes.recordset.length > 0) genreName = genreRes.recordset[0].name;
  }

  return {
    title: `${genreName} - Khám phá truyện tranh tại TruyenVip`,
    description: `Khám phá những bộ truyện tranh thuộc thể loại ${genreName} hay nhất, chất lượng cao nhất tại TruyenVip.`
  };
}

async function getData(currentSlug) {
    const genresRes = await query("SELECT name, slug FROM Genres ORDER BY name ASC");
    const allGenres = genresRes.recordset;

    let manga = [];
    let activeGenre = null;

    if (currentSlug) {
        // Optimized for Scale: TOP 36 instead of all
        const mangaRes = await query(`
            SELECT DISTINCT m.${MANGA_CARD_FIELDS.replace(/, /g, ', m.')}
            FROM Manga m
            JOIN MangaGenres mg ON m.id = mg.manga_id
            JOIN Genres g ON mg.genre_id = g.id
            WHERE g.slug = @slug
            ORDER BY m.views_at_source DESC, m.last_crawled DESC
            LIMIT 36
        `, { slug: currentSlug });

        manga = mangaRes.recordset.map(item => ({
            ...item,
            cover: item.cover.startsWith('http') ? `/api/proxy?url=${encodeURIComponent(item.cover)}` : item.cover
        }));

        activeGenre = allGenres.find(g => g.slug === currentSlug);
    } else {
        const mangaRes = await query(`SELECT ${MANGA_CARD_FIELDS} FROM Manga ORDER BY last_crawled DESC LIMIT 36`);
        manga = mangaRes.recordset.map(item => ({
            ...item,
            cover: item.cover.startsWith('http') ? `/api/proxy?url=${encodeURIComponent(item.cover)}` : item.cover
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
    <main className="genres-page titan-bg" style={{ minHeight: '100vh', paddingBottom: '100px', color: 'white' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') }}
      />
      <Header />
      
      <div className="container" style={{ paddingTop: '120px' }}>
        <header className="fade-up" style={{ marginBottom: '50px' }}>
            <div style={{ display: 'inline-block', padding: '4px 12px', background: 'rgba(255, 62, 62, 0.1)', border: '1px solid rgba(255, 62, 62, 0.3)', color: 'var(--accent)', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', borderRadius: 'var(--border-radius)', marginBottom: '15px' }}>THƯ VIỆN TRUYỆN</div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: '10px', color: 'var(--text-primary)' }}>
                {activeGenre ? activeGenre.name : 'Khám Phá Tất Cả'}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '1.1rem' }}>
                {activeGenre 
                    ? `Danh sách các bộ truyện thuộc thể loại ${activeGenre.name} mới nhất.` 
                    : 'Tìm kiếm truyện theo sở thích và thể loại bạn yêu thích.'}
            </p>
        </header>

        <div className="titan-genres-layout">
            <aside className="titan-genres-sidebar">
                <div className="titan-nav-card">
                    <h3 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: '20px', paddingLeft: '10px' }}>THỂ LOẠI</h3>
                    <div className="titan-genre-scroll">
                        <Link 
                            href="/genres"
                            className={`titan-nav-item ${!type ? 'active' : ''}`}
                        >
                            Tất cả truyện
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
                    <GuardianBeastEmptyState 
                        title="DỮ LIỆU ĐANG CẬP NHẬT"
                        message={`Hiện tại thể loại <strong style="color: var(--accent)">${activeGenre?.name || 'này'}</strong> chưa có truyện nào được cập nhật. Vui lòng quay lại sau.`}
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

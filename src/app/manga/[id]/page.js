import Header from '@/components/Header';
import MangaCard from '@/components/MangaCard';
import { query, MANGA_CARD_FIELDS } from '@/lib/db';
import Link from 'next/link';
import Image from 'next/image';
import ChapterPrefetcher from '@/components/ChapterPrefetcher';
import ExpandableText from '@/components/ExpandableText';
import ChapterList from '@/components/ChapterList';
import DetailCover from '@/components/DetailCover';
import ContinueReadingButton from '@/components/ContinueReadingButton';
import { headers } from 'next/headers';
import Footer from '@/components/Footer';
import { AlertCircle, PenTool, Info, Library } from 'lucide-react';

const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
};

export async function generateMetadata({ params }) {
  const { id } = await params;
  const mangaResult = await query('SELECT title, description, cover, author FROM "Manga" WHERE id = @id', { id });
  if (!mangaResult.recordset || mangaResult.recordset.length === 0) return { title: 'TruyenVip' };
  
  const manga = mangaResult.recordset[0];
  const cleanDescription = stripHtml(manga.description).substring(0, 160);
  const relativeCover = manga.cover?.startsWith('http') ? `/api/proxy?url=${encodeURIComponent(manga.cover)}` : (manga.cover || '/placeholder-manga.svg');
  
  const headersList = await headers();
  const host = headersList.get('host') || 'truyenvip.com';
  const proto = headersList.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
  const origin = `${proto}://${host}`;
  const absoluteCover = relativeCover.startsWith('http') ? relativeCover : `${origin}${relativeCover}`;

  return {
    title: `${manga.title} - TruyenVip`,
    description: cleanDescription || 'Đọc truyện tranh online chất lượng cao tại TruyenVip.',
    alternates: {
      canonical: `${origin}/manga/${encodeURIComponent(id)}`,
    },
    keywords: `${manga.title}, doc truyen ${manga.title}, manga ${manga.title}, truyen tranh online, truyen vip`,
    openGraph: {
      title: manga.title,
      description: cleanDescription,
      images: [{ url: absoluteCover, width: 800, height: 1200 }],
      type: 'article',
      url: `${origin}/manga/${id}`
    },
    twitter: {
      card: 'summary_large_image',
      title: manga.title,
      description: cleanDescription,
      images: [absoluteCover],
    }
  };
}

async function getMangaDetail(id) {
  const mangaResult = await query('SELECT id, title, author, status, description, cover, views, views_at_source, rating, alternative_titles, last_chap_num FROM "Manga" WHERE id = @id', { id });

  if (!mangaResult.recordset || mangaResult.recordset.length === 0) return null;
  
  const manga = mangaResult.recordset[0];

  try {
    await query('UPDATE "Manga" SET views = views + 1 WHERE id = @id', { id: manga.id });
  } catch (e) {
    console.error('Failed to increment views', e);
  }
  
  const genresRes = await query(`
    SELECT g.id, g.name, g.slug 
    FROM "Genres" g
    JOIN "MangaGenres" mg ON g.id = mg.genre_id
    WHERE mg.manga_id = @id
  `, { id });

  const chaptersResult = await query(`
    SELECT id, title, chapter_number, updated_at 
    FROM "Chapters" 
    WHERE manga_id = @id 
    ORDER BY 
        CASE WHEN chapter_number IS NULL THEN 0 ELSE 1 END DESC,
        chapter_number DESC, 
        updated_at DESC
  `, { id });
  
  let related = [];
  if (genresRes.recordset && genresRes.recordset.length > 0) {
    const firstGenreId = genresRes.recordset[0].id;
    try {
        const relatedRes = await query(`
            SELECT m.id, m.title, m.cover, m.last_chap_num, m.rating, m.views
            FROM Manga m
            JOIN MangaGenres mg ON m.id = mg.genre_id
            WHERE mg.genre_id = @genreId AND m.id != @id
            ORDER BY m.last_crawled DESC
            LIMIT 6
        `, { genreId: firstGenreId, id });

        related = (relatedRes.recordset || []).map(m => ({
            ...m,
            cover: m.cover?.startsWith('http') ? `/api/proxy?url=${encodeURIComponent(m.cover)}` : (m.cover || '/placeholder-manga.svg'),
        }));
    } catch (e) {
        console.error('Failed to fetch related manga', e);
    }
  }

  return {
    ...manga,
    cover: (manga.cover && manga.cover.startsWith('http')) ? `/api/proxy?url=${encodeURIComponent(manga.cover)}` : (manga.cover || '/placeholder-manga.svg'),
    genres: genresRes.recordset || [],
    chapters: chaptersResult.recordset || [],
    related: related || []
  };
}

export default async function MangaDetail({ params }) {
  const { id } = await params;
  const manga = await getMangaDetail(id);

  if (!manga) return (
      <main className="titan-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
                <AlertCircle size={80} color="var(--accent)" />
              </div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 900 }}>KHÔNG TÌM THẤY</h1>
              <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>Bộ truyện bạn yêu cầu không tồn tại hoặc đã bị gỡ bỏ.</p>
              <Link href="/" className="btn btn-primary" style={{ padding: '12px 30px' }}>Quay lại trang chủ</Link>
          </div>
      </main>
  );

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    'name': manga.title,
    'description': manga.description,
    'image': manga.cover,
    'author': {
      '@type': 'Person',
      'name': manga.author || 'Đang cập nhật'
    },
    'genre': manga.genres.map(g => g.name).join(', '),
  };

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
        'name': manga.genres[0]?.name || 'Thể loại',
        'item': `${origin}/genres?type=${manga.genres[0]?.slug || 'all'}`
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': manga.title,
        'item': `${origin}/manga/${manga.id}`
      }
    ]
  };

  // Client-side cleansing for existing legacy data with garbage breadcrumbs
  const cleanDescription = (manga.description || '')
    .replace(/(\s|^)\d+\.\s+Trang Ch?[^>]+/gi, '')
    .replace(/Trang Ch?[^>]+>\s*/gi, '')
    .replace(/Truy?n Tranh[^>]+>\s*/gi, '')
    .replace(/[>|]\s*Trang Ch?.*/gi, '')
    .trim();

  return (
    <main className="detail-page fade-in">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') }}
      />
      <Header />
      <div className="detail-hero-titan" style={{ backgroundImage: `url(${manga.cover})` }} />
      
      <div className="container detail-content-wrapper" style={{ minHeight: '600px' }}>
        <div className="detail-header responsive-header">
          <DetailCover src={manga.cover} alt={manga.title} />
          <div className="detail-info">
            <h1 className="detail-title">{manga.title}</h1>
            {manga.alternative_titles && manga.alternative_titles !== manga.title && (
                <p className="detail-subtitle">
                    {manga.alternative_titles}
                </p>
            )}
            <div className="pill-group">
                <span className="pill author-pill" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PenTool size={14} /> {manga.author || 'Đang cập nhật'}
                </span>
                <span className="pill status-pill accent">{manga.status || 'Đang cập nhật'}</span>
                {(manga.genres || []).map(g => (
                    <Link key={g.id} href={`/genres?type=${g.slug}`} className="pill genre-pill glass">
                        {g.name}
                    </Link>
                ))}
                {(!manga.genres || manga.genres.length === 0) && (
                    <span className="pill genre-pill glass" style={{ opacity: 0.5 }}>Đang cập nhật</span>
                )}
            </div>
            
            <div className="description-container glass">
                <ExpandableText 
                    text={cleanDescription || 'Nội dung bộ truyện đang được cập nhật. Hãy cùng đón chờ những tình tiết hấp dẫn nhất của siêu phẩm này tại TruyenVip.'} 
                />
                {!manga.description && manga.id && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '15px', padding: '10px 15px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', fontSize: '0.85rem' }}>
                        <Info size={14} color="var(--accent)" />
                        <Link href={`https://truyenqqno.com/truyen-tranh/${manga.id}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 800, textDecoration: 'underline' }}>Xem chi tiết tại nguồn gốc</Link>
                    </div>
                )}
            </div>

            <div className="detail-actions">
              {manga.chapters.length > 0 && (
                <ContinueReadingButton mangaId={manga.id} chapters={manga.chapters} />
              )}
            </div>

          </div>
        </div>

        <ChapterPrefetcher mangaId={manga.id} chapters={manga.chapters} />

        <ChapterList mangaId={manga.id} chapters={manga.chapters} />

        {manga.related.length > 0 && (
            <section className="section-titan" style={{ marginBottom: '80px' }}>
                <div className="section-header-titan">
                    <h2 className="title-titan" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.8rem' }}>
                        <Library size={28} color="var(--accent)" /> Truyện liên quan
                    </h2>
                </div>
                <div className="manga-grid-titan">
                    {manga.related.map(m => (
                        <MangaCard key={m.id} manga={m} />
                    ))}
                </div>
            </section>
        )}
      </div>

      <Footer />
    </main>
  );
}

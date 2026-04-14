import Header from '@/components/Header';
import MangaCard from '@/components/MangaCard';
import { query, MANGA_CARD_FIELDS } from '@/lib/db';
import Link from 'next/link';
import ChapterPrefetcher from '@/components/ChapterPrefetcher';
import ExpandableText from '@/components/ExpandableText';
import ChapterList from '@/components/ChapterList';
import DetailCover from '@/components/DetailCover';
import ContinueReadingButton from '@/components/ContinueReadingButton';
import { headers } from 'next/headers';
import Footer from '@/components/Footer';
import { AlertCircle, PenTool, Info, Library } from 'lucide-react';
import StructuredData from '@/components/SEO/StructuredData';
import ShareButton from '@/components/Social/ShareButton';
 
export const dynamic = 'force-dynamic';
export const revalidate = 0; 

const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
};

export async function generateMetadata({ params }) {
  const { id } = await params;
  const mangaResult = await query('SELECT title, description, cover FROM manga WHERE id = @id', { id });
  if (!mangaResult.recordset?.[0]) return { title: 'TruyenVip' };
  
  const manga = mangaResult.recordset[0];
  const cleanDescription = (manga.description ? stripHtml(manga.description) : '').substring(0, 160);
  const coverUrl = manga.cover || '/placeholder-manga.svg';
  const ogImage = coverUrl.startsWith('http') ? `/api/proxy?url=${encodeURIComponent(coverUrl)}&w=800` : coverUrl;
  
  return {
    title: `${manga.title} - TruyenVip`,
    description: cleanDescription || 'Đọc truyện tranh online chất lượng cao tại TruyenVip.',
    openGraph: {
      title: manga.title,
      description: cleanDescription,
      images: [{ url: ogImage, width: 800, height: 1200 }],
    }
  };
}

async function getMangaDetail(id) {
  const mangaResult = await query('SELECT id, title, author, status, description, cover, views, rating, alternative_titles FROM manga WHERE id = @id', { id });
  if (!mangaResult.recordset?.[0]) return null;
  const manga = mangaResult.recordset[0];

  try { await query('UPDATE manga SET views = views + 1 WHERE id = @id', { id: manga.id }); } catch (e) {}
  
  const genresRes = await query(`
    SELECT g.id, g.name, g.slug 
    FROM genres g
    JOIN mangagenres mg ON g.id = mg.genre_id
    WHERE mg.manga_id = @id
  `, { id });

  const chaptersResult = await query(`
    SELECT id, title, chapter_number, updated_at 
    FROM chapters 
    WHERE manga_id = @id 
    ORDER BY chapter_number DESC, updated_at DESC
  `, { id });
  
  let related = [];
  if (genresRes.recordset?.length > 0) {
    const genreIds = genresRes.recordset.map(g => g.id);
    const relatedRes = await query(`
        SELECT ${MANGA_CARD_FIELDS}
        FROM manga m
        JOIN mangagenres mg ON m.id = mg.manga_id
        WHERE mg.genre_id IN (${genreIds.join(',')}) AND m.id != @id
        GROUP BY m.id, m.title, m.cover, m.last_chap_num, m.rating, m.views, m.last_crawled, m.trending
        ORDER BY m.views DESC LIMIT 6
    `, { id });
    related = relatedRes.recordset || [];
  }

  return {
    ...manga,
    cover: manga.cover?.startsWith('http') ? `/api/proxy?url=${encodeURIComponent(manga.cover)}&w=600` : (manga.cover || '/placeholder-manga.svg'),
    genres: genresRes.recordset || [],
    chapters: chaptersResult.recordset || [],
    related
  };
}

export default async function MangaDetail({ params }) {
  const { id } = await params;
  const manga = await getMangaDetail(id);

  if (!manga) return (
      <main className="detail-page industrial-error-nebula">
          <AlertCircle size={80} color="var(--accent)" />
          <h1 className="error-title-titan">KHÔNG TÌM THẤY</h1>
          <p className="error-text">Bộ truyện bạn yêu cầu không tồn tại hoặc đã bị gỡ bỏ.</p>
          <Link href="/" className="btn btn-primary">Quay lại trang chủ</Link>
      </main>
  );

  const host = (await headers()).get('host') || 'truyenvip.com';
  const origin = `https://${host}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Series',
    'name': manga.title,
    'description': manga.description,
    'image': manga.cover,
    'author': { '@type': 'Person', 'name': manga.author || 'Đang cập nhật' },
    'genre': manga.genres.map(g => g.name)
  };

  const cleanDescription = (manga.description || '')
    .replace(/(\s|^)\d+\.\s+Trang Ch?[^>]+/gi, '')
    .trim();

  return (
    <main className="detail-page fade-in">
      <StructuredData data={jsonLd} />
      <Header />
      
      <div className="detail-hero-titan" style={{ backgroundImage: `url(${manga.cover})` }} />
      
      <div className="container detail-content-wrapper">
        <div className="detail-header responsive-header">
          <DetailCover src={manga.cover} alt={manga.title} />
          
          <div className="detail-info">
            <h1 className="detail-title">{manga.title}</h1>
            {manga.alternative_titles && manga.alternative_titles !== manga.title && (
                <p className="detail-subtitle">{manga.alternative_titles}</p>
            )}

            <div className="pill-group">
                <span className="pill author-pill">
                    <PenTool size={14} /> {manga.author || 'Đang cập nhật'}
                </span>
                <span className="pill status-pill accent">{manga.status || 'Đang cập nhật'}</span>
                {manga.genres.map(g => (
                    <Link key={g.id} href={`/genres?type=${g.slug}`} className="pill genre-pill">
                        {g.name}
                    </Link>
                ))}
            </div>
            
            <div className="detail-actions-titan">
                <Link href={`/manga/${id}/chapter/${manga.chapters[0]?.id || ''}`} className="btn btn-primary detail-cta-btn">
                    ĐỌC NGAY
                </Link>
                {manga.chapters.length > 0 && <ContinueReadingButton mangaId={manga.id} chapters={manga.chapters} />}
                <ShareButton title={manga.title} url={`${origin}/manga/${manga.id}`} />
            </div>
            
            <div className="description-container glass-titan">
                <ExpandableText text={cleanDescription || 'Nội dung bộ truyện đang được cập nhật.'} />
                {!manga.description && (
                    <div className="source-info-bar">
                        <Info size={14} color="var(--accent)" />
                        <Link href={`https://truyenqqno.com/truyen-tranh/${manga.id}`} target="_blank" className="source-link">Xem tại nguồn gốc</Link>
                    </div>
                )}
            </div>
          </div>
        </div>

        <ChapterPrefetcher mangaId={manga.id} chapters={manga.chapters} />
        <ChapterList mangaId={manga.id} chapters={manga.chapters} />

        {manga.related.length > 0 && (
            <section className="section-titan">
                <div className="section-header-titan">
                    <h2 className="title-titan section-title-industrial">
                        <Library size={28} color="var(--accent)" /> Truyện liên quan
                    </h2>
                </div>
                <div className="manga-grid-titan">
                    {manga.related.map(m => <MangaCard key={m.id} manga={m} />)}
                </div>
            </section>
        )}
      </div>
      <Footer />
    </main>
  );
}

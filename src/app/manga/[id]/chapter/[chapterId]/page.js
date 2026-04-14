import Header from '@/components/Header';
import { query } from '@/lib/db';
import Link from 'next/link';
import HistoryRecorder from '@/components/HistoryRecorder';
import ReaderSettings from '@/components/ReaderSettings';
import NextChapterPrefetcher from '@/components/NextChapterPrefetcher';
import ReaderManager from '@/components/ReaderManager';
import BackToTop from '@/components/BackToTop';
import ReadingProgressBar from '@/components/ReadingProgressBar';
import Footer from '@/components/Footer';
import dynamic from 'next/dynamic';
import ChapterContent from '@/components/ChapterContent';
import { headers } from 'next/headers';
import StructuredData from '@/components/SEO/StructuredData';
import ShareButton from '@/components/Social/ShareButton';

export const revalidate = 3600; // ISR for Reader: High cache performance

const CommentSection = dynamic(() => import('@/components/CommentSection'), { 
  loading: () => <div className="loading-dots" style={{ padding: '40px', textAlign: 'center' }}>Đang tải bình luận...</div>
});
 
export async function generateMetadata({ params }) {
  const { id, chapterId } = await params;
  const [mangaRes, chapRes] = await Promise.all([
    query('SELECT title FROM "Manga" WHERE id = @id', { id }),
    query('SELECT title FROM "Chapters" WHERE id = @id', { id: chapterId })
  ]);
 
  const manga = mangaRes.recordset?.[0];
  const chapter = chapRes.recordset?.[0];
 
  if (!manga || !chapter) return { title: 'Đang tải chương... - TruyenVip' };

  // Fetch first image for better OG sharing
  const imgRes = await query('SELECT image_url FROM "ChapterImages" WHERE chapter_id = @id ORDER BY "order" ASC LIMIT 1', { id: chapterId });
  const ogImage = imgRes.recordset?.[0]?.image_url 
    ? `/api/proxy?url=${encodeURIComponent(imgRes.recordset[0].image_url)}&w=600&q=70`
    : (manga.cover || '/placeholder-manga.svg');
 
  return {
    title: `${chapter.title}: ${manga.title} - TruyenVip`,
    description: `Đọc truyện tranh ${manga.title} - ${chapter.title} chất lượng cao, cập nhật mới nhất tại TruyenVip.`,
    openGraph: {
        title: `${chapter.title}: ${manga.title}`,
        description: `Đọc ngay ${chapter.title} của ${manga.title} tại TruyenVip. Truyện bản đẹp, load cực nhanh!`,
        images: [
            {
                url: ogImage,
                width: 600,
                height: 800,
                alt: chapter.title
            }
        ],
        type: 'book'
    }
  };
}

async function getChapterData(mangaId, chapterId) {
  const [mangaResult, chapResult, imgResult] = await Promise.all([
    query('SELECT id, title, cover FROM "Manga" WHERE id = @id', { id: mangaId }),
    query('SELECT id, title, source_url, chapter_number FROM "Chapters" WHERE id = @id', { id: chapterId }),
    query('SELECT image_url FROM "ChapterImages" WHERE chapter_id = @id ORDER BY "order" ASC', { id: chapterId })
  ]);

  if (!mangaResult.recordset || mangaResult.recordset.length === 0 || !chapResult.recordset || chapResult.recordset.length === 0) return null;
  const chapter = chapResult.recordset[0];
  const currentNum = chapter.chapter_number;

  // Targeted Next/Prev Queries for performance
  const [prevChapRes, nextChapRes] = await Promise.all([
    query(`SELECT id, title, chapter_number FROM "Chapters" 
           WHERE manga_id = @mangaId AND chapter_number < @num 
           ORDER BY chapter_number DESC LIMIT 1`, { mangaId, num: currentNum }),
    query(`SELECT id, title, chapter_number FROM "Chapters" 
           WHERE manga_id = @mangaId AND chapter_number > @num 
           ORDER BY chapter_number ASC LIMIT 1`, { mangaId, num: currentNum })
  ]);

  const prevChapter = prevChapRes.recordset?.[0] || null;
  const nextChapter = nextChapRes.recordset?.[0] || null;

  return {
    manga: mangaResult.recordset[0],
    chapter,
    images: (imgResult.recordset || []).map(img => `/api/proxy?url=${encodeURIComponent(img.image_url)}&w=1200`),
    prevChapter,
    nextChapter
  };
}

export default async function ChapterReader({ params }) {
  const { id, chapterId } = await params;
  const data = await getChapterData(id, chapterId);

  if (!data) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      <div className="titan-loader-pulse"></div>
    </div>
  );

  const prevChapter = data.prevChapter; 
  const nextChapter = data.nextChapter?.id ? data.nextChapter : null;

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
        'name': data.manga.title,
        'item': `${origin}/manga/${data.manga.id}`
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': data.chapter.title,
        'item': `${origin}/manga/${data.manga.id}/chapter/${data.chapter.id}`
      }
    ]
  };

  return (
    <main className="reader-page titan-bg" style={{ minHeight: '100vh', color: 'white' }}>
      <StructuredData data={breadcrumbJsonLd} />
      <ReadingProgressBar />
      <HistoryRecorder manga={data.manga} chapter={data.chapter} />
      <ReaderSettings />
      
      <ReaderManager 
        mangaId={id} 
        prevChapterId={prevChapter?.id} 
        nextChapterId={nextChapter?.id} 
      />
      
      <div className="reader-sticky-nav">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%', gap: '12px' }}>
          <Link href={`/manga/${id}`} className="reader-back-link">
            <span className="desktop-only">Quay lại: {data.manga.title}</span>
            <span className="mobile-only">Back</span>
          </Link>
          <div className="reader-chap-title">{data.chapter.title}</div>
          <div className="reader-nav-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
            <div className="nav-group" style={{ display: 'flex', gap: '8px' }}>
                {prevChapter && (
                    <Link href={`/manga/${id}/chapter/${prevChapter.id}`} className="btn-reader-nav" title="Chương trước">
                        Trước
                    </Link>
                )}
                <ShareButton 
                    title={`${data.chapter.title}: ${data.manga.title}`} 
                    text={`Tôi đang đọc ${data.manga.title} tại TruyenVip, hay quá anh em ơi!`} 
                    url={`${origin}/manga/${id}/chapter/${chapterId}`} 
                    className="desktop-only"
                />
                {nextChapter && (
                    <Link href={`/manga/${id}/chapter/${nextChapter.id}`} className="btn-reader-nav" title="Chương sau">
                        Sau
                    </Link>
                )}
            </div>
          </div>
        </div>
      </div>

      <div className="reader-container">
        <ChapterContent chapterId={chapterId} initialImages={data.images} />
      </div>

      <div className="reader-footer" style={{ padding: '80px 0', borderTop: '1px solid var(--glass-border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ marginBottom: '30px', fontWeight: 800 }}>Bạn đã đọc xong {data.chapter.title}</h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
            {prevChapter && (
              <Link href={`/manga/${id}/chapter/${prevChapter.id}`} className="btn btn-outline" style={{ height: '55px', padding: '0 30px' }}>
                 Chương trước
              </Link>
            )}
            <Link href={`/manga/${id}`} className="btn btn-primary" style={{ height: '55px', background: 'rgba(255,255,255,0.05)', color: 'white', padding: '0 30px' }}>
              Mục lục
            </Link>
            {nextChapter && (
              <Link href={`/manga/${id}/chapter/${nextChapter.id}`} className="btn btn-primary" style={{ height: '55px', padding: '0 30px' }}>
                Chương sau
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>

      <BackToTop />
      <div className="container">
          <CommentSection chapterId={chapterId} />
      </div>
      <div style={{ marginBottom: '100px' }} />
      <Footer />
    </main>
  );
}

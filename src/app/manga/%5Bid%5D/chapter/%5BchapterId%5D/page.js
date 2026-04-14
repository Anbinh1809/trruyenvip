import Header from '@/components/Header';
import { query } from '@/lib/db';
import Link from 'next/link';
import HistoryRecorder from '@/components/HistoryRecorder';
import ReaderSettings from '@/components/ReaderSettings';
import ReaderManager from '@/components/ReaderManager';
import ReadingProgressBar from '@/components/ReadingProgressBar';
import Footer from '@/components/Footer';
import dynamic from 'next/dynamic';
import ChapterContent from '@/components/ChapterContent';
import { headers } from 'next/headers';
import StructuredData from '@/components/SEO/StructuredData';
import ShareButton from '@/components/Social/ShareButton';

export const revalidate = 3600; // ISR for Reader

const CommentSection = dynamic(() => import('@/components/CommentSection'), { 
  loading: () => <div className="loading-dots" style={{ padding: '60px', textAlign: 'center', opacity: 0.5 }}>Đang tải bình luận...</div>
});
 
export async function generateMetadata({ params }) {
  const { id, chapterId } = await params;
  const [mangaRes, chapRes] = await Promise.all([
    query('SELECT title FROM manga WHERE id = @id', { id }),
    query('SELECT title FROM chapters WHERE id = @id', { id: chapterId })
  ]);
 
  const manga = mangaRes.recordset?.[0];
  const chapter = chapRes.recordset?.[0];
  if (!manga || !chapter) return { title: 'Đang tải chương... - TruyenVip' };

  const imgRes = await query('SELECT image_url FROM chapterimages WHERE chapter_id = @id ORDER BY "order" ASC LIMIT 1', { id: chapterId });
  const ogImage = imgRes.recordset?.[0]?.image_url 
    ? `/api/proxy?url=${encodeURIComponent(imgRes.recordset[0].image_url)}&w=600`
    : (manga.cover || '/placeholder-manga.svg');
 
  return {
    title: `${chapter.title}: ${manga.title} - TruyenVip`,
    description: `Đọc truyện tranh ${manga.title} - ${chapter.title} chất lượng cao tại TruyenVip.`,
    openGraph: {
        title: `${chapter.title}: ${manga.title}`,
        images: [{ url: ogImage, width: 600, height: 800 }]
    }
  };
}

async function getChapterData(mangaId, chapterId) {
  const [mangaResult, chapResult, imgResult] = await Promise.all([
    query('SELECT id, title, cover FROM manga WHERE id = @id', { id: mangaId }),
    query('SELECT id, title, chapter_number FROM chapters WHERE id = @id', { id: chapterId }),
    query('SELECT image_url FROM chapterimages WHERE chapter_id = @id ORDER BY "order" ASC', { id: chapterId })
  ]);

  if (!mangaResult.recordset?.[0] || !chapResult.recordset?.[0]) return null;
  const chapter = chapResult.recordset[0];
  const currentNum = chapter.chapter_number;

  const [prevChapRes, nextChapRes] = await Promise.all([
    query(`SELECT id, title, chapter_number FROM chapters WHERE manga_id = @mangaId AND chapter_number < @num ORDER BY chapter_number DESC LIMIT 1`, { mangaId, num: currentNum }),
    query(`SELECT id, title, chapter_number FROM chapters WHERE manga_id = @mangaId AND chapter_number > @num ORDER BY chapter_number ASC LIMIT 1`, { mangaId, num: currentNum })
  ]);

  return {
    manga: mangaResult.recordset[0],
    chapter,
    images: (imgResult.recordset || []).map(img => `/api/proxy?url=${encodeURIComponent(img.image_url)}&w=1200`),
    prevChapter: prevChapRes.recordset?.[0] || null,
    nextChapter: nextChapRes.recordset?.[0] || null
  };
}

export default async function ChapterReader({ params }) {
  const { id, chapterId } = await params;
  const data = await getChapterData(id, chapterId);
  if (!data) return <div className="titan-bg" style={{ height: '100vh' }}><div className="titan-loader-pulse"></div></div>;

  const { manga, chapter, images, prevChapter, nextChapter } = data;
  const host = (await headers()).get('host') || 'truyenvip.com';
  const origin = `${host.startsWith('localhost') ? 'http' : 'https'}://${host}`;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Trang chủ', 'item': origin },
      { '@type': 'ListItem', 'position': 2, 'name': manga.title, 'item': `${origin}/manga/${manga.id}` },
      { '@type': 'ListItem', 'position': 3, 'name': chapter.title, 'item': `${origin}/manga/${manga.id}/chapter/${chapter.id}` }
    ]
  };

  return (
    <main className="reader-page titan-bg">
      <StructuredData data={breadcrumbJsonLd} />
      <ReadingProgressBar />
      <HistoryRecorder manga={manga} chapter={chapter} />
      <ReaderSettings />
      <ReaderManager mangaId={id} prevChapterId={prevChapter?.id} nextChapterId={nextChapter?.id} />
      
      <div className="reader-sticky-nav">
        <div className="container reader-nav-layout">
          <Link href={`/manga/${id}`} className="reader-back-link truncate-1">
            <span className="desktop-only border-accent-bottom">Quay lại: {manga.title}</span>
            <span className="mobile-only">Lịch sử</span>
          </Link>
          <div className="reader-chap-title truncate-1">{chapter.title}</div>
          <div className="reader-nav-actions">
              {prevChapter && <Link href={`/manga/${id}/chapter/${prevChapter.id}`} className="btn-reader-nav">Trước</Link>}
              <ShareButton title={`${chapter.title}: ${manga.title}`} url={`${origin}/manga/${id}/chapter/${chapterId}`} className="desktop-only" />
              {nextChapter && <Link href={`/manga/${id}/chapter/${nextChapter.id}`} className="btn-reader-nav">Sau</Link>}
          </div>
        </div>
      </div>

      <div className="reader-container">
        <ChapterContent chapterId={chapterId} initialImages={images} />
      </div>

      <div className="reader-finish-zone">
        <div className="container" style={{ maxWidth: '850px' }}>
          <div className="finish-nebula-finish">
            <div className="finish-label">CHƯƠNG HIỆN TẠI HOÀN TẤT</div>
            <h2 className="finish-title">{chapter.title}</h2>
            
            {nextChapter ? (
                <div className="next-up-card-premium glass-titan">
                    <div className="next-up-content">
                        <div className="next-up-label">CHƯƠNG TIẾP THEO</div>
                        <div className="next-up-title truncate-1">{nextChapter.title}</div>
                    </div>
                    <Link href={`/manga/${id}/chapter/${nextChapter.id}`} className="btn btn-primary next-up-btn">
                        TIẾP TỤC ĐỌC
                    </Link>
                </div>
            ) : (
                <div className="latest-chapter-badge">
                    <div className="badge-title">🎉 BẠN ĐÃ ĐỌC ĐẾN CHƯƠNG MỚI NHẤT!</div>
                    <p className="badge-sub">Theo dõi bộ truyện để nhận thông báo mới nhất.</p>
                </div>
            )}

            <div className="reader-footer-links">
                {prevChapter && <Link href={`/manga/${id}/chapter/${prevChapter.id}`} className="btn-utility-reader">← Trước</Link>}
                <Link href={`/manga/${id}`} className="btn-utility-reader">Mục lục</Link>
                <Link href="/" className="btn-utility-reader">Trang chủ</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container reader-comments-section">
          <CommentSection chapterId={chapterId} />
      </div>
      
      <Footer />
    </main>
  );
}

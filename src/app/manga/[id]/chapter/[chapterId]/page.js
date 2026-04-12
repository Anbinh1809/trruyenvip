import Header from '@/components/Header';
import { query } from '@/lib/db';
import Link from 'next/link';
import HistoryRecorder from '@/components/HistoryRecorder';
import ReaderSettings from '@/components/ReaderSettings';
import XPRewarder from '@/components/XPRewarder';
import RewardTimer from '@/components/RewardTimer';
import NextChapterPrefetcher from '@/components/NextChapterPrefetcher';
import MissionTrigger from '@/components/MissionTrigger';
import ReaderManager from '@/components/ReaderManager';
import ZenModeButton from '@/components/ZenModeButton';
import BackToTop from '@/components/BackToTop';
import ReadingProgressBar from '@/components/ReadingProgressBar';
import RecommendedForYou from '@/components/RecommendedForYou';
import Footer from '@/components/Footer';
import dynamic from 'next/dynamic';
import ChapterContent from '@/components/ChapterContent';
import EndPageCelebration from '@/components/EndPageCelebration';

const CommentSection = dynamic(() => import('@/components/CommentSection'), { 
  loading: () => <div className="loading-dots" style={{ padding: '40px', textAlign: 'center' }}>Đang tải bình luận...</div>
});

async function getChapterData(mangaId, chapterId) {
  // Execute all major queries in parallel to minimize TTFB
  const [mangaResult, chapResult, imgResult, allChaps] = await Promise.all([
    query("SELECT id, title, cover FROM Manga WHERE id = @id", { id: mangaId }),
    query("SELECT id, title, source_url, chapter_number FROM Chapters WHERE id = @id", { id: chapterId }),
    query("SELECT image_url FROM ChapterImages WHERE chapter_id = @id ORDER BY [order] ASC", { id: chapterId }),
    query("SELECT id, title, chapter_number FROM Chapters WHERE manga_id = @mangaId ORDER BY chapter_number ASC, updated_at ASC", { mangaId })
  ]);

  if (mangaResult.recordset.length === 0 || chapResult.recordset.length === 0) return null;
  const chapter = chapResult.recordset[0];

  const sorted = [...allChaps.recordset].sort((a, b) => (a.chapter_number || 0) - (b.chapter_number || 0));
  const currentIdx = sorted.findIndex(c => c.id === chapterId);
  const nextChapterId = (currentIdx < sorted.length - 1) ? sorted[currentIdx + 1].id : null;

  let nextChapterImages = [];
  if (nextChapterId) {
      const nextImgRes = await query("SELECT image_url FROM ChapterImages WHERE chapter_id = @id ORDER BY [order] ASC", { id: nextChapterId });
      nextChapterImages = nextImgRes.recordset;
  }

  return {
    manga: mangaResult.recordset[0],
    chapter,
    images: imgResult.recordset.map(img => `/api/proxy?url=${encodeURIComponent(img.image_url)}&w=1200`),
    allChapters: allChaps.recordset,
    nextChapter: { id: nextChapterId, images: nextChapterImages }
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

  const sortedChapters = [...data.allChapters].sort((a, b) => (a.chapter_number || 0) - (b.chapter_number || 0));
  const sortedIdx = sortedChapters.findIndex(c => c.id === chapterId);
  const prevChapter = sortedIdx > 0 ? sortedChapters[sortedIdx - 1] : null; 
  const nextChapter = sortedIdx < sortedChapters.length - 1 ? sortedChapters[sortedIdx + 1] : null;

  return (
    <main className="reader-page titan-bg" style={{ minHeight: '100vh', color: 'white' }}>
      <ReadingProgressBar />
      <HistoryRecorder manga={data.manga} chapter={data.chapter} />
      <XPRewarder chapterId={chapterId} />
      <RewardTimer chapterId={chapterId} />
      <MissionTrigger type="READ_CHAPTER" />
      <MissionTrigger type="GENRE_DIVERSITY" />
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
            <ZenModeButton />
            <div className="nav-group" style={{ display: 'flex', gap: '8px' }}>
                {prevChapter && (
                    <Link href={`/manga/${id}/chapter/${prevChapter.id}`} className="btn-reader-nav" title="Chương trước">
                        Trước
                    </Link>
                )}
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

      {!nextChapter && (
          <EndPageCelebration mangaId={id} mangaTitle={data.manga.title} />
      )}

      {data.nextChapter.id && (
          <NextChapterPrefetcher 
            nextChapterId={data.nextChapter.id} 
            nextChapterImages={data.nextChapter.images} 
          />
      )}

      {nextChapter && (
          <link rel="prefetch" href={`/manga/${id}/chapter/${nextChapter.id}`} />
      )}

      <div className="reader-footer" style={{ padding: '80px 0', borderTop: '1px solid var(--glass-border)' }}>
        <div className="container">
          <div style={{ marginBottom: '60px' }}>
            <RecommendedForYou />
          </div>
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

      <BackToTop />
      <div style={{ marginBottom: '100px' }} />
      <Footer />
      <div className="container">
          <CommentSection chapterId={chapterId} />
      </div>
    </main>
  );
}

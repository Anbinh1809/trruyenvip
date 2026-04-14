import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ChapterContent from '@/components/ChapterContent';
import ReaderSettings from '@/components/ReaderSettings';
import { query } from '@/lib/db';
import { generateProxySignature } from '@/lib/crypto';
import "@/app/reader.css";
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ChevronLeft, ChevronRight, Home, BookOpen, AlertTriangle } from 'lucide-react';

import ChapterSelector from '@/components/ChapterSelector';

// Lazy load comments to prevent hydration mismatches
const Comments = dynamic(() => import('@/components/CommentSection'), { 
  loading: () => <div className="loading-dots-industrial">Đang tải bình luận...</div>
});

async function getChapterData(mangaId, chapterId) {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mangaId);
    
    let mangaRes;
    if (isUuid) {
        mangaRes = await query('SELECT id, title FROM manga WHERE id = @mangaId', { mangaId });
    } else {
        mangaRes = await query('SELECT id, title FROM manga WHERE normalized_title = @mangaId', { mangaId });
    }
    
    const manga = mangaRes.recordset[0];
    if (!manga) return null;

    const internalMangaId = manga.id;
    const chapterRes = await query('SELECT id, title, chapter_number, content FROM chapters WHERE id = @chapterId', { chapterId });
    const chapter = chapterRes.recordset[0];
    if (!chapter) return null;

    const chaptersRes = await query(`
        SELECT id, chapter_number, title 
        FROM chapters 
        WHERE manga_id = @internalMangaId 
        ORDER BY NULLIF(regexp_replace(chapter_number, '[^0-9.]', '', 'g'), '')::numeric ASC
    `, { internalMangaId });
    const chapters = chaptersRes.recordset;

    const currentIndex = chapters.findIndex(c => c.id === chapterId);
    const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
    const nextChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

    return { manga, chapter, chapters, prevChapter, nextChapter };
  } catch (err) {
    console.error('Fetch Chapter Error:', err);
    return null;
  }
}

export default async function ChapterPage({ params }) {
  const { id, chapterId } = await params;
  const data = await getChapterData(id, chapterId);

  if (!data) {
    return (
        <div className="fullscreen-error-industrial titan-bg">
            <AlertTriangle size={60} color="var(--accent)" />
            <h2 className="error-title-industrial">LỖI TRUY XUẤT NỘI DUNG</h2>
            <p className="error-desc-industrial">Không thể tìm thấy chương truyện này. Có thể liên kết đã hết hạn hoặc bị gỡ bỏ.</p>
            <Link href="/" className="btn btn-primary err-btn-titan">QUAY LẠI TRANG CHỦ</Link>
        </div>
    );
  }

    const { manga, chapter, chapters, nextChapter, prevChapter } = data;
    
    // Server-side image signing (Ultra-Fidelity)
    const imagesRes = await query('SELECT image_url FROM chapterimages WHERE chapter_id = @id ORDER BY "order" ASC', { id: chapterId });
    const initialImages = (imagesRes.recordset || []).map(img => {
        const w = 1200; // Default server-side width
        const q = 80;   // Default quality
        const sig = generateProxySignature(img.image_url, w, q);
        return `/api/proxy?url=${encodeURIComponent(img.image_url)}&w=${w}&q=${q}&sig=${sig}`;
    });

    return (
        <main className="main-wrapper titan-bg reader-industrial-layout">
            <div className="reader-hud-titan shadow-titan">
                <div className="container reader-nav-wrapper">
                    <Link href={`/manga/${id}`} className="reader-back-btn">
                        <ChevronLeft size={24} />
                        <span className="truncate-1 desktop-only">{manga.title}</span>
                    </Link>

                    <div className="reader-nav-center">
                        <ChapterSelector mangaId={id} chapters={chapters} currentId={chapterId} />
                    </div>

                    <div className="reader-nav-actions-industrial">
                        <div className="nav-step-group">
                            {prevChapter && (
                                <Link href={`/manga/${id}/chapter/${prevChapter.id}`} className="titan-icon-btn nav-btn-reader" title="Chương trước">
                                    <ChevronLeft size={20} />
                                </Link>
                            )}
                            {nextChapter && (
                                <Link href={`/manga/${id}/chapter/${nextChapter.id}`} className="titan-icon-btn nav-btn-reader" title="Chương sau">
                                    <ChevronRight size={20} />
                                </Link>
                            )}
                        </div>
                        <div className="v-divider" />
                        <ReaderSettings />
                    </div>
                </div>
            </div>

            <div className="reader-content-industrial">
                <ChapterContent 
                    mangaId={id} 
                    chapter={chapter} 
                    nextChapterId={nextChapter?.id} 
                    prevChapterId={prevChapter?.id}
                    mangaTitle={manga.title}
                    initialImages={initialImages}
                />
            </div>

      {/* Reader Footer: Finish Celebration */}
      <footer className="reader-footer-industrial">
        <div className="container reader-footer-container-titan">
            <span className="finish-label-titan">BẠN ĐÃ HOÀN THÀNH CHƯƠNG NÀY</span>
            <h2 className="finish-title-titan">{chapter.title || `Chương ${chapter.chapter_number}`}</h2>

            {nextChapter ? (
                <div className="next-chapter-card-titan shadow-titan fade-in">
                    <div className="next-chapter-info">
                        <div className="next-up-tag">CHƯƠNG TIẾP THEO</div>
                        <h4 className="next-chapter-title-titan">{nextChapter.title || `Chương ${nextChapter.chapter_number}`}</h4>
                    </div>
                    <Link href={`/manga/${id}/chapter/${nextChapter.id}`} className="btn btn-primary next-btn-industrial">
                        ĐỌC TIẾP <ChevronRight size={20} />
                    </Link>
                </div>
            ) : (
                <div className="all-caught-up-industrial fade-in">
                    <h3 className="caught-up-title">BẠN ĐÃ THEO KỊP CHƯƠNG MỚI NHẤT! 🎉</h3>
                    <p className="caught-up-desc">Hãy theo dõi bộ truyện để nhận thông báo khi có chương mới.</p>
                </div>
            )}

            <div className="reader-footer-actions">
                <Link href="/" className="btn btn-glass footer-action-btn">
                    <Home size={18} /> TRANG CHỦ
                </Link>
                <Link href={`/manga/${id}`} className="btn btn-glass footer-action-btn">
                    <BookOpen size={18} /> CHI TIẾT TRUYỆN
                </Link>
            </div>

            <div className="reader-comments-section">
                <Comments mangaId={id} chapterId={chapterId} />
            </div>
        </div>
      </footer>

    </main>
  );
}

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ChapterList from '@/components/ChapterList';
import DetailCover from '@/components/DetailCover';
import { query, MANGA_CARD_FIELDS } from '@/lib/db';
import Link from 'next/link';
import { BookOpen, User, Star, Calendar, Share2, Heart, AlertOctagon } from 'lucide-react';

async function getManga(id) {
  try {
    const res = await query(`
        SELECT ${MANGA_CARD_FIELDS}, description, author, status, genres, last_crawled
        FROM manga WHERE id = @id
    `, { id });
    const manga = res.recordset[0];
    if (!manga) return null;

    const chaptersRes = await query(`
        SELECT id, chapter_number, title, created_at 
        FROM chapters WHERE manga_id = @id 
        ORDER BY chapter_number DESC
    `, { id });
    
    return {
      ...manga,
      cover: manga.cover?.startsWith('http') ? `/api/proxy?url=${encodeURIComponent(manga.cover)}` : (manga.cover || '/placeholder-manga.svg'),
      chapters: chaptersRes.recordset,
      genres: manga.genres ? JSON.parse(manga.genres) : []
    };
  } catch (err) {
    console.error('Fetch Manga Error:', err);
    return null;
  }
}

export default async function MangaDetailPage({ params }) {
  const { id } = await params;
  const manga = await getManga(id);

  if (!manga) {
    return (
      <main className="main-wrapper titan-bg">
        <Header />
        <div className="container auth-required-industrial fade-up">
            <div className="center-icon-titan">
                <AlertOctagon size={80} color="var(--accent)" />
            </div>
            <h1 className="auth-required-title">KHÔNG TÌM THẤY</h1>
            <p className="auth-required-subtitle">Bộ truyện bạn yêu cầu không tồn tại hoặc đã bị gỡ bỏ khỏi hệ thống.</p>
            <Link href="/" className="btn btn-primary login-trigger-titan">QUAY LẠI TRANG CHỦ</Link>
        </div>
        <Footer />
        <style jsx>{`
            .center-icon-titan { display: flex; justify-content: center; margin-bottom: 30px; }
            .auth-required-subtitle { color: rgba(255,255,255,0.4); margin-bottom: 40px; font-weight: 700; font-size: 1.1rem; }
            .login-trigger-titan { padding: 18px 60px; font-weight: 950; letter-spacing: 1px; }
        `}</style>
      </main>
    );
  }

  return (
    <main className="main-wrapper titan-bg">
      <Header />
      
      <div 
        className="detail-hero-titan" 
        style={{ '--bg-cover': `url(${manga.cover})` }} 
      />

      <div className="container detail-content-wrapper fade-in">
        <div className="detail-grid-titan">
            {/* LEFT: COVER & STATS */}
            <div className="detail-left-column">
                <div className="detail-cover-box shadow-titan">
                    <DetailCover src={manga.cover} alt={manga.title} />
                </div>
                
                <div className="detail-meta-stats-industrial">
                    <div className="meta-stat-node shadow-titan">
                        <Star size={20} color="#fbbf24" fill="#fbbf24" />
                        <div className="stat-info">
                            <span className="stat-label-industrial">ĐÁNH GIÁ</span>
                            <span className="stat-value-industrial">4.9/5.0</span>
                        </div>
                    </div>
                    <div className="meta-stat-node shadow-titan">
                        <Heart size={20} color="var(--accent)" fill="var(--accent)" />
                        <div className="stat-info">
                            <span className="stat-label-industrial">YÊU THÍCH</span>
                            <span className="stat-value-industrial">12.5k</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT: INFO & CHAPTERS */}
            <div className="detail-right-column">
                <div className="detail-header-industrial">
                    <div className="genre-cloud-industrial">
                        {manga.genres.map(g => (
                            <span key={g.id} className="genre-tag-titan">{g.name}</span>
                        ))}
                    </div>
                    <h1 className="detail-title-industrial">{manga.title}</h1>
                    
                    <div className="pill-group-industrial">
                        <span className="author-pill-titan">
                            <User size={16} /> {manga.author || 'Đang cập nhật'}
                        </span>
                        <span className="status-pill-titan">
                            <Calendar size={16} /> 2024 • {manga.status || 'Đang tiến hành'}
                        </span>
                    </div>
                </div>

                <p className="detail-desc-industrial">
                    {manga.description || 'Chưa có tóm tắt nội dung cho bộ truyện này. Chúng tôi sẽ cập nhật trong thời gian sớm nhất.'}
                </p>

                <div className="detail-actions-titan">
                    <Link href={`/manga/${id}/chapter/${manga.chapters[manga.chapters.length - 1]?.id || ''}`} className="btn btn-primary read-btn-titan shadow-titan">
                        <BookOpen size={20} /> ĐỌC TỪ ĐẦU
                    </Link>
                    <button className="btn btn-glass fav-btn-titan shadow-titan">
                        <Heart size={20} /> YÊU THÍCH
                    </button>
                    <button className="btn btn-glass share-btn-titan shadow-titan">
                        <Share2 size={20} /> CHIA SẺ
                    </button>
                </div>

                <section className="chapters-section-industrial">
                    <div className="section-header-titan">
                        <h2 className="title-titan section-title-industrial">DANH SÁCH CHƯƠNG</h2>
                        <span className="chapter-count-titan">{manga.chapters.length} CHAPTERS</span>
                    </div>
                    <ChapterList chapters={manga.chapters} mangaId={id} />
                </section>
            </div>
        </div>
      </div>

      <Footer />
      <style jsx>{`
        .detail-hero-titan { background-image: var(--bg-cover); }
        .detail-meta-stats-industrial {
            margin-top: 30px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .meta-stat-node {
            background: rgba(15, 23, 42, 0.4);
            border: 1px solid var(--glass-border);
            border-radius: 16px;
            padding: 15px;
            display: flex;
            align-items: center;
            gap: 12px;
            backdrop-filter: blur(10px);
            transition: all 0.3s;
        }
        .meta-stat-node:hover { transform: scale(1.02); background: rgba(15, 23, 42, 0.6); }
        .stat-info { display: flex; flex-direction: column; }
        .stat-label-industrial { font-size: 0.65rem; font-weight: 950; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 1px; }
        .stat-value-industrial { font-size: 0.95rem; font-weight: 950; color: white; }
        .genre-cloud-industrial { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
        .genre-tag-titan { font-size: 0.75rem; font-weight: 900; color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.05); padding: 5px 12px; border-radius: 6px; text-transform: uppercase; letter-spacing: 1px; }
        .pill-group-industrial { display: flex; gap: 15px; margin-bottom: 30px; }
        .status-pill-titan { font-size: 0.9rem; font-weight: 800; color: rgba(255,255,255,0.5); display: flex; align-items: center; gap: 8px; }
        .fav-btn-titan, .share-btn-titan { padding: 16px 25px; display: flex; align-items: center; gap: 10px; font-weight: 850; }
        .chapter-count-titan { font-size: 0.75rem; font-weight: 950; color: var(--accent); background: rgba(255,62,62,0.1); padding: 5px 12px; border-radius: 20px; letter-spacing: 1px; }
        @media (max-width: 768px) {
            .detail-meta-stats-industrial { grid-template-columns: 1fr; }
            .pill-group-industrial { flex-direction: column; align-items: center; }
            .genre-cloud-industrial { justify-content: center; }
        }
      `}</style>
    </main>
  );
}

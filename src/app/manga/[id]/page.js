import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ChapterList from '@/components/reader/ChapterList';
import DetailCover from '@/components/shared/DetailCover';
import DetailActions from '@/components/shared/DetailActions';
import { query, MANGA_CARD_FIELDS } from '@/core/database/connection';
import { getSignedProxyUrl } from '@/core/security/crypto';
import "@/components/shared/Styles/manga-detail.css";
import Link from 'next/link';
import { BookOpen, User, Star, Calendar, Share2, Heart, AlertOctagon, Sparkles, Eye } from 'lucide-react';
import DiscoveryTrigger from '@/components/layout/DiscoveryTrigger';
import MangaHealer from '@/components/reader/MangaHealer';

// Helper to determine if a slug is a potential new ingestion target
function isDiscoveryCandidate(slug) {
    if (!slug) return false;
    // Strictly check for mirror patterns (e.g. name-12345)
    return /-[0-9]+$/.test(slug);
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const cleanId = id?.toString().trim();
  const res = await query('SELECT TOP(1) title, description, cover FROM manga WHERE id = @id OR LOWER(normalized_title) = LOWER(@id)', { id: cleanId });
  const manga = res.recordset?.[0];

  if (!manga) return { title: 'Manga Not Found | TruyenVip' };

  const ogImage = manga.cover 
    ? `https://truyenvip.com${getSignedProxyUrl(manga.cover, 1200, 75)}` 
    : 'https://truyenvip.com/placeholder-manga.svg';

  return {
    title: `${manga.title} [Full] - Đọc Truyện Tranh Online | TruyenVip`,
    description: manga.description?.substring(0, 160) || `Đọc truyện ${manga.title} bản đẹp nhất, cập nhật nhanh nhất tại TruyenVip.`,
    openGraph: {
      title: manga.title,
      description: manga.description?.substring(0, 160),
      images: [ogImage],
      type: 'article',
      siteName: 'TruyenVip',
    },
    twitter: {
      card: 'summary_large_image',
      title: manga.title,
      description: manga.description?.substring(0, 160),
      images: [ogImage],
    }
  };
}



async function getManga(id) {
  try {
    const cleanId = id?.toString().trim();
    if (!cleanId) return null;

    // TITAN SMART LOOKUP 2.0: Check both id and normalized_title simultaneously
    let res = await query(`
        SELECT TOP(1) ${MANGA_CARD_FIELDS}, description
        FROM manga 
        WHERE id = @id OR LOWER(id) = LOWER(@id) OR LOWER(normalized_title) = LOWER(@id)
    `, { id: cleanId });

    let manga = res.recordset?.[0];

    // TITAN SMART LOOKUP 3.0: Fallback to Title match if slug fails (e.g. searching by Title in URL)
    if (!manga) {
        const pattern = `%${cleanId.replace(/-/g, ' ')}%`;
        res = await query(`
            SELECT TOP(1) ${MANGA_CARD_FIELDS}, description
            FROM manga 
            WHERE title LIKE @pattern OR alternative_titles LIKE @pattern
        `, { pattern });
        manga = res.recordset?.[0];
    }

    if (!manga) return null;

    // Fetch chapters (Always use the internal primary ID for sub-queries)
    const internalId = manga.id;
    const chaptersRes = await query(`
        SELECT id, chapter_number, title 
        FROM chapters 
        WHERE manga_id = @internalMangaId 
        ORDER BY chapter_number ASC
    `, { internalMangaId: internalId });

    // Fetch genres via junction table
    const genresRes = await query(`
        SELECT g.name, g.slug 
        FROM genres g
        JOIN mangagenres mg ON g.id = mg.genre_id
        WHERE mg.manga_id = @internalId
    `, { internalId });
    
    return {
      ...manga,
      rawCover: manga.cover,
      cover: manga.cover ? getSignedProxyUrl(manga.cover, 0, 75) : '/placeholder-manga.svg',
      chapters: chaptersRes.recordset || [],
      genres: genresRes.recordset || []
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
    const isCandidate = isDiscoveryCandidate(id);

    return (
      <main className="main-wrapper titan-bg">
        <Header />
        <div className="container auth-required-industrial fade-up">
            <div className="center-icon-titan">
                {isCandidate ? <Sparkles size={80} color="var(--accent)" /> : <AlertOctagon size={80} color="var(--accent)" />}
            </div>
            <h1 className="auth-required-title">{isCandidate ? 'KHÁM PHÁ DỮ LIỆU' : 'KHÔNG TÌM THẤY'}</h1>
            <p className="auth-required-subtitle">
                {isCandidate 
                   ? 'Bộ truyện này chưa xuất hiện trong thư viện. Titan Engine đang cố gắng tham chiếu thực tế...' 
                   : 'Bộ truyện bạn yêu cầu không tồn tại hoặc đã bị gỡ bỏ khỏi hệ thống.'}
            </p>
            
            {isCandidate ? (
                <DiscoveryTrigger slug={id} />
            ) : (
                <Link href="/" className="btn btn-primary login-trigger-titan">QUAY LẠI TRANG CHỦ</Link>
            )}
        </div>
        <Footer />
      </main>
    );
  }

  // TITAN SEO: Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ComicSeries',
        'name': manga.title,
        'description': manga.description,
        'image': `https://truyenvip.com${getSignedProxyUrl(manga.rawCover || manga.cover, 800, 75)}`,
        'author': {
          '@type': 'Person',
          'name': manga.author || 'Đang cập nhật'
        },
        'genre': manga.genres.map(g => g.name),
        'aggregateRating': {
          '@type': 'AggregateRating',
          'ratingValue': manga.rating || '4.5',
          // N6 FIX: Use actual data instead of hardcoded fake reviewCount
          'reviewCount': Math.max(1, manga.views || 0).toString()
        }
      },
      {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'Trang chủ',
            'item': 'https://truyenvip.com/'
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': 'Manga',
            'item': 'https://truyenvip.com/genres'
          },
          {
            '@type': 'ListItem',
            'position': 3,
            'name': manga.title,
            'item': `https://truyenvip.com/manga/${id}`
          }
        ]
      }
    ]
  };

    return (
        <main className="main-wrapper titan-bg">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
            />
            <Header />
            
            <div 
                className="detail-hero-titan" 
                style={{ '--bg-cover': `url(${manga.cover})` }} 
            />

            <div className="container detail-content-wrapper fade-in">
                {/* TRADITIONAL BREADCRUMBS */}
                <nav className="breadcrumb-traditional">
                    <Link href="/" className="bread-node">Trang Chủ</Link>
                    <span className="bread-sep">/</span>
                    <Link href="/genres" className="bread-node">Manga</Link>
                    <span className="bread-sep">/</span>
                    <span className="bread-current">{manga.title}</span>
                </nav>

                <div className="manga-detail-traditional">
                    <div className="detail-top-section">
                        <div className="detail-left-cover">
                            <DetailCover src={manga.cover} alt={manga.title} />
                        </div>
                        
                        <div className="detail-right-info">
                            <h1 className="traditional-title" itemProp="name">
                                {manga.title && /^[a-z0-9-]+$/.test(manga.title) ? manga.title.replace(/-[0-9]+$/, '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : manga.title}
                            </h1>
                            
                            {/* TRADITIONAL INFO TABLE */}
                            <div className="info-table-titan">
                                <div className="info-row">
                                    <span className="info-label"><User size={14} className="info-icon" /> Tên khác</span>
                                    <span className="info-value">{manga.alternative_titles || manga.title}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label"><User size={14} className="info-icon" /> Tác giả</span>
                                    <span className="info-value text-accent">{manga.author || 'Đang cập nhật'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label"><Calendar size={14} className="info-icon" /> Ngày tạo</span>
                                    <span className="info-value">{manga.last_crawled ? new Date(manga.last_crawled).toLocaleDateString('vi-VN') : 'Mới cập nhật'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label"><BookOpen size={14} className="info-icon" /> Tổng số chap</span>
                                    <span className="info-value">{manga.chapters?.length || 0}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label"><Star size={14} className="info-icon" /> Tình trạng</span>
                                    <span className="info-value">{manga.status || 'Đang tiến hành'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label"><Star size={14} className="info-icon" /> Đánh giá</span>
                                    <span className="info-value">{manga.rating || '4.9'} / 5.0</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label"><Heart size={14} className="info-icon" /> Lượt theo dõi</span>
                                    <span className="info-value">{manga.views_at_source ? `${Math.round(manga.views_at_source / 1000)}k` : 'N/A'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label"><Eye size={14} className="info-icon" /> Lượt xem</span>
                                    <span className="info-value">{manga.views ? Number(manga.views).toLocaleString('vi-VN') : 'N/A'}</span>
                                </div>
                            </div>

                            <div className="genre-cloud-traditional">
                                {manga.genres.map((g, idx) => (
                                    <Link key={idx} href={`/genres/${g.slug}`} className="genre-pill-traditional">{g.name}</Link>
                                ))}
                            </div>

                            <DetailActions 
                                mangaId={id} 
                                firstChapterId={manga.chapters?.length > 0 ? manga.chapters[0]?.id : null} 
                                mangaTitle={manga.title}
                                mangaCover={manga.rawCover || manga.cover}
                            />
                        </div>
                    </div>

                    <div className="detail-description-traditional">
                        <h3 className="desc-title-traditional">Nội dung truyện</h3>
                        <p className="desc-content-traditional" itemProp="description">
                            {manga.description || 'Chưa có tóm tắt nội dung cho bộ truyện này. Chúng tôi sẽ cập nhật trong thời gian sớm nhất.'}
                        </p>
                    </div>

                    <section className="chapters-section-industrial">
                        {manga.chapters.length === 0 && <MangaHealer mangaId={id} />}
                        <ChapterList chapters={manga.chapters} mangaId={id} />
                    </section>
                </div>
            </div>
            <Footer />
        </main>
    );

}

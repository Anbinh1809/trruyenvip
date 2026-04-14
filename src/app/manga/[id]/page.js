import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ChapterList from '@/components/ChapterList';
import DetailCover from '@/components/DetailCover';
import DetailActions from '@/components/DetailActions';
import { query, MANGA_CARD_FIELDS } from '@/lib/db';
import { getSignedProxyUrl } from '@/lib/crypto';
import "@/app/manga-detail.css";
import Link from 'next/link';
import { BookOpen, User, Star, Calendar, Share2, Heart, AlertOctagon } from 'lucide-react';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const res = await query('SELECT title, description, cover FROM manga WHERE id = @id', { id });
  const manga = res.recordset?.[0];

  if (!manga) return { title: 'Manga Not Found | TruyenVip' };

  const ogImage = manga.cover 
    ? getSignedProxyUrl(manga.cover, 1200, 75) 
    : '/placeholder-manga.svg';

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
    // TITAN SMART LOOKUP 2.0: Check both id and normalized_title simultaneously
    // This handles both native UUIDs and migrated slugs in the same column.
    const res = await query(`
        SELECT ${MANGA_CARD_FIELDS}, description, author, status, last_crawled, normalized_title
        FROM manga 
        WHERE id = @id OR normalized_title = @id
        LIMIT 1
    `, { id });

    const manga = res.recordset[0];
    if (!manga) return null;

    // Fetch chapters (Always use the internal primary ID for sub-queries)
    const internalId = manga.id;
    const chaptersRes = await query(`
        SELECT id, chapter_number, title, created_at, updated_at, status 
        FROM chapters WHERE manga_id = @internalId 
        ORDER BY NULLIF(regexp_replace(chapter_number, '[^0-9.]', '', 'g'), '')::numeric DESC, created_at DESC
    `, { internalId });

    // Fetch genres via junction table
    const genresRes = await query(`
        SELECT g.name, g.slug 
        FROM genres g
        JOIN mangagenres mg ON g.id = mg.genre_id
        WHERE mg.manga_id = @id
    `, { id });
    
    return {
      ...manga,
      cover: manga.cover ? getSignedProxyUrl(manga.cover, 0, 75) : '/placeholder-manga.svg',
      chapters: chaptersRes.recordset,
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
        'image': `https://truyenvip.com${getSignedProxyUrl(manga.cover, 800, 75)}`,
        'author': {
          '@type': 'Person',
          'name': manga.author || 'Đang cập nhật'
        },
        'genre': manga.genres.map(g => g.name),
        'aggregateRating': {
          '@type': 'AggregateRating',
          'ratingValue': manga.rating || '4.9',
          'reviewCount': '12500'
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      
      <div 
        className="detail-hero-titan" 
        style={{ '--bg-cover': `url(${manga.cover})` }} 
      />

      <div className="container detail-content-wrapper fade-in">
        {/* TITAN BREADCRUMBS */}
        <nav className="breadcrumb-titan-industrial">
            <Link href="/" className="breadcrumb-node">TRANG CHỦ</Link>
            <span className="sep-titan">/</span>
            <Link href="/genres" className="breadcrumb-node">THỂ LOẠI</Link>
            <span className="sep-titan">/</span>
            <span className="current-node-titan">{manga.title}</span>
        </nav>

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
                        {manga.genres.map((g, idx) => (
                            <Link key={idx} href={`/genres/${g.slug}`} className="genre-tag-titan">{g.name}</Link>
                        ))}
                    </div>
                    <h1 className="detail-title-industrial" itemProp="name">{manga.title}</h1>
                    
                    <div className="pill-group-industrial">
                        <span className="author-pill-titan">
                            <User size={16} /> {manga.author || 'Đang cập nhật'}
                        </span>
                        <span className="status-pill-titan">
                            <Calendar size={16} /> 2024 • {manga.status || 'Đang tiến hành'}
                        </span>
                    </div>
                </div>

                <p className="detail-desc-industrial" itemProp="description">
                    {manga.description || 'Chưa có tóm tắt nội dung cho bộ truyện này. Chúng tôi sẽ cập nhật trong thời gian sớm nhất.'}
                </p>

                <DetailActions 
                    mangaId={id} 
                    firstChapterId={manga.chapters[manga.chapters.length - 1]?.id} 
                    mangaTitle={manga.title}
                    mangaCover={manga.cover}
                />

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
    </main>
  );
}

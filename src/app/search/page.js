import Header from '@/components/layout/Header';
import MangaCard from '@/components/shared/MangaCard';
import { query, MANGA_CARD_FIELDS } from '@/core/database/connection';
import { generateProxySignature } from '@/core/security/crypto';
import Footer from '@/components/layout/Footer';
import IndustrialEmptyState from '@/components/widgets/IndustrialEmptyState';
import { Search } from 'lucide-react';

async function searchManga(q, page = 1) {
  if (!q) return { manga: [], total: 0 };
  
  const pageSize = 24;
  const offset = (page - 1) * pageSize;
  
  let sanitizedQ = q.toString().trim().substring(0, 100);
  if (sanitizedQ.length < 2) return { manga: [], total: 0 };
  
  // Use slug-style normalization to match the normalized_title column
  const searchSlug = sanitizedQ.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, '-')
    .trim();

  try {
    const countRes = await query(`
      SELECT COUNT(*) as total 
      FROM manga 
      WHERE normalized_title LIKE @slug OR title ILIKE @q OR author ILIKE @q
    `, { slug: `%${searchSlug}%`, q: `%${sanitizedQ}%` });
    
    const total = countRes.recordset[0]?.total || 0;

    const result = await query(`
      SELECT ${MANGA_CARD_FIELDS}
      FROM manga 
      WHERE normalized_title LIKE @slug OR title ILIKE @q OR author ILIKE @q 
      ORDER BY 
        CASE WHEN normalized_title LIKE @slug THEN 0 ELSE 1 END,
        last_crawled DESC
      LIMIT @pageSize OFFSET @offset
    `, { slug: `%${searchSlug}%`, q: `%${sanitizedQ}%`, offset, pageSize });

    const manga = result.recordset.map(m => {
        const coverUrl = m.cover || '/placeholder-manga.svg';
        let finalCover = coverUrl;
        if (coverUrl.startsWith('http')) {
            const w = 400;
            const q = 75;
            const sig = generateProxySignature(coverUrl, w, q);
            finalCover = `/api/proxy?url=${encodeURIComponent(coverUrl)}&w=${w}&q=${q}&sig=${sig}`;
        }
        return { ...m, cover: finalCover };
    });

    return { manga, total };
  } catch (err) {
    console.error('Search DB Error:', err.message);
    return { manga: [], total: 0 };
  }
}

export default async function SearchPage({ searchParams }) {
  const params = await searchParams;
  const q = params.q || '';
  const page = parseInt(params.page) || 1;
  const { manga, total } = await searchManga(q, page);
  const totalPages = Math.ceil(total / 24);

  return (
    <main className="main-wrapper titan-bg">
      <Header />
      
      <div className="content container search-results-container fade-in">
        <section className="section-industrial">
          <div className="search-header-row">
              <div className="search-icon-box">
                <Search size={40} />
              </div>
              <div className="search-meta-industrial">
                <h1 className="search-title-industrial">
                  Káº¾T QUáº¢: &quot;{q}&quot;
                </h1>
                <p className="search-stats-industrial">
                  Hệ thống tà¬m tháº¥y {total} bo™ truy?n phà¹ ho£p v?i t? khà³a c?a báº¡n.
                </p>
              </div>
          </div>

          {manga.length > 0 ? (
            <>
                <div className="manga-grid-titan">
                    {manga.map(item => (
                        <MangaCard key={item.id} manga={item} />
                    ))}
                </div>

                {totalPages > 1 && (
                    <div className="pagination-container-industrial">
                        {page > 1 && (
                            <a 
                                href={`/search?q=${encodeURIComponent(q)}&page=${page - 1}`}
                                className="pagination-node-industrial"
                            >
                                â† TRÆ¯?C
                            </a>
                        )}
                        
                        <div className="pagination-node-industrial active">
                            TRANG {page} / {totalPages}
                        </div>

                        {page < totalPages && (
                            <a 
                                href={`/search?q=${encodeURIComponent(q)}&page=${page + 1}`}
                                className="pagination-node-industrial"
                            >
                                SAU â†’
                            </a>
                        )}
                    </div>
                )}
            </>
          ) : (
            <div className="search-empty-state-industrial">
                <IndustrialEmptyState 
                    keyword={q} 
                    title="KHÔNG TÌM TH?Y TRUY?N" 
                />
            </div>
          )}
        </section>
      </div>

      <Footer />
    </main>
  );
}



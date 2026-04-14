import Header from '@/components/Header';
import MangaCard from '@/components/MangaCard';
import { query, MANGA_CARD_FIELDS } from '@/lib/db';
import Footer from '@/components/Footer';
import GuardianBeastEmptyState from '@/components/GuardianBeastEmptyState';
import "@/app/search.css";
import { Search } from 'lucide-react';

async function searchManga(q, page = 1) {
  if (!q) return { manga: [], total: 0 };
  
  const pageSize = 24;
  const offset = (page - 1) * pageSize;
  
  let sanitizedQ = q.toString().trim().substring(0, 100);
  if (sanitizedQ.length < 2) return { manga: [], total: 0 };

  try {
    const countRes = await query(`
      SELECT COUNT(*) as total 
      FROM manga 
      WHERE title ILIKE @q OR author ILIKE @q
    `, { q: `%${sanitizedQ}%` });
    
    const total = countRes.recordset[0]?.total || 0;

    const result = await query(`
      SELECT ${MANGA_CARD_FIELDS}
      FROM manga 
      WHERE title ILIKE @q OR author ILIKE @q 
      ORDER BY last_crawled DESC
      LIMIT @pageSize OFFSET @offset
    `, { q: `%${sanitizedQ}%`, offset, pageSize });

    const manga = result.recordset.map(m => ({
      ...m,
      cover: m.cover && m.cover.startsWith('http') ? `/api/proxy?url=${encodeURIComponent(m.cover)}` : (m.cover || '/placeholder-manga.svg'),
    }));

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
                  KẾT QUẢ: &quot;{q}&quot;
                </h1>
                <p className="search-stats-industrial">
                  Hệ thống tìm thấy {total} bộ truyện phù hợp với từ khóa của bạn.
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
                                ← TRƯỚC
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
                                SAU →
                            </a>
                        )}
                    </div>
                )}
            </>
          ) : (
            <div className="search-empty-state-industrial">
                <GuardianBeastEmptyState keyword={q} />
            </div>
          )}
        </section>
      </div>

      <Footer />
    </main>
  );
}

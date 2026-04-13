import Link from 'next/link';
import Header from '@/components/Header';
import MangaCard from '@/components/MangaCard';
import { query, MANGA_CARD_FIELDS } from '@/lib/db';
import Footer from '@/components/Footer';
import GuardianBeastEmptyState from '@/components/GuardianBeastEmptyState';
import { Search } from 'lucide-react';

async function searchManga(q, page = 1) {
  if (!q) return { manga: [], total: 0 };
  
  const pageSize = 24;
  const offset = (page - 1) * pageSize;
  
  // Basic Sanitization: Trim and limit length
  let sanitizedQ = q.toString().trim().substring(0, 100);
  if (sanitizedQ.length < 2) return { manga: [], total: 0 };

  try {
    // 1. Get total count for pagination UI
    const countRes = await query(`
      SELECT COUNT(*) as total 
      FROM Manga 
      WHERE title ILIKE '%' || @q || '%' OR author ILIKE '%' || @q || '%'
    `, { q: sanitizedQ });
    
    const total = countRes.recordset[0]?.total || 0;

    // 2. Paginated results fetch
    const result = await query(`
      SELECT ${MANGA_CARD_FIELDS}
      FROM Manga 
      WHERE title ILIKE '%' || @q || '%' OR author ILIKE '%' || @q || '%' 
      ORDER BY last_crawled DESC
      LIMIT @pageSize OFFSET @offset
    `, { q: sanitizedQ, offset, pageSize });




    const manga = result.recordset.map(m => ({
      ...m,
      cover: m.cover.startsWith('http') ? `/api/proxy?url=${encodeURIComponent(m.cover)}` : m.cover,
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
    <main className="main-wrapper">
      <Header />
      
      <div className="content container fade-in" style={{ marginTop: '120px', marginBottom: '80px' }}>
        <section className="section">
          <div className="section-header" style={{ marginBottom: '40px' }}>
            <div>
              <h1 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '2.5rem' }}>
                <Search size={32} color="var(--accent)" /> Kết quả: &quot;{q}&quot;
              </h1>
              <p style={{ color: 'var(--text-muted)', fontWeight: 600, marginTop: '10px' }}>
                Tìm thấy {total} bộ truyện phù hợp
              </p>
            </div>
          </div>

          {manga.length > 0 ? (
            <>
                {/* ... (manga grid) */}
                <div className="manga-grid-titan">
                    {manga.map(item => (
                        <MangaCard key={item.id} manga={item} />
                    ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="pagination-titan">
                        {page > 1 && (
                            <Link 
                                href={`/search?q=${encodeURIComponent(q)}&page=${page - 1}`}
                                className="pagination-node-titan"
                            >
                                ← Trước
                            </Link>
                        )}
                        
                        <div className="pagination-node-titan active">
                            Trang {page} / {totalPages}
                        </div>

                        {page < totalPages && (
                            <Link 
                                href={`/search?q=${encodeURIComponent(q)}&page=${page + 1}`}
                                className="pagination-node-titan"
                            >
                                Sau →
                            </Link>
                        )}
                    </div>
                )}
            </>
          ) : (
            <GuardianBeastEmptyState keyword={q} />
          )}
        </section>
      </div>

      <Footer />
    </main>
  );
}

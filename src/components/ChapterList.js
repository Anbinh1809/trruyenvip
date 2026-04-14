'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, ArrowUpDown } from 'lucide-react';

export default function ChapterList({ mangaId, chapters }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [displayCount, setDisplayCount] = useState(50);
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' = newest first

  const sortedChapters = useMemo(() => {
    return [...(chapters || [])].sort((a, b) => {
        const numA = parseFloat(a.chapter_number) || 0;
        const numB = parseFloat(b.chapter_number) || 0;
        return sortOrder === 'desc' ? numB - numA : numA - numB;
    });
  }, [chapters, sortOrder]);

  const filteredChapters = useMemo(() => {
    if (!searchTerm) return sortedChapters;
    return sortedChapters.filter(c => 
      c.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.chapter_number?.toString().includes(searchTerm)
    );
  }, [sortedChapters, searchTerm]);

  const displayedChapters = useMemo(() => {
    return filteredChapters.slice(0, displayCount);
  }, [filteredChapters, displayCount]);

  const hasMore = displayCount < filteredChapters.length;

  return (
    <section className="chapter-list-section fade-in">
      <div className="chapter-list-header-industrial">
        <h2 className="chapter-list-title-titan">
          Danh sách chương <span className="text-secondary-titan">({chapters?.length || 0})</span>
        </h2>
        
        <div className="chapter-list-actions-industrial">
            <button 
                onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                className="btn-sort-titan-industrial"
            >
                <ArrowUpDown size={14} /> {sortOrder === 'desc' ? 'Mới nhất' : 'Cũ nhất'}
            </button>

            <div className="chapter-search-box-industrial">
              <input 
                type="text" 
                placeholder="Tìm nhanh chương..." 
                value={searchTerm}
                autoComplete="off"
                className="chapter-search-input-industrial"
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setDisplayCount(50);
                }}
              />
              <div className="search-icon-industrial">
                <Search size={16} />
              </div>
            </div>
        </div>
      </div>

      {filteredChapters.length === 0 ? (
        <div className="empty-state-titan industrial-p-80">
            Không tìm thấy chương nào phù hợp với từ khóa của bạn.
        </div>
      ) : (
        <>
            <div className="chapter-grid-titan">
                {displayedChapters.map(chapter => (
                    <Link 
                        key={chapter.id} 
                        href={`/manga/${mangaId}/chapter/${chapter.id}`} 
                        className="chapter-item-titan-industrial"
                    >
                        <div className="chapter-main-info">
                            <span className="chapter-num-pill">Chương {chapter.chapter_number}</span>
                            {chapter.title && chapter.title !== `Chương ${chapter.chapter_number}` && (
                                <span className="chapter-title-industrial truncate-1">{chapter.title}</span>
                            )}
                        </div>
                        <span className="chapter-date-industrial">
                            {new Date(chapter.updated_at).toLocaleDateString('vi-VN')}
                        </span>
                    </Link>
                ))}
            </div>
            
            {hasMore && (
                <div className="load-more-industrial">
                    <button 
                        onClick={() => setDisplayCount(prev => prev + 100)}
                        className="btn btn-outline load-more-btn-titan"
                    >
                        XEM THÊM CHƯƠNG
                    </button>
                </div>
            )}
        </>
      )}

      <style jsx>{`
        .chapter-list-header-industrial {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 40px;
            gap: 30px;
            flex-wrap: wrap;
        }
        .chapter-list-title-titan {
            font-size: 1.8rem;
            font-weight: 950;
            color: white;
            letter-spacing: -1px;
            margin: 0;
        }
        .text-secondary-titan {
            opacity: 0.3;
        }
        .chapter-list-actions-industrial {
            display: flex;
            align-items: center;
            gap: 15px;
            flex: 1;
            justify-content: flex-end;
            min-width: 320px;
        }
        .btn-sort-titan-industrial {
            display: flex;
            align-items: center;
            gap: 10px;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid var(--glass-border);
            padding: 12px 20px;
            border-radius: 12px;
            color: white;
            font-size: 0.85rem;
            font-weight: 850;
            cursor: pointer;
            transition: all 0.3s;
            white-space: nowrap;
        }
        .btn-sort-titan-industrial:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(255, 255, 255, 0.15);
        }
        .chapter-search-box-industrial {
            position: relative;
            flex: 1;
            max-width: 400px;
        }
        .chapter-search-input-industrial {
            width: 100%;
            background: rgba(2, 6, 23, 0.4);
            border: 1px solid var(--glass-border);
            padding: 12px 20px 12px 50px;
            border-radius: 12px;
            color: white;
            font-size: 0.9rem;
            font-weight: 600;
            outline: none;
            transition: all 0.3s;
        }
        .chapter-search-input-industrial:focus {
            border-color: var(--accent);
            background: rgba(2, 6, 23, 0.6);
        }
        .search-icon-industrial {
            position: absolute;
            left: 18px;
            top: 50%;
            transform: translateY(-50%);
            opacity: 0.3;
            color: white;
            display: flex;
        }
        .chapter-grid-titan {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 15px;
        }
        .chapter-item-titan-industrial {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 18px 24px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid var(--glass-border);
            border-radius: 14px;
            text-decoration: none;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .chapter-item-titan-industrial:hover {
            background: rgba(255, 255, 255, 0.06);
            border-color: var(--accent);
            transform: translateX(5px);
        }
        .chapter-main-info {
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 0;
        }
        .chapter-num-pill {
            font-weight: 950;
            color: white;
            font-size: 0.9rem;
            white-space: nowrap;
        }
        .chapter-title-industrial {
            font-size: 0.85rem;
            color: rgba(255, 255, 255, 0.4);
            font-weight: 700;
        }
        .chapter-date-industrial {
            font-size: 0.75rem;
            color: rgba(255, 255, 255, 0.2);
            font-weight: 800;
            white-space: nowrap;
        }
        .load-more-industrial {
            display: flex;
            justify-content: center;
            margin-top: 50px;
        }
        .load-more-btn-titan {
            padding: 15px 50px;
            font-weight: 950;
            font-size: 0.9rem;
            letter-spacing: 1px;
            border-radius: 30px;
        }
        @media (max-width: 768px) {
            .chapter-list-header-industrial {
                flex-direction: column;
                align-items: stretch;
            }
            .chapter-list-actions-industrial {
                flex-direction: column;
                min-width: 100%;
            }
            .btn-sort-titan-industrial, .chapter-search-box-industrial {
                width: 100%;
                max-width: 100%;
            }
        }
      `}</style>
    </section>
  );
}

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, ArrowUpDown, Ghost, Loader2, Navigation } from 'lucide-react';
import { useHistory } from '@/contexts/HistoryContext';

export default function ChapterList({ mangaId, chapters }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [displayCount, setDisplayCount] = useState(50);
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' = newest first
  const { history, mounted } = useHistory();

  // TITAN CHRONICLE: Determine reading state
  const mangaHistory = useMemo(() => {
    if (!mounted) return null;
    return history.find(h => h.mangaId === mangaId);
  }, [history, mangaId, mounted]);

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
          DANH SÁCH CHƯƠNG <span className="text-secondary-titan">({chapters?.length || 0})</span>
        </h2>
        
        <div className="chapter-list-actions-industrial">
            <button 
                onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                className="btn-sort-titan-industrial"
                aria-label={sortOrder === 'desc' ? 'Sắp xếp cũ nhất' : 'Sắp xếp mới nhất'}
            >
                <ArrowUpDown size={14} /> {sortOrder === 'desc' ? 'MỚI NHẤT' : 'CŨ NHẤT'}
            </button>

            <div className="chapter-search-box-industrial">
              <input 
                type="text" 
                placeholder="Tìm nhanh chương..." 
                value={searchTerm}
                autoComplete="off"
                className="chapter-search-input-industrial"
                aria-label="Tìm nhanh chương"
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
            <div className="chapter-list-linear-industrial">
                {displayedChapters.map(chapter => {
                    const isLastRead = mangaHistory?.chapterId === chapter.id;
                    const isGhost = chapter.status === 'ghost';
                    
                    return (
                        <Link 
                            key={chapter.id} 
                            href={isGhost ? '#' : `/manga/${mangaId}/chapter/${chapter.id}`} 
                            className={`chapter-row-titan ${isLastRead ? 'last-read-node shadow-titan' : ''} status-${chapter.status || 'pending'}`}
                            onClick={(e) => isGhost && e.preventDefault()}
                        >
                            <div className="chapter-row-left">
                                <div className="chapter-primary-info">
                                    <span className="chapter-num-pill-v2">Chương {chapter.chapter_number}</span>
                                    {chapter.title && chapter.title !== `Chương ${chapter.chapter_number}` && (
                                        <span className="chapter-title-v2 truncate-1">{chapter.title}</span>
                                    )}
                                </div>
                                
                                <div className="chapter-badges-v2">
                                    {isLastRead && (
                                        <span className="badge-history-titan">
                                            <Navigation size={10} fill="currentColor" /> LẦN ĐỌC CUỐI
                                        </span>
                                    )}
                                    {isGhost && (
                                        <span className="badge-ghost-v2">
                                            <Ghost size={12} /> LỖI NGUỒN
                                        </span>
                                    )}
                                    {chapter.status === 'pending' && (
                                        <span className="badge-pending-v2">
                                            <Loader2 size={12} className="animate-spin" /> ĐANG TẢI
                                        </span>
                                    )}
                                    {((new Date() - new Date(chapter.updated_at)) < (48 * 60 * 60 * 1000)) && (
                                        <span className="badge-new-v2">MỚI</span>
                                    )}
                                </div>
                            </div>

                            <div className="chapter-row-right">
                                <span className="chapter-date-v2">
                                    {new Date(chapter.updated_at || chapter.created_at).toLocaleDateString('vi-VN')}
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </div>
            
            {hasMore && (
                <div className="load-more-industrial">
                    <button 
                        onClick={() => setDisplayCount(prev => prev + 100)}
                        className="btn btn-outline load-more-btn-titan shadow-titan"
                    >
                        XEM THÊM CHƯƠNG
                    </button>
                </div>
            )}
        </>
      )}

      <style jsx>{`
        .chapter-list-linear-industrial {
            display: flex;
            flex-direction: column;
            gap: 2px;
            background: var(--nebula-glass);
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid var(--glass-border);
        }

        .chapter-row-titan {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 14px 24px;
            background: var(--nebula-glass);
            text-decoration: none;
            transition: all 0.2s;
            border-bottom: 1px solid var(--glass-border);
            position: relative;
        }

        .chapter-row-titan:last-child {
            border-bottom: none;
        }

        .chapter-row-titan:hover {
            background: var(--glass-bg);
            padding-left: 30px;
        }

        .chapter-row-titan.last-read-node {
            background: rgba(var(--accent-rgb, 255, 0, 0), 0.08);
            border-left: 4px solid var(--accent);
            z-index: 2;
        }

        .chapter-row-left {
            display: flex;
            align-items: center;
            gap: 20px;
            min-width: 0;
        }

        .chapter-primary-info {
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 140px;
        }

        .chapter-num-pill-v2 {
            font-weight: 950;
            color: var(--text-primary);
            font-size: 0.95rem;
            white-space: nowrap;
        }

        .chapter-title-v2 {
            font-size: 0.85rem;
            color: var(--text-muted);
            font-weight: 700;
        }

        .chapter-badges-v2 {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .badge-history-titan {
            background: var(--accent);
            color: #fff;
            padding: 2px 10px;
            border-radius: 4px;
            font-size: 0.6rem;
            font-weight: 950;
            letter-spacing: 0.5px;
            display: flex;
            align-items: center;
            gap: 5px;
            box-shadow: 0 4px 12px rgba(var(--accent-rgb), 0.3);
        }

        .badge-new-v2 {
            background: #10b981;
            color: #fff;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 0.6rem;
            font-weight: 950;
        }

        .badge-ghost-v2 {
            color: #ef4444;
            font-size: 0.65rem;
            font-weight: 900;
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .badge-pending-v2 {
            color: #3b82f6;
            font-size: 0.65rem;
            font-weight: 900;
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .chapter-date-v2 {
            font-size: 0.8rem;
            color: var(--text-muted);
            font-weight: 800;
        }

        .chapter-list-header-industrial {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            gap: 20px;
        }

        .chapter-list-title-titan {
            font-size: 1.5rem;
            font-weight: 950;
            color: var(--text-primary);
            letter-spacing: 2px;
            margin: 0;
        }

        .text-secondary-titan {
            opacity: 0.2;
        }

        .chapter-list-actions-industrial {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .btn-sort-titan-industrial {
            display: flex;
            align-items: center;
            gap: 10px;
            background: var(--nebula-glass);
            border: 1px solid var(--glass-border);
            padding: 10px 18px;
            border-radius: 10px;
            color: var(--text-primary);
            font-size: 0.75rem;
            font-weight: 900;
            cursor: pointer;
            transition: all 0.3s;
            letter-spacing: 1px;
        }

        .btn-sort-titan-industrial:hover {
            background: var(--glass-bg);
            border-color: var(--accent);
        }

        .chapter-search-box-industrial {
            position: relative;
            width: 250px;
        }

        .chapter-search-input-industrial {
            width: 100%;
            background: var(--glass-bg);
            border: 1px solid var(--glass-border);
            padding: 10px 15px 10px 45px;
            border-radius: 10px;
            color: var(--text-primary);
            font-size: 0.85rem;
            font-weight: 600;
            outline: none;
            transition: all 0.3s;
        }

        .chapter-search-input-industrial:focus {
            border-color: var(--accent);
        }

        .search-icon-industrial {
            position: absolute;
            left: 15px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-muted);
            display: flex;
        }

        .load-more-industrial {
            display: flex;
            justify-content: center;
            margin-top: 40px;
        }

        .load-more-btn-titan {
            padding: 14px 40px;
            font-weight: 950;
            font-size: 0.85rem;
            letter-spacing: 2px;
            border-radius: 12px;
            border: 1px solid var(--glass-border);
            background: var(--nebula-glass);
            color: var(--text-primary);
            cursor: pointer;
            transition: all 0.3s;
        }

        .load-more-btn-titan:hover {
            background: var(--accent);
            border-color: var(--accent);
            transform: translateY(-2px);
        }

        @media (max-width: 768px) {
            .chapter-row-titan {
                padding: 12px 16px;
                flex-direction: column;
                align-items: flex-start;
                gap: 8px;
            }
            .chapter-row-right {
                width: 100%;
                text-align: right;
            }
            .chapter-list-header-industrial {
                flex-direction: column;
                align-items: flex-start;
            }
            .chapter-list-actions-industrial {
                width: 100%;
            }
            .chapter-search-box-industrial {
                width: 100%;
            }
            .chapter-primary-info {
                min-width: 0;
            }
        }
      `}</style>
    </section>
  );
}

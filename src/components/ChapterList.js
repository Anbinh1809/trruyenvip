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
      <div className="chapter-list-header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '15px',
        marginBottom: '25px'
      }}>
        <h2 className="chapter-list-title" style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900 }}>
          Danh sách chương ({chapters?.length || 0})
        </h2>
        
        <div className="chapter-list-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
                onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                className="btn-sort-titan"
                style={{
                    padding: '10px 18px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}
            >
                <ArrowUpDown size={14} /> {sortOrder === 'desc' ? 'Mới nhất' : 'Cũ nhất'}
            </button>

            <div className="chapter-search-container" style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
              <input 
                type="text" 
                placeholder="Tìm nhanh chương (VD: 100)..." 
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setDisplayCount(50);
                }}
                style={{
                    width: '100%',
                    padding: '12px 20px',
                    paddingLeft: '40px',
                    borderRadius: '15px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'all 0.3s ease'
                }}
              />
              <Search size={16} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
            </div>
        </div>
      </div>

      {filteredChapters.length === 0 ? (
        <div className="empty-state-titan" style={{ padding: '40px' }}>
            Không tìm thấy chương nào phù hợp.
        </div>
      ) : (
        <div className="chapter-grid-titan">
            {filteredChapters.map(chapter => (
                <Link 
                    key={chapter.id} 
                    href={`/manga/${mangaId}/chapter/${chapter.id}`} 
                    className="chapter-item-titan"
                >
                    <span style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Chương {chapter.chapter_number}
                        {chapter.title && chapter.title !== `Chương ${chapter.chapter_number}` && (
                            <span style={{ fontWeight: 500, opacity: 0.6, fontSize: '0.9rem', marginLeft: '10px' }}>
                                : {chapter.title}
                            </span>
                        )}
                    </span>
                    <span style={{ opacity: 0.5, fontSize: '0.8rem', marginLeft: '10px', flexShrink: 0, fontStyle: 'italic' }}>
                        {new Date(chapter.updated_at).toLocaleDateString('vi-VN')}
                    </span>
                </Link>
            ))}
        </div>
      )}
    </section>
  );
}

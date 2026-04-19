'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';
import Image from 'next/image';
import { Search, X, Zap, Loader2 } from 'lucide-react';
import { useToast } from '@/components/widgets/ToastProvider';

export default function LiveSearch({ onSelect }) {
  const { addToast } = useToast();
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [isUrl, setIsUrl] = useState(false);
  const router = useRouter();
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const supportedMirrors = ['nettruyen', 'truyenqq', 'nhattruyen', 'cmanga', 'blogtruyen', 'truyenvua', 'manga-tx'];
    const urlPattern = new RegExp(`^(https?://)?([\\w.-]+)\\.(${supportedMirrors.join('|')})`, 'i');
    const match = q.match(urlPattern);
    setIsUrl(!!match);

    const timer = setTimeout(async () => {
      if (q.length >= 2 && !match) {
        setLoading(true);
        setIsOpen(true);
        try {
          const res = await fetch(`/api/search/live?q=${encodeURIComponent(q)}`);
          if (res.ok) {
            const data = await res.json();
            setResults(data);
            setHighlightIndex(-1);
            setIsOpen(data.length > 0 || q.length >= 2);
          }
        } catch (e) {
          console.error('[Search] Live fetch failed:', e);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
        if (!isUrl) setIsOpen(false);
        setHighlightIndex(-1);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [q, isUrl]);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    if (!q.trim()) return;
    if (isUrl) {
        handleMigration();
        return;
    }
    setIsOpen(false);
    if (onSelect) onSelect();
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleMigration = async () => {
      setLoading(true);
      setIsOpen(true);
      try {
          const res = await fetch('/api/migration', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: q })
          });
          const data = await res.json();
          if (data.success) {
              if (addToast) addToast('Đồng bộ dữ liệu thành công!', 'success');
              if (onSelect) onSelect();
              router.push(data.redirectUrl);
          } else {
              if (addToast) addToast(data.error || 'Tính năng này hiện đang bảo trì.', 'error');
          }
      } catch (e) {
          if (addToast) addToast('Lỗi kết nối máy chủ.', 'error');
      } finally {
          setLoading(false);
      }
  };

  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIndex(prev => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIndex(prev => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
        e.preventDefault();
        const selected = results[highlightIndex];
        setIsOpen(false);
        if (onSelect) onSelect();
        router.push(`/manga/${selected.normalized_title || selected.id}`);
    } else if (e.key === 'Escape') {
        setIsOpen(false);
    }
  };

  return (
    <div className="titan-search-container" ref={searchRef}>
        <form className="titan-search-form" onSubmit={handleSearch}>
            <input 
                type="text" 
                placeholder="Tìm truyện hoặc dán link NetTruyen..." 
                value={q}
                autoComplete="off"
                className="titan-search-input"
                onChange={(e) => setQ(e.target.value)}
                onFocus={() => q.length >= 2 && setIsOpen(true)}
                onKeyDown={handleKeyDown}
            />
            <div className="titan-search-actions">
                {q && !loading && (
                    <button 
                        type="button" 
                        onClick={() => { setQ(''); setResults([]); setIsOpen(false); }}
                        className="titan-search-clear"
                    >
                        <X size={16} />
                    </button>
                )}
                <button type="submit" className="titan-search-submit">
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                </button>
            </div>
        </form>

        {isOpen && (
            <div className="titan-results-panel fade-slide-up glass-titan">
                {isUrl && (
                    <div className="titan-migration-bar-industrial">
                        <button onClick={handleMigration} className="btn btn-primary migration-btn-titan">
                            <Zap size={14} fill="currentColor" /> {loading ? 'ĐANG ĐỒNG BỘ...' : 'LẤY DỮ LIỆU NGUỒN NGOÀI'}
                        </button>
                    </div>
                )}
                
                <div className="results-scroll-titan-industrial glass-scrollbar">
                    {results.length > 0 ? (
                        results.map((m, idx) => (
                            <NextLink 
                                key={m.id} 
                                href={`/manga/${m.normalized_title || m.id}`} 
                                className={`live-result-item-industrial ${highlightIndex === idx ? 'highlighted-industrial' : ''}`}
                                onClick={() => { setIsOpen(false); if (onSelect) onSelect(); }}
                            >
                                <div className="result-thumb-titan-industrial">
                                    <Image src={m.cover} alt={m.title} fill sizes="50px" className="titan-thumb-img-tag" unoptimized />
                                </div>
                                <div className="result-info-titan-industrial">
                                    <div className="result-title-titan-industrial truncate-1">{m.title}</div>
                                    <div className="result-sub-titan-industrial truncate-1">{m.author || 'Đang cập nhật'}</div>
                                </div>
                                {idx < 3 && <div className="hot-tag-titan">HOT</div>}
                            </NextLink>
                        ))
                    ) : !loading && q.length >= 2 && (
                        <div className="search-empty-titan-industrial">
                            <div className="empty-title-industrial">KHÔNG TÌM THẤY</div>
                            <p className="empty-sub-industrial">Thử từ khóa khác hoặc dán link truyện.</p>
                        </div>
                    )}
                </div>
            </div>
        )}
        <style jsx>{`
            .titan-results-panel {
                position: absolute;
                top: calc(100% + 15px);
                left: 0;
                right: 0;
                background: var(--glass-bg);
                backdrop-filter: var(--glass-blur);
                border: 1px solid var(--glass-border);
                border-radius: 20px;
                padding: 15px;
                z-index: 1000;
                box-shadow: 0 30px 60px rgba(0,0,0,0.4);
            }
            .titan-migration-bar-industrial {
                margin-bottom: 12px;
            }
            .migration-btn-titan {
                width: 100%;
                padding: 14px;
                font-weight: 950;
                font-size: 0.8rem;
                letter-spacing: 0.5px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
            }
            .results-scroll-titan-industrial {
                max-height: 450px;
                overflow-y: auto;
                padding: 5px;
            }
            .live-result-item-industrial {
                display: flex;
                align-items: center;
                gap: 15px;
                padding: 10px;
                border-radius: 12px;
                text-decoration: none;
                transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                border: 1px solid transparent;
            }
            .live-result-item-industrial:hover, .highlighted-industrial {
                background: var(--nebula-glass);
                border-color: var(--glass-border);
                transform: translateX(3px);
            }
            .result-thumb-titan-industrial {
                width: 45px;
                height: 60px;
                border-radius: 8px;
                overflow: hidden;
                flex-shrink: 0;
                position: relative;
                border: 1px solid var(--glass-border);
            }
            .titan-thumb-img-tag {
                object-fit: cover;
            }
            .result-info-titan-industrial {
                flex: 1;
                min-width: 0;
            }
            .result-title-titan-industrial {
                font-size: 0.95rem;
                font-weight: 900;
                color: var(--text-primary);
                margin-bottom: 2px;
                letter-spacing: -0.3px;
                line-height: 1.2;
            }
            .result-sub-titan-industrial {
                font-size: 0.75rem;
                font-weight: 750;
                color: var(--text-muted);
            }
            .hot-tag-titan {
                font-size: 0.6rem;
                background: var(--accent);
                color: white;
                padding: 2px 6px;
                border-radius: 4px;
                font-weight: 900;
            }
            .search-empty-titan-industrial {
                padding: 60px 20px;
                text-align: center;
            }
            .empty-title-industrial {
                font-size: 1rem;
                font-weight: 950;
                color: var(--text-muted);
                letter-spacing: 1px;
                margin-bottom: 8px;
            }
            .empty-sub-industrial {
                font-size: 0.8rem;
                font-weight: 750;
                color: var(--text-secondary);
            }
        `}</style>
    </div>
  );
}

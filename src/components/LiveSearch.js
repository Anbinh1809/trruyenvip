'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Search, X, Zap } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';
import EmptyState from '@/components/EmptyState';

export default function LiveSearch() {
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
        try {
          const res = await fetch(`/api/search/live?q=${encodeURIComponent(q)}`);
          if (res.ok) {
            const data = await res.json();
            const optimized = data.map(m => ({
                ...m,
                cover: m.cover?.startsWith('http') ? `/api/proxy?url=${encodeURIComponent(m.cover)}&w=100` : (m.cover || '/placeholder-manga.svg')
            }));
            setResults(optimized);
            setIsOpen(optimized.length > 0);
            setHighlightIndex(-1);
          }
        } catch (e) {
          console.error('[Search] Live fetch failed:', e);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
        setIsOpen(false);
        setHighlightIndex(-1);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [q]);


  const handleSearch = (e) => {
    if (e) e.preventDefault();
    if (!q.trim()) return;
    if (isUrl) {
        handleMigration();
        return;
    }
    setIsOpen(false);
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
              router.push(data.redirectUrl);
          } else {
              if (addToast) addToast(data.error || 'Tính năng này hiện đang bảo trì. Vui lòng thử lại sau.', 'error');
          }
      } catch (e) {
          if (addToast) addToast('Lỗi kết nối máy chủ. Vui lòng thử lại!', 'error');
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
        router.push(`/manga/${selected.id}`);
    } else if (e.key === 'Escape') {
        setIsOpen(false);
    }
  };

  return (
    <div className="titan-search-container" ref={searchRef}>
        <form className="titan-search-form" onSubmit={handleSearch}>
            <input 
                type="text" 
                name="search" 
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
                    {loading ? <span className="loader-mini"></span> : <Search size={18} />}
                </button>
            </div>
        </form>

        {isOpen && (
            <div className="titan-results-panel fade-slide-up glass-titan">
                {isUrl && (
                    <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)' }}>
                        <button onClick={handleMigration} className="btn-primary" style={{ width: '100%', background: 'var(--accent)', color: 'white', border: 'none', padding: '14px', borderRadius: '6px', fontWeight: 950, fontSize: '0.75rem', cursor: 'pointer', letterSpacing: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <Zap size={16} /> {loading ? 'ĐANG XỬ LÝ...' : 'DỒN DỮ LIỆU TỪ NGUỒN NGOÀI'}
                        </button>
                    </div>
                )}
                
                <div style={{ maxHeight: '420px', overflowY: 'auto' }} className="glass-scrollbar">
                    {results.length > 0 ? results.map((m, idx) => (
                        <Link 
                            key={m.id} 
                            href={`/manga/${m.id}`} 
                            className={`live-result-item ${highlightIndex === idx ? 'highlighted' : ''}`}
                            onClick={() => setIsOpen(false)}
                        >
                            <div className="result-thumb-titan">
                                <Image src={m.cover} alt={m.title} fill sizes="50px" style={{ objectFit: 'cover' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div className="result-title-titan truncate-1">{m.title}</div>
                                <div className="result-sub-titan truncate-1">{m.author || 'Đang cập nhật'}</div>
                            </div>
                            {idx < 3 && <div className="hot-tag-titan">HOT</div>}
                        </Link>
                    )) : !loading && q.length >= 2 && (
                        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                            <div style={{ fontWeight: 950, fontSize: '1.2rem', color: 'white', marginBottom: '10px', letterSpacing: '-1px' }}>KHÔNG TÌM THẤY</div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, maxWidth: '240px', marginInline: 'auto', lineHeight: '1.5' }}>
                                Rất tiếc, bộ truyện này chưa xuất hiện trong kho dữ liệu của chúng tôi.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
}

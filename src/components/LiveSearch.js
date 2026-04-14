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
    <div 
        className="titan-search-container titan-results-panel" 
        ref={searchRef} 
        style={{ position: 'relative', width: '100%' }}
    >
        <form 
            style={{ 
                position: 'relative', background: 'rgba(255, 255, 255, 0.05)', 
                border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 'var(--border-radius)', 
                display: 'flex', alignItems: 'center', padding: '2px 5px', transition: 'all 0.3s ease' 
            }} 
            onSubmit={handleSearch}
        >
            <input 
                type="text" 
                name="search" 
                placeholder="Tìm truyện hoặc dán link NetTruyen..." 
                value={q}
                autoComplete="off"
                onChange={(e) => setQ(e.target.value)}
                onFocus={() => q.length >= 2 && setIsOpen(true)}
                onKeyDown={handleKeyDown}
                style={{ 
                    background: 'none', border: 'none', color: 'var(--text-primary)', padding: '12px 20px', 
                    width: '100%', fontSize: '0.95rem', fontWeight: 600, outline: 'none' 
                }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '15px' }}>
                {q && !loading && (
                    <button 
                        type="button" 
                        onClick={() => { setQ(''); setResults([]); setIsOpen(false); }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3, cursor: 'pointer', background: 'none', border: 'none', color: 'white' }}
                    >
                        <X size={18} />
                    </button>
                )}
                {loading ? <span className="loader-mini"></span> : <button type="submit" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.8, background: 'none', border: 'none', color: 'white' }}><Search size={18} /></button>}
            </div>
        </form>

        {isOpen && (
            <div id="live-search-results" className="titan-results-panel fade-slide-up">
                {isUrl && (
                    <div style={{ padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <button onClick={handleMigration} className="btn-primary" style={{ width: '100%', background: 'var(--accent)', color: 'white', border: 'none', padding: '12px', borderRadius: 'var(--border-radius)', fontWeight: 900, fontSize: '0.75rem', cursor: 'pointer', letterSpacing: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <Zap size={16} /> {loading ? 'ĐANG XỬ LÝ...' : 'DỒN DỮ LIỆU TỪ NGUỒN NGOÀI'}
                        </button>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px', fontWeight: 700, textTransform: 'uppercase' }}>Hệ thống phát hiện liên kết ngoài</div>
                    </div>
                )}
                
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {results.length > 0 ? results.map((m, idx) => (
                        <Link 
                            key={m.id} 
                            href={`/manga/${m.id}`} 
                            style={{ 
                                display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 20px', 
                                textDecoration: 'none', transition: 'all 0.2s ease', 
                                borderBottom: '1px solid rgba(255,255,255,0.02)',
                                background: highlightIndex === idx ? 'rgba(255,255,255,0.05)' : 'transparent'
                            }} 
                            onClick={() => setIsOpen(false)}
                        >
                            <div style={{ width: '40px', height: '55px', position: 'relative', borderRadius: '6px', overflow: 'hidden' }}>
                                <Image 
                                    src={m.cover} 
                                    alt={m.title} 
                                    fill 
                                    sizes="50px" 
                                    style={{ objectFit: 'cover' }} 
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div className="truncate-1" style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: '2px' }}>{m.title}</div>
                                <div className="truncate-1" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{m.author || 'Đang cập nhật'}</div>
                            </div>
                            {idx < 3 && <div style={{ fontSize: '0.6rem', background: 'rgba(255, 62, 62, 0.1)', color: 'var(--accent)', padding: '2px 6px', borderRadius: '4px', fontWeight: 900 }}>HOT</div>}
                        </Link>
                    )) : !loading && q.length >= 2 && (
                        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                            <div style={{ fontWeight: 900, fontSize: '1.1rem', color: 'white', marginBottom: '8px' }}>KHÔNG TÌM THẤY</div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, maxWidth: '200px', marginInline: 'auto' }}>
                                Kết quả tìm kiếm hiện chưa có trong cơ sở dữ liệu.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
}

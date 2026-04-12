'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { useRouter } from 'next/navigation';

export default function TransferPage() {
    const [urls, setUrls] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [results, setResults] = useState([]);
    const router = useRouter();

    const handleBatchTransfer = async (e) => {
        e.preventDefault();
        const urlList = urls.split('\n').filter(u => u.trim().startsWith('http'));
        if (urlList.length === 0) return;

        setIsProcessing(true);
        setResults([]);
        
        const processResults = [];

        for (const url of urlList) {
            try {
                const res = await fetch('/api/migration', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: url.trim() })
                });
                const data = await res.json();
                
                if (data.success) {
                    processResults.push({ url, status: 'success', title: data.mangaId });
                    fetchMangaAndAddToHistory(data.mangaId, data.chapterId);
                } else {
                    processResults.push({ url, status: 'error', msg: data.error });
                }
            } catch (err) {
                processResults.push({ url, status: 'error', msg: 'Lỗi kết nối' });
            }
            setResults([...processResults]);
        }
        setIsProcessing(false);
    };

    const fetchMangaAndAddToHistory = async (mangaId, chapterId) => {
        if (!chapterId) return; // Don't guess slugs
        try {
            await fetch(`/api/chapter-images/${chapterId}`);
        } catch (e) {}
    };

    return (
        <main className="transfer-page titan-bg" style={{ minHeight: '100vh', paddingBottom: '100px', color: 'var(--text-primary)' }}>
            <Header />
            <div className="container fade-up" style={{ paddingTop: '140px', maxWidth: '900px' }}>
                <header className="section-header" style={{ marginBottom: '50px', textAlign: 'center' }}>
                    <div style={{ display: 'inline-block', padding: '6px 14px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 900, letterSpacing: '2px', marginBottom: '20px' }}>DI CẦN TIẾP NỐI</div>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: 950, letterSpacing: '-3px', marginBottom: '15px' }}>Đại Lễ Dịch Chuyển</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '650px', margin: '0 auto', fontWeight: 600, lineHeight: 1.6 }}>
                        Hệ thống giúp đạo hữu chuyển lộ trình tu hành từ các tầng thủ quán khác (NetTruyen, TruyenQQ) về TruyenVip chỉ trong chớp mắt.
                    </p>
                </header>

                <div className="glass-card" style={{ padding: '40px', borderRadius: '32px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '10px' }}>
                        <h3 style={{ fontSize: '1.3rem', fontWeight: 900, letterSpacing: '-0.5px' }}>Nhập liên kết chương truyện</h3>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', opacity: 0.5 }}>Mỗi dòng một liên kết chương truyện</span>
                    </div>

                    <form onSubmit={handleBatchTransfer}>
                        <textarea 
                            value={urls}
                            onChange={(e) => setUrls(e.target.value)}
                            placeholder="Dán link NetTruyen hoặc TruyenQQ vào đây..."
                            style={{ 
                                width: '100%', minHeight: '250px', borderRadius: '20px',
                                background: 'rgba(0,0,0,0.03)', border: '1px solid var(--glass-border)',
                                padding: '25px', color: '#10b981', fontFamily: '"Fira Code", monospace',
                                fontSize: '0.95rem', lineHeight: 1.8, outline: 'none', transition: 'all 0.3s',
                                marginBottom: '30px'
                            }}
                        />
                        <button 
                            type="submit" 
                            disabled={isProcessing || !urls.trim()}
                            className={`btn btn-primary ${isProcessing ? 'processing' : ''}`}
                            style={{ width: '100%', height: '70px', borderRadius: '18px', fontWeight: 950, fontSize: '1.1rem' }}
                        >
                            {isProcessing ? '🕒 Đang dịch chuyển...' : '🚀 Kích hoạt Cổng Dịch Chuyển'}
                        </button>
                    </form>

                    {results.length > 0 && (
                        <div className="fade-in" style={{ marginTop: '50px' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '20px', opacity: 0.6 }}>Bản ghi dịch chuyển gần nhất</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {results.map((res, i) => (
                                    <div key={i} style={{ 
                                        padding: '15px 20px', borderRadius: '12px', background: 'var(--bg-primary)', 
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        border: `1px solid ${res.status === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 62, 62, 0.1)'}`
                                    }}>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '65%' }}>{res.url}</div>
                                        <div style={{ fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', color: res.status === 'success' ? '#10b981' : 'var(--accent)' }}>
                                            {res.status === 'success' ? '✅ Thành công' : '❌ Thất bại'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

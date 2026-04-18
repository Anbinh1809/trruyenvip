'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useRouter } from 'next/navigation';
import { Zap, RefreshCw, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

export default function TransferPage() {
    const [urls, setUrls] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [results, setResults] = useState([]);
    const router = useRouter();

    const handleBatchTransfer = async (e) => {
        e.preventDefault();
        const urlList = urls.split('\n')
            .map(u => u.trim())
            .filter(u => u.length > 5)
            .map(u => u.startsWith('http') ? u : `https://${u}`);
        if (urlList.length === 0) return;

        // CLIENT-SIDE VALIDATION: Prevent junk requests
        const allowedTargets = ['nettruyen', 'nhattruyen', 'truyenqq'];
        const invalidUrls = urlList.filter(u => !allowedTargets.some(t => u.includes(t)));
        if (invalidUrls.length > 0) {
            alert(`Mo�t so� li�n k?t kh�ng đuo�c ho� tro�: ${invalidUrls[0]}...`);
            return;
        }

        setIsProcessing(true);
        setResults([]);
        
        let batchResults = [];
        
        for (let i = 0; i < urlList.length; i += 3) {
            const chunk = urlList.slice(i, i + 3);
            const chunkResults = await Promise.all(chunk.map(async (url) => {
                try {
                    const res = await fetch('/api/migration', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: url.trim() })
                    });
                    const data = await res.json();
                    
                    if (data.success) {
                        return { 
                            url, 
                            status: 'success', 
                            title: data.mangaId,
                            link: data.redirectUrl 
                        };
                    } else {
                        return { url, status: 'error', msg: data.error };
                    }
                } catch (err) {
                    return { url, status: 'error', msg: 'L?i kết nối' };
                }
            }));
            
            // TITAN OPTIMIZATION: Batch update to reduce re-renders
            batchResults = [...batchResults, ...chunkResults];
            setResults([...batchResults]);
            
            // Adaptive delay to prevent OS-level TCP congestion
            await new Promise(r => setTimeout(r, 500));
        }
        setIsProcessing(false);
    };

    const fetchMangaAndAddToHistory = async (mangaId, chapterId) => {
        if (!chapterId) return; 
        try {
            await fetch(`/api/chapter-images/${encodeURIComponent(chapterId)}`);
        } catch (e) {}
    };

    return (
        <main className="main-wrapper titan-bg">
            <Header />
            <div className="container transfer-container fade-up">
                <header className="section-header-industrial">
                    <div className="transfer-header-badge">DI CẦN TIẾP No�I</div>
                    <h1 className="transfer-title">Do�ch Chuyo�n No�i Dung</h1>
                    <p className="transfer-subtitle">
                        H? tho�ng gi�p bạn chuyo�n d? li?u t? ngu?n ngo�i vo� TruyenVip nhanh ch�ng v� o�n đo�nh. Mo�i mo�t li�n k?t l� mo�t h�nh tr�nh mo�i.
                    </p>
                </header>

                <div className="transfer-form-card">
                    <div className="card-header-industrial">
                        <h3 className="card-title-industrial">Nhập li�n k?t chương truy?n</h3>
                        <span className="card-hint-industrial">Mo�i d�ng mo�t li�n k?t chương truy?n (NetTruyen, TruyenQQ...)</span>
                    </div>

                    <form onSubmit={handleBatchTransfer}>
                        <textarea 
                            value={urls}
                            onChange={(e) => setUrls(e.target.value)}
                            placeholder="D�n c�c li�n k?t chương truy?n v�o đ�y..."
                            className="transfer-textarea-titan"
                        />
                        <button 
                            type="submit" 
                            disabled={isProcessing || !urls.trim()}
                            className={`btn btn-primary btn-large-titan ${isProcessing ? 'processing' : ''}`}
                        >
                            {isProcessing ? (
                                <><RefreshCw className="spin" size={24} /> ĐANG Xo� L� Do� LI?U...</>
                            ) : (
                                <><Zap size={24} fill="currentColor" /> K�CH HOẠT Do�CH CHUYo�N</>
                            )}
                        </button>
                    </form>

                    {results.length > 0 && (
                        <div className="transfer-results-section fade-in">
                            <h3 className="results-title-industrial">B?n ghi do�ch chuyo�n</h3>
                            <div className="results-list-industrial">
                                {results.map((res, i) => (
                                    <div key={i} className={`result-item-industrial ${res.status === 'success' ? 'is-success' : 'is-error'}`}>
                                        <div className="result-url-industrial">{res.url}</div>
                                        <div className="result-meta-industrial">
                                            {res.status === 'success' ? (
                                                <>
                                                    <a href={res.link} target="_blank" rel="noreferrer" className="result-link-industrial">
                                                        XEM NGAY <ExternalLink size={14} />
                                                    </a>
                                                    <div className="status-badge-industrial success">
                                                        <CheckCircle size={18} />
                                                        <span>TH�NH C�NG</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="status-badge-industrial error">
                                                    <XCircle size={18} />
                                                    <span>THẤT BẠI</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
            <style jsx>{`
                .section-header-industrial {
                    text-align: center;
                    margin-bottom: 60px;
                }
                .card-header-industrial {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    flex-wrap: wrap;
                    gap: 15px;
                    margin-bottom: 30px;
                }
                .card-title-industrial {
                    font-size: 1.5rem;
                    font-weight: 950;
                    letter-spacing: -0.5px;
                    color: var(--text-primary);
                }
                .card-hint-industrial {
                    font-size: 0.8rem;
                    font-weight: 800;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .transfer-results-section {
                    margin-top: 60px;
                }
                .results-title-industrial {
                    font-size: 1.2rem;
                    font-weight: 950;
                    margin-bottom: 25px;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .results-list-industrial {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .result-url-industrial {
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: var(--text-secondary);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 60%;
                    font-family: var(--font-mono);
                }
                .result-meta-industrial {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }
                .result-link-industrial {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: #3b82f6;
                    text-decoration: none;
                    font-weight: 900;
                    font-size: 0.8rem;
                    letter-spacing: 0.5px;
                    transition: all 0.3s;
                }
                .result-link-industrial:hover {
                    color: #60a5fa;
                }
                .status-badge-industrial {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 950;
                    font-size: 0.75rem;
                    letter-spacing: 1px;
                }
                .status-badge-industrial.success { color: #10b981; }
                .status-badge-industrial.error { color: var(--accent); }
            `}</style>
        </main>
    );
}


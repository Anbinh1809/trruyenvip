'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
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

        setIsProcessing(true);
        setResults([]);
        
        const processResults = [];
        
        for (let i = 0; i < urlList.length; i += 3) {
            const chunk = urlList.slice(i, i + 3);
            await Promise.all(chunk.map(async (url) => {
                try {
                    const res = await fetch('/api/migration', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: url.trim() })
                    });
                    const data = await res.json();
                    
                    if (data.success) {
                        processResults.push({ 
                            url, 
                            status: 'success', 
                            title: data.mangaId,
                            link: data.redirectUrl 
                        });
                        fetchMangaAndAddToHistory(data.mangaId, data.chapterId);
                    } else {
                        processResults.push({ url, status: 'error', msg: data.error });
                    }
                } catch (err) {
                    processResults.push({ url, status: 'error', msg: 'Lỗi kết nối' });
                }
            }));
            setResults([...processResults]);
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
                    <div className="transfer-header-badge">DI CẦN TIẾP NỐI</div>
                    <h1 className="transfer-title">Dịch Chuyển Nội Dung</h1>
                    <p className="transfer-subtitle">
                        Hệ thống giúp bạn chuyển dữ liệu từ nguồn ngoài về TruyenVip nhanh chóng và ổn định. Mỗi một liên kết là một hành trình mới.
                    </p>
                </header>

                <div className="transfer-form-card">
                    <div className="card-header-industrial">
                        <h3 className="card-title-industrial">Nhập liên kết chương truyện</h3>
                        <span className="card-hint-industrial">Mỗi dòng một liên kết chương truyện (NetTruyen, TruyenQQ...)</span>
                    </div>

                    <form onSubmit={handleBatchTransfer}>
                        <textarea 
                            value={urls}
                            onChange={(e) => setUrls(e.target.value)}
                            placeholder="Dán các liên kết chương truyện vào đây..."
                            className="transfer-textarea-titan"
                        />
                        <button 
                            type="submit" 
                            disabled={isProcessing || !urls.trim()}
                            className={`btn btn-primary btn-large-titan ${isProcessing ? 'processing' : ''}`}
                        >
                            {isProcessing ? (
                                <><RefreshCw className="spin" size={24} /> ĐANG XỬ LÝ DỮ LIỆU...</>
                            ) : (
                                <><Zap size={24} fill="currentColor" /> KÍCH HOẠT DỊCH CHUYỂN</>
                            )}
                        </button>
                    </form>

                    {results.length > 0 && (
                        <div className="transfer-results-section fade-in">
                            <h3 className="results-title-industrial">Bản ghi dịch chuyển</h3>
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
                                                        <span>THÀNH CÔNG</span>
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
                    color: white;
                }
                .card-hint-industrial {
                    font-size: 0.8rem;
                    font-weight: 800;
                    color: rgba(255, 255, 255, 0.3);
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
                    color: rgba(255, 255, 255, 0.5);
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
                    color: rgba(255, 255, 255, 0.6);
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

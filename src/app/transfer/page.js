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
            alert(`Một số liên kết không được hỗ trợ: ${invalidUrls[0]}...`);
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
                    return { url, status: 'error', msg: 'Lỗi kết nối' };
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

    return (
        <main className="main-wrapper titan-bg">
            <Header />
            <div className="container transfer-container fade-up">
                <div className="section-header-industrial">
                    <div className="transfer-header-badge">DI CẢN TIẾP NỐI</div>
                    <h1 className="transfer-title">Dịch Chuyển Nội Dung</h1>
                    <p className="transfer-subtitle">
                        Hệ thống giúp bạn chuyển dữ liệu từ nguồn ngoài về TruyenVip nhanh chóng và ổn định. Mỗi một liên kết là một hành trình mới.
                    </p>
                </div>

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
            <style>{`
                .transfer-container {
                    padding-top: 140px;
                    padding-bottom: 100px;
                }
                .section-header-industrial {
                    text-align: center;
                    margin-bottom: 60px;
                }
                .transfer-header-badge {
                    display: inline-block;
                    padding: 6px 16px;
                    background: rgba(255, 62, 62, 0.1);
                    border: 1px solid rgba(255, 62, 62, 0.2);
                    border-radius: 8px;
                    color: var(--accent);
                    font-size: 0.75rem;
                    font-weight: 950;
                    letter-spacing: 2px;
                    margin-bottom: 20px;
                }
                .transfer-title {
                    font-size: 3.5rem;
                    font-weight: 950;
                    letter-spacing: -2px;
                    margin-bottom: 20px;
                    color: var(--text-primary);
                }
                .transfer-subtitle {
                    color: var(--text-muted);
                    font-size: 1.1rem;
                    max-width: 600px;
                    margin: 0 auto;
                    line-height: 1.7;
                    font-weight: 600;
                }
                .transfer-form-card {
                    background: var(--glass-bg);
                    border: 1px solid var(--glass-border);
                    border-radius: 32px;
                    padding: 50px;
                    max-width: 900px;
                    margin: 0 auto;
                    box-shadow: 0 40px 100px rgba(0,0,0,0.5);
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
                .transfer-textarea-titan {
                    width: 100%;
                    min-height: 200px;
                    background: var(--nebula-glass);
                    border: 1px solid var(--glass-border);
                    border-radius: 20px;
                    padding: 25px;
                    color: var(--text-primary);
                    font-size: 1rem;
                    font-family: var(--font-mono);
                    margin-bottom: 25px;
                    resize: vertical;
                    transition: all 0.3s;
                }
                .transfer-textarea-titan:focus {
                    outline: none;
                    border-color: var(--accent);
                    background: var(--glass-bg);
                }
                .btn-large-titan {
                    width: 100%;
                    padding: 20px;
                    font-size: 1.2rem;
                    letter-spacing: 1px;
                    gap: 15px;
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
                .result-item-industrial {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 30px;
                    background: var(--nebula-glass);
                    border: 1px solid var(--glass-border);
                    border-radius: 16px;
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
                
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .spin { animation: spin 2s linear infinite; }
            `}</style>
        </main>
    );
}

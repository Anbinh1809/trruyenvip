'use client';

import { useState } from 'react';
import { RefreshCw, Heart, Activity } from 'lucide-react';
import { useToast } from '@/components/widgets/ToastProvider';

export default function MangaHealer({ mangaId }) {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    const handleHeal = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/manga/${mangaId}/heal`, { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                addToast(data.message, 'success');
                setDone(true);
            } else {
                addToast(data.error || 'Lỗi khôi phục.', 'error');
            }
        } catch (e) {
            addToast('Lỗi kết nối máy chủ.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="manga-healer-titan shadow-titan fade-up">
            <div className="healer-icon-box">
                {loading ? (
                    <Activity size={40} className="pulse-titan" />
                ) : done ? (
                    <Activity size={40} color="#10b981" />
                ) : (
                    <Heart size={40} color="var(--accent)" />
                )}
            </div>
            
            <div className="healer-content-titan">
                <h3 className="healer-title">CHƯA CÓ CHƯƠNG TRUYỆN?</h3>
                <p className="healer-desc">Có vẻ như dữ liệu chưa được đồng bộ hoặc nguồn cấp bị gián đoạn. Titan Engine có thể thử quét lại toàn bộ chương ngay bây giờ.</p>
                
                {done ? (
                    <div className="healer-status-success">
                        Yêu cầu khôi phục đã gửi... Vui lòng F5 sau 1-2 phút.
                    </div>
                ) : (
                    <button 
                        className={`btn btn-primary healer-btn-titan ${loading ? 'loading' : ''}`}
                        disabled={loading}
                        onClick={handleHeal}
                    >
                        {loading ? 'ĐANG KÍCH HOẠT titan...' : <><RefreshCw size={18} /> KHÔI PHỤC DỮ LIỆU</>}
                    </button>
                )}
            </div>

            <style>{`
                .manga-healer-titan {
                    display: flex;
                    align-items: center;
                    gap: 30px;
                    background: var(--glass-bg);
                    border: 1px solid var(--glass-border);
                    padding: 30px;
                    border-radius: 20px;
                    margin: 40px 0;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                }
                .healer-content-titan { flex: 1; }
                .healer-title { font-size: 1.2rem; font-weight: 950; margin-bottom: 8px; color: var(--text-primary); letter-spacing: 0.5px; }
                .healer-desc { font-size: 0.9rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 20px; }
                .healer-btn-titan { padding: 12px 30px; font-weight: 950; font-size: 0.85rem; letter-spacing: 0.5px; gap: 10px; }
                .healer-status-success { font-weight: 900; color: #10b981; font-size: 0.9rem; letter-spacing: 0.5px; }
                .pulse-titan { animation: pulse 1.5s infinite; color: var(--accent); }
                @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; transform: scale(1.1); } 100% { opacity: 0.5; } }
            `}</style>
        </div>
    );
}

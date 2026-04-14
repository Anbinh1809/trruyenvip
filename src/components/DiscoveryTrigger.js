'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DiscoveryTrigger({ slug }) {
    const [status, setStatus] = useState('initializing'); // initializing, syncing, ready, error
    const [message, setMessage] = useState('Đang khởi tạo chuỗi dữ liệu...');
    const router = useRouter();

    useEffect(() => {
        const startDiscovery = async () => {
            try {
                setStatus('syncing');
                setMessage('Tham chiếu dữ liệu từ Đa vũ trụ... (Vui lòng chờ 5-10 giây)');
                
                const res = await fetch('/api/crawl/on-demand', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ slug, source: 'nettruyen' })
                });

                const data = await res.json();
                
                if (data.success) {
                    setStatus('ready');
                    setMessage('Đồng bộ thành công! Đang tái cấu trúc trang...');
                    // Rapid Poll or Delay for DB persistence
                    setTimeout(() => {
                        window.location.reload();
                    }, 3000);
                } else {
                    setStatus('error');
                    setMessage(data.message || 'Không thể đồng bộ bộ truyện này.');
                }
            } catch (err) {
                setStatus('error');
                setMessage('Lỗi kết nối Titan Engine. Vui lòng thử lại sau.');
            }
        };

        if (slug) {
            startDiscovery();
        }
    }, [slug]);

    return (
        <div className="discovery-industrial shadow-titan fade-up">
            <div className="discovery-icon-wrapper">
                {status === 'syncing' && <Loader2 size={40} className="spin-titan color-accent" />}
                {status === 'ready' && <CheckCircle size={40} color="#10b981" className="bounce-titan" />}
                {status === 'error' && <AlertCircle size={40} color="#ef4444" />}
                {status === 'initializing' && <RefreshCw size={40} className="spin-titan opacity-50" />}
            </div>
            
            <div className="discovery-text">
                <h3 className="discovery-status-title">
                    {status === 'syncing' ? 'ĐANG DỮ LIỆU HÓA' : 
                     status === 'ready' ? 'ĐÃ SẴN SÀNG' : 
                     status === 'error' ? 'LỖI ĐỒNG BỘ' : 'KHỞI TẠO'}
                </h3>
                <p className="discovery-msg">{message}</p>
            </div>

            <style jsx>{`
                .discovery-industrial {
                    background: rgba(20, 20, 25, 0.8);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 2rem;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                    max-width: 500px;
                    margin: 2rem auto;
                }
                .discovery-status-title {
                    margin: 0;
                    font-size: 1.1rem;
                    letter-spacing: 2px;
                    font-weight: 950;
                    color: white;
                }
                .discovery-msg {
                    margin: 4px 0 0 0;
                    font-size: 0.9rem;
                    color: rgba(255, 255, 255, 0.6);
                }
                .color-accent { color: var(--accent); }
            `}</style>
        </div>
    );
}

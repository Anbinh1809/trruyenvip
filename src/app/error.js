'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home, Zap, ShieldAlert } from 'lucide-react';
import "@/app/system.css";

export default function Error({ error, reset }) {
  const [repairing, setRepairing] = useState(false);

  useEffect(() => {
    // TITAN AUTOMATED REPORTING
    console.error('CRITICAL_CRASH:', error);
    fetch('/api/system/report-crash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            message: error?.message || 'Unknown Crash',
            stack: error?.stack,
            digest: error?.digest,
            url: typeof window !== 'undefined' ? window.location.href : 'SSR'
        })
    }).catch(() => {});
  }, [error]);

  const handleMagicRepair = () => {
    setRepairing(true);
    // SAFELY RESET NON-AUTH STATE
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('truyenvip_') && key !== 'truyenvip_auth') {
            localStorage.removeItem(key);
        }
    });
    sessionStorage.clear();
    
    setTimeout(() => {
        window.location.reload();
    }, 800);
  };

  return (
    <div className="main-wrapper titan-bg">
        <div className="system-center-industrial fade-in">
            <div className="center-icon-titan">
                <ShieldAlert size={100} color="var(--accent)" className="pulse-titan" />
            </div>
            
            <h1 className="system-title-industrial">HỆ THỐNG GẶP SỰ CỐ</h1>
            <p className="system-desc-industrial">
                Chúng tôi đã phát hiện một xung đột dữ liệu bất ngờ. Chế độ bảo vệ đã được kích hoạt để đảm bảo an toàn cho trải nghiệm đọc của bạn.
            </p>
            
            {error?.digest && (
                <div className="error-digest-tag">
                    PROTOCOL_DIGEST: {error.digest}
                </div>
            )}

            <div className="system-action-group-vertical">
                <button className="btn btn-primary err-action-btn-titan-large" onClick={() => reset()}>
                    <RefreshCw size={20} /> KHÔI PHỤC NGAY
                </button>
                
                <button 
                    className={`btn btn-accent-outline err-action-btn-titan-large ${repairing ? 'is-loading' : ''}`} 
                    onClick={handleMagicRepair}
                    disabled={repairing}
                >
                    <Zap size={20} /> {repairing ? 'ĐANG SỬA LỖI...' : 'SỬA LỖI TỰ ĐỘNG (MAGIC REPAIR)'}
                </button>

                <div className="action-row-titan">
                    <Link href="/" className="btn btn-glass err-action-btn-titan-small">
                        <Home size={18} /> TRANG CHỦ
                    </Link>
                    <button className="btn btn-outline-faded err-action-btn-titan-small" onClick={() => window.print()}>
                        XEM BÁO CÁO LỖI
                    </button>
                </div>
            </div>
            
            <style jsx>{`
                .system-action-group-vertical {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    width: 100%;
                    max-width: 450px;
                    margin: 40px auto;
                }
                .err-action-btn-titan-large {
                    padding: 18px;
                    font-size: 1rem;
                    font-weight: 950;
                    letter-spacing: 1px;
                }
                .action-row-titan {
                    display: flex;
                    gap: 15px;
                    justify-content: center;
                }
                .err-action-btn-titan-small {
                    padding: 12px 25px;
                    font-size: 0.85rem;
                }
            `}</style>
        </div>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global Application Error:', error);
  }, [error]);

  return (
    <div className="main-wrapper titan-bg">
        <div className="system-center-industrial fade-in">
            <div className="center-icon-titan">
                <AlertTriangle size={100} color="var(--accent)" className="pulse-titan" />
            </div>
            
            <h1 className="system-title-industrial">THẬP TỰ ĐOẠN GIỚI</h1>
            <p className="system-desc-industrial">
                Hệ thống đã phát sinh một lỗi không lường trước. Kết nối đồng bộ đã bị gián đoạn tạm thời.
            </p>
            
            {error?.digest && (
                <div className="error-digest-tag">
                    PROTOCOL_DIGEST: {error.digest}
                </div>
            )}

            <div className="system-action-group">
                <button className="btn btn-primary err-action-btn-titan" onClick={() => reset()}>
                    <RefreshCw size={20} /> TẢI LẠI TRANG
                </button>
                <Link href="/" className="btn btn-glass err-action-btn-titan">
                    <Home size={20} /> QUAY VỀ TRANG CHỦ
                </Link>
            </div>
        </div>
        <style jsx>{`
            .center-icon-titan { margin-bottom: 40px; }
            .pulse-titan { filter: drop-shadow(0 0 20px rgba(255, 62, 62, 0.4)); animation: pulse 2s infinite; }
            .error-digest-tag { font-family: monospace; font-size: 0.7rem; color: rgba(255,255,255,0.2); margin-bottom: 30px; letter-spacing: 1px; background: rgba(0,0,0,0.3); padding: 8px 15px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05); }
            .system-action-group { display: flex; flex-direction: column; gap: 15px; width: 100%; max-width: 350px; }
            .err-action-btn-titan { height: 60px; font-weight: 950; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 12px; border-radius: 12px; }
            @keyframes pulse { 0% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.05); opacity: 1; } 100% { transform: scale(1); opacity: 0.8; } }
        `}</style>
    </div>
  );
}

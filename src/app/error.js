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
    </div>
  );
}

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
    <div className="titan-chaos-wrap fade-in">
      <div className="titan-chaos-card">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '25px' }}>
          <AlertTriangle size={60} color="var(--accent)" />
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '15px', letterSpacing: '1px' }}>HỆ THỐNG GIÁN ĐOẠN</h1>
        <p style={{ fontSize: '1rem', lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: '30px', fontWeight: 500 }}>
            Đã xảy ra lỗi không mong muốn trong quá trình xử lý. Vui lòng thử tải lại trang hoặc quay về trang chủ.
        </p>
        
        {error?.digest && (
            <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', marginBottom: '20px', fontStyle: 'italic' }}>
                Error ID: {error.digest}
            </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <button className="btn btn-primary" onClick={() => reset()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '15px 30px', borderRadius: '15px', fontWeight: 800 }}>
                <RefreshCw size={20} /> Tải Lại Trang
            </button>
            <Link href="/" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '15px 30px', borderRadius: '15px', fontWeight: 800, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', textDecoration: 'none', color: 'white' }}>
                <Home size={20} /> Quay Lại Trang Chủ
            </Link>
        </div>
      </div>
    </div>
  );
}

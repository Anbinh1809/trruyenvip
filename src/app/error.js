'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global Application Error:', error);
  }, [error]);

  return (
    <div className="titan-chaos-wrap fade-in">
      <div className="titan-chaos-card">
        <div className="titan-nebula-emoji">💥</div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '15px', letterSpacing: '2px' }}>LINH KHÍ NHIỄU LOẠN</h1>
        <p style={{ fontSize: '1rem', lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: '30px', fontWeight: 500 }}>
            Đạo hữu thân mến, trận pháp TruyenVip đang gặp chút trắc trở (có thể do kết nối linh thạch bị gián đoạn). Hãy thử tái tạo lại trận pháp hoặc quay về đạo đường.
        </p>
        
        {error?.digest && (
            <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', marginBottom: '20px', fontStyle: 'italic' }}>
                Mã cẩm chú: {error.digest}
            </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <button className="btn btn-primary" onClick={() => reset()} style={{ padding: '15px 30px', borderRadius: '15px', fontWeight: 800 }}>
                🔄 Tái Tạo Trận Pháp
            </button>
            <Link href="/" className="btn btn-outline" style={{ padding: '15px 30px', borderRadius: '15px', fontWeight: 800, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', textDecoration: 'none' }}>
                🏠 Quay Lại Đạo Đường
            </Link>
        </div>
      </div>
    </div>
  );
}

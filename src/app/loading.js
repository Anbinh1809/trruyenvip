'use client';

import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="titan-nebula-loading" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="titan-loading-content" style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <Loader2 className="spin" size={48} color="var(--accent)" />
        </div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase' }}>
          ĐANG TẢI DỮ LIỆU
        </h2>
        <p style={{ fontSize: '0.8rem', marginTop: '10px', opacity: 0.5 }}>
          Vui lòng đợi trong giây lát...
        </p>
      </div>
    </div>
  );
}

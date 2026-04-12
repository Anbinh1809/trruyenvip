'use client';

export default function Loading() {
  return (
    <div className="titan-nebula-loading">
      <div className="titan-loading-content">
        <div className="titan-orb-loader"></div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '2px', marginTop: '20px' }}>
          ✨ ĐANG KHỞI TẠO TRẬN PHÁP...
        </h2>
        <p style={{ fontSize: '0.8rem', marginTop: '10px', opacity: 0.5 }}>
          Vui lòng đợi trong giây lát khi chúng tôi thu thập linh khí tinh hoa
        </p>
      </div>
    </div>
  );
}

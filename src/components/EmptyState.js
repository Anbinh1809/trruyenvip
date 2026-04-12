'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function EmptyState({ title, subtitle, actionText = 'Tiếp tục khám phá', actionUrl = '/' }) {
  return (
    <div className="empty-state-titan fade-up">
      <div className="empty-illustration">
        <Image 
          src="/illustrations/empty-guardian.png" 
          alt="Linh Thú Canh Giữ" 
          fill
          style={{ objectFit: 'contain' }}
        />
      </div>
      <h2 style={{ fontSize: '2.2rem', fontWeight: 950, marginBottom: '15px', color: 'white', letterSpacing: '-1px' }}>
        {title}
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.4)', maxWidth: '500px', margin: '0 auto', fontWeight: 600, fontSize: '1.1rem', lineHeight: '1.6' }}>
        {subtitle}
      </p>
      <Link href={actionUrl} className="btn btn-primary" style={{ marginTop: '40px', padding: '18px 50px', borderRadius: '20px' }}>
        {actionText}
      </Link>
    </div>
  );
}

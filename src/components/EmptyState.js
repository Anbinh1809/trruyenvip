'use client';

import Link from 'next/link';
import { Ghost, Compass } from 'lucide-react';

export default function EmptyState({ title, subtitle, actionText = 'Tiếp tục khám phá', actionUrl = '/' }) {
  return (
    <div className="empty-state-titan fade-up" style={{ textAlign: 'center', padding: '80px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Ghost size={48} color="rgba(255,255,255,0.15)" style={{ marginBottom: '25px' }} />
      
      <h2 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '0 0 15px', color: 'white', letterSpacing: '-0.5px', fontFamily: 'var(--font-heading)' }}>
        {title}
      </h2>

      <p style={{ color: 'rgba(255,255,255,0.4)', maxWidth: '450px', margin: '0 auto', fontWeight: 500, fontSize: '1rem', lineHeight: '1.7' }}>
        {subtitle}
      </p>

      <Link href={actionUrl} className="btn btn-primary" style={{ marginTop: '35px', padding: '14px 40px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Compass size={18} />
        {actionText}
      </Link>
    </div>
  );
}

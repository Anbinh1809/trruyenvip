'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, Ghost, Compass } from 'lucide-react';

export default function EmptyState({ title, subtitle, actionText = 'Tiếp tục khám phá', actionUrl = '/' }) {
  return (
    <div className="empty-state-titan fade-up" style={{ textAlign: 'center', padding: '100px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="empty-illustration" style={{ position: 'relative', width: '280px', height: '280px', marginBottom: '40px' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, rgba(255, 62, 62, 0.15) 0%, transparent 70%)', zIndex: -1, animation: 'pulse 3s infinite' }}></div>
        <Image 
          src="/illustrations/empty-guardian.png" 
          alt="Không có dữ liệu" 
          fill
          style={{ objectFit: 'contain' }}
        />
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <Sparkles size={20} color="var(--accent)" />
        <h2 style={{ fontSize: '2.4rem', fontWeight: 950, margin: 0, color: 'white', letterSpacing: '-1.5px', fontFamily: 'var(--font-heading)' }}>
          {title}
        </h2>
        <Sparkles size={20} color="var(--accent)" />
      </div>

      <p style={{ color: 'rgba(255,255,255,0.4)', maxWidth: '550px', margin: '0 auto', fontWeight: 600, fontSize: '1.15rem', lineHeight: '1.8' }}>
        {subtitle}
      </p>

      <Link href={actionUrl} className="btn btn-primary btn-glow" style={{ marginTop: '50px', padding: '20px 60px', borderRadius: '20px', fontSize: '1rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Compass size={20} />
        {actionText}
      </Link>
    </div>
  );
}

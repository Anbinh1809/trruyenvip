'use client';

import Link from 'next/link';
import { Ghost, Compass } from 'lucide-react';

export default function EmptyState({ title, subtitle, actionText = 'TIẾP TỤC KHÁM PHÁ', actionUrl = '/' }) {
  return (
    <div className="empty-state-titan fade-up industrial-p-80">
      <div className="empty-icon-titan">
        <Ghost size={64} strokeWidth={1.5} />
      </div>
      
      <h2 className="empty-title-industrial">
        {title}
      </h2>

      <p className="empty-desc-industrial">
        {subtitle}
      </p>

      <Link href={actionUrl} className="btn btn-primary empty-btn-industrial">
        <Compass size={20} />
        {actionText}
      </Link>

      <style jsx>{`
        .industrial-p-80 {
            padding: 100px 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .empty-icon-titan {
            color: rgba(255, 255, 255, 0.1);
            margin-bottom: 30px;
            animation: float-slow 4s ease-in-out infinite;
        }
        .empty-title-industrial {
            font-size: 2rem; 
            font-weight: 950; 
            margin: 0 0 15px; 
            color: white; 
            letter-spacing: -1px;
        }
        .empty-desc-industrial {
            color: rgba(255, 255, 255, 0.4); 
            max-width: 500px; 
            margin: 0 auto; 
            font-weight: 700; 
            font-size: 1rem; 
            line-height: 1.7;
        }
        .empty-btn-industrial {
            margin-top: 40px; 
            padding: 15px 50px; 
            display: flex; 
            align-items: center; 
            gap: 12px;
            font-weight: 950;
            letter-spacing: 1px;
        }
        @keyframes float-slow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  );
}

'use client';

import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Compass } from 'lucide-react';
import "@/app/system.css";


export default function NotFound() {
  return (
    <main className="main-wrapper titan-bg">
      <Header />
      <div className="system-center-industrial fade-in">
          <div className="center-icon-titan">
              <Compass size={120} color="var(--accent)" className="rotate-3d-titan" />
          </div>
          <h1 className="system-title-industrial">404: KHÔNG GIAN VÔ ĐỊNH</h1>
          <p className="system-desc-industrial">
              Trang bạn đang tìm kiếm đã lạc vào một không gian khác hoặc chưa từng tồn tại trong hệ thống.
          </p>
          <div className="err-actions-titan">
              <Link href="/" className="btn btn-primary err-btn-titan">
                  QUAY VỀ TRANG CHỦ
              </Link>
          </div>
      </div>
      <Footer />
      <style>{`
          .system-center-industrial {
              min-height: 80vh;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              padding: 20px;
          }
          .center-icon-titan {
              margin-bottom: 40px;
              opacity: 0.8;
          }
          .system-title-industrial {
              font-size: clamp(2rem, 8vw, 4rem);
              font-weight: 950;
              letter-spacing: -2px;
              margin-bottom: 20px;
              color: var(--text-primary);
          }
          .system-desc-industrial {
              font-size: 1.1rem;
              color: var(--text-muted);
              max-width: 500px;
              line-height: 1.6;
              margin-bottom: 40px;
              font-weight: 600;
          }
          .err-btn-titan {
              padding: 16px 40px;
              font-size: 1rem;
              letter-spacing: 1px;
              font-weight: 950;
          }
      `}</style>
    </main>
  );
}

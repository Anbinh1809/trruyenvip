import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="main-wrapper titan-bg">
      <Header />
      <div className="system-center-industrial fade-in">
          <div className="center-icon-titan">
              <Compass size={120} color="var(--accent)" className="rotate-3d-titan" />
          </div>
          <h1 className="system-title-industrial">404: LOST IN ABYSS</h1>
          <p className="system-desc-industrial">
              Trang bạn đang tìm kiếm đã lạc vào một không gian khác hoặc chưa từng tồn tại trong hệ thống.
          </p>
          <Link href="/" className="btn btn-primary err-btn-titan">
              QUAY VỀ TRANG CHỦ
          </Link>
      </div>
      <Footer />
    </main>
  );
}

import Link from 'next/link';
import Header from '@/GiaoDien/BoCuc/Header';
import Footer from '@/GiaoDien/BoCuc/Footer';
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
          <h1 className="system-title-industrial">404: LOST IN ABYSS</h1>
          <p className="system-desc-industrial">
              Trang báº¡n Ä‘ang tà¬m kiáº¿m đã láº¡c và o mo™t không gian khác hoáº·c chưa từng tồnn táº¡i trong hệ thống.
          </p>
          <Link href="/" className="btn btn-primary err-btn-titan">
              QUAY Vo€ TRANG CHo¦
          </Link>
      </div>
      <Footer />
    </main>
  );
}


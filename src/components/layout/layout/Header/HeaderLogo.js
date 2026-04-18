import NextLink from 'next/link';
import { BookOpen } from 'lucide-react';

export default function HeaderLogo() {
  return (
    <NextLink href="/" className="logo-industrial-premium" aria-label="TruyenVip — Trang chủ">
      <div className="logo-icon-wrapper">
        <BookOpen size={24} className="logo-icon-titan" />
        <div className="logo-glow-titan"></div>
      </div>
      <div className="logo-text-stack">
        <span className="logo-main-titan">TRUYEN<span className="accent">VIP</span></span>
        <span className="logo-sub-titan">INDUSTRIAL ARCADE</span>
      </div>
    </NextLink>
  );
}

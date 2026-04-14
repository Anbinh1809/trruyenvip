import NextLink from 'next/link';
import { BookOpen } from 'lucide-react';

export default function HeaderLogo() {
  return (
    <NextLink href="/" className="logo-industrial" aria-label="TruyenVip — Trang chủ">
      <BookOpen size={20} className="logo-icon" />
      <span className="logo-primary">Truyen</span>
      <span className="logo-accent-titan">Vip</span>
    </NextLink>
  );
}

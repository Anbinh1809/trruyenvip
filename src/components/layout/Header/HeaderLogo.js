import Link from 'next/link';

export default function HeaderLogo() {
  return (
    <Link href="/" className="logo">
      <span>Truyen</span>
      <span style={{ color: 'var(--accent)' }}>Vip</span>
    </Link>
  );
}

import NextLink from 'next/link';

export default function HeaderLogo() {
  return (
    <NextLink href="/" className="logo">
      <span>Truyen</span>
      <span style={{ color: 'var(--accent)' }}>Vip</span>
    </NextLink>
  );
}

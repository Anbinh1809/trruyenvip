import NextLink from 'next/link';

export default function HeaderLogo() {
  return (
    <NextLink href="/" className="logo-industrial">
      <span className="logo-primary">Truyen</span>
      <span className="logo-accent-titan">Vip</span>
      <style jsx>{`
        .logo-industrial {
            font-size: 1.8rem;
            font-weight: 950;
            color: white;
            text-decoration: none;
            display: flex;
            align-items: center;
            letter-spacing: -2px;
            transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .logo-industrial:hover {
            transform: scale(1.05);
        }
        .logo-accent-titan {
            color: var(--accent);
        }
        @media (max-width: 768px) {
            .logo-industrial {
                font-size: 1.5rem;
            }
        }
      `}</style>
    </NextLink>
  );
}

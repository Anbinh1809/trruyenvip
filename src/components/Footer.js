'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer titan-footer-glass">
      <div className="container">
        <div className="footer-grid-titan">
          {/* COLUMN 1: BRAND */}
          <div className="footer-col-brand">
            <div className="logo-extreme-finish" style={{ fontSize: '1.8rem', marginBottom: '20px' }}>
                TRUYEN<span style={{ color: 'var(--accent)' }}>VIP</span>
            </div>
            <p className="footer-brand-text">
                Nền tảng đọc truyện tranh trực tuyến hàng đầu, nơi hội tụ tinh hoa của vạn bộ truyện. Trải nghiệm cinematic trên mọi thiết bị.
            </p>
            <div className="dmca-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, border: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ color: '#10b981' }}>✓</span> DMCA PROTECTED
            </div>
          </div>

          {/* COLUMN 2: SEO CLUSTER */}
          <div className="footer-col">
            <h4 className="footer-heading">Thể loại HOT</h4>
            <ul className="footer-links">
                <li><Link href="/genres?type=action">Action</Link></li>
                <li><Link href="/genres?type=manga">Manga</Link></li>
                <li><Link href="/genres?type=manhwa">Manhwa</Link></li>
                <li><Link href="/genres?type=romance">Romance</Link></li>
            </ul>
          </div>

          {/* COLUMN 3: COMMUNITY */}
          <div className="footer-col">
            <h4 className="footer-heading">Mạng Xã Hội</h4>
            <ul className="footer-links">
                <li><a href="#" target="_blank" rel="nofollow">Facebook Feed</a></li>
                <li><a href="#" target="_blank" rel="nofollow">Discord Community</a></li>
                <li><a href="#" target="_blank" rel="nofollow">Telegram Global</a></li>
            </ul>
          </div>

          {/* COLUMN 4: POLICY */}
          <div className="footer-col">
            <h4 className="footer-heading">Chính Sách</h4>
            <ul className="footer-links">
                <li><Link href="/copyright">Bản Quyền</Link></li>
                <li><Link href="/terms">Điều Khoản</Link></li>
                <li><Link href="/privacy">Bảo Mật</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom-titan">
          <p>© {new Date().getFullYear()} TruyenVip. Đọc truyện tranh online miễn phí chất lượng cao.</p>
        </div>
      </div>

      <style jsx>{`
        .footer-grid-titan {
            display: grid;
            grid-template-columns: 1.5fr 1fr 1fr 1fr;
            gap: 60px;
            padding: 80px 0;
        }
        .footer-brand-text {
            font-size: 0.9rem;
            line-height: 1.7;
            color: rgba(255,255,255,0.4);
            margin-bottom: 25px;
        }
        .footer-heading {
            font-size: 0.95rem;
            font-weight: 900;
            letter-spacing: 1px;
            margin-bottom: 25px;
            text-transform: uppercase;
            color: var(--text-primary);
        }
        .footer-links {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .footer-links li {
            margin-bottom: 15px;
        }
        .footer-links :global(a) {
            color: rgba(255,255,255,0.4);
            text-decoration: none;
            font-size: 0.9rem;
            font-weight: 600;
            transition: 0.3s;
        }
        .footer-links :global(a:hover) {
            color: var(--accent);
            padding-left: 5px;
        }
        .footer-bottom-titan {
            padding: 40px 0;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.8rem;
            color: rgba(255,255,255,0.2);
        }
        .tech-stack-badges {
            display: flex;
            gap: 15px;
        }
        .tech-stack-badges span {
            padding: 4px 10px;
            background: rgba(255,255,255,0.03);
            border-radius: 6px;
            font-weight: 800;
        }
        @media (max-width: 1024px) {
            .footer-grid-titan {
                grid-template-columns: 1fr 1fr;
                gap: 40px;
            }
        }
        @media (max-width: 600px) {
            .footer-grid-titan {
                grid-template-columns: 1fr;
            }
            .footer-bottom-titan {
                flex-direction: column;
                gap: 20px;
                text-align: center;
            }
        }
      `}</style>
    </footer>
  );
}


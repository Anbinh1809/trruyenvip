'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer titan-footer-glass">
      <div className="container">
        <div className="footer-grid-titan">
          {/* COLUMN 1: BRAND */}
          <div className="footer-col-brand">
            <div className="logo logo-footer">
                TRUYEN<span className="text-accent">VIP</span>
            </div>
            <p className="footer-brand-text">
                Nền tảng đọc truyện tranh trực tuyến hàng đầu, nơi hội tụ tinh hoa của vạn bộ truyện. Trải nghiệm cinematic trên mọi thiết bị.
            </p>
            <div className="dmca-badge">
                <span className="dmca-check">✓</span> DMCA PROTECTED
            </div>
          </div>

          {/* COLUMN 2: SEO CLUSTER */}
          <div className="footer-col">
            <h4 className="footer-heading">Khám Phá</h4>
            <ul className="footer-links">
                <li><Link href="/genres">Tất cả thể loại</Link></li>
                <li><Link href="/genres?type=action">Truyện Action</Link></li>
                <li><Link href="/genres?type=manga">Manga Nhật</Link></li>
                <li><Link href="/genres?type=manhwa">Manhwa Hàn</Link></li>
            </ul>
          </div>

          {/* COLUMN 3: COMMUNITY */}
          <div className="footer-col">
            <h4 className="footer-heading">Cộng Đồng</h4>
            <ul className="footer-links">
                <li><a href="https://facebook.com/truyenvip" target="_blank" rel="nofollow">Facebook Feed</a></li>
                <li><a href="https://discord.gg/truyenvip" target="_blank" rel="nofollow">Discord Community</a></li>
                <li><a href="https://t.me/truyenvip_official" target="_blank" rel="nofollow">Telegram Global</a></li>
            </ul>
          </div>

          {/* COLUMN 4: POLICY */}
          <div className="footer-col">
            <h4 className="footer-heading">Chính Sách</h4>
            <ul className="footer-links">
                <li><Link href="/copyright">Bản Quyền Content</Link></li>
                <li><Link href="/terms">Điều Khoản Dịch Vụ</Link></li>
                <li><Link href="/privacy">Quyền Riêng Tư</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom-titan">
          <p>© {new Date().getFullYear()} <strong className="text-white">TruyenVip</strong>. Industrial Grade Reading Platform.</p>
          <div className="footer-built-with">
              Built with <span className="text-accent">❤</span> for Readers
          </div>
        </div>
      </div>

      <style>{`
        .titan-footer-glass {
            background: rgba(2, 6, 23, 0.95);
            border-top: 1px solid var(--glass-border);
            position: relative;
            z-index: 10;
        }
        .footer-grid-titan {
            display: grid;
            grid-template-columns: 1.5fr 1fr 1fr 1fr;
            gap: 60px;
            padding: 80px 0;
        }
        .logo-footer {
            font-size: 1.8rem; 
            margin-bottom: 20px; 
            font-weight: 950; 
            letter-spacing: -1.5px;
            color: var(--text-primary);
        }
        .text-accent { color: var(--accent); }
        .text-white { color: var(--text-primary); }
        .footer-brand-text {
            font-size: 0.9rem;
            line-height: 1.8;
            color: var(--text-secondary);
            margin-bottom: 30px;
            max-width: 320px;
        }
        .footer-heading {
            font-size: 0.75rem;
            font-weight: 950;
            letter-spacing: 2px;
            margin-bottom: 30px;
            text-transform: uppercase;
            color: var(--text-primary);
            opacity: 0.9;
        }
        .footer-links {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .footer-links li {
            margin-bottom: 18px;
        }
        .footer-links :global(a) {
            color: var(--text-muted);
            text-decoration: none;
            font-size: 0.85rem;
            font-weight: 700;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .footer-links :global(a:hover) {
            color: var(--accent);
            padding-left: 10px;
        }
        .dmca-badge {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 8px 18px;
            background: var(--nebula-glass);
            border-radius: 8px;
            font-size: 0.7rem;
            font-weight: 950;
            color: var(--text-primary);
            border: 1px solid var(--glass-border);
            letter-spacing: 1px;
        }
        .dmca-check { color: #10b981; }
        .footer-bottom-titan {
            padding: 40px 0;
            border-top: 1px solid var(--glass-border);
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.85rem;
            color: var(--text-muted);
            font-weight: 700;
        }
        @media (max-width: 1024px) {
            .footer-grid-titan {
                grid-template-columns: 1fr 1fr;
                gap: 50px;
            }
        }
        @media (max-width: 768px) {
            .footer-grid-titan {
                grid-template-columns: 1fr;
                padding: 60px 0;
            }
            .footer-bottom-titan {
                flex-direction: column;
                gap: 20px;
                text-align: center;
                padding-bottom: 100px; /* Safe space for MobileNav */
            }
        }
      `}</style>
    </footer>
  );
}

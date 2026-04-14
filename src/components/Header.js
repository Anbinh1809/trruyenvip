'use client';

import NextLink from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useIsMounted } from '@/hooks/useIsMounted';
import LiveSearch from '@/components/LiveSearch';
import { Search, X, Menu } from 'lucide-react';

// Sub-components
import HeaderLogo from './layout/Header/HeaderLogo';
import UserActions from './layout/Header/UserActions';
import './layout/Header/Header.css';

export default function Header() {
  const { isAuthenticated, loading } = useAuth();
  const mounted = useIsMounted();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Titan Heartbeat: Extend session
    let heartbeatInterval;
    if (isAuthenticated) {
        heartbeatInterval = setInterval(() => {
            fetch('/api/auth/heartbeat', { method: 'POST' }).catch(() => {});
        }, 300000);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (isMenuOpen || isSearchOpen) {
        document.body.classList.add('no-scroll-titan');
    } else {
        document.body.classList.remove('no-scroll-titan');
    }
    return () => { document.body.classList.remove('no-scroll-titan'); };
  }, [isMenuOpen, isSearchOpen]);

  if (!mounted) return null;

  return (
    <header className={`titan-header ${isScrolled ? 'header-scrolled' : ''}`}>
      <div className="container">
        <div className="header-wrapper">
          <HeaderLogo />

          <nav className={`nav-titan ${isMenuOpen ? 'nav-open' : ''}`}>
            <div className="mobile-only-header">
                <HeaderLogo />
                <button className="titan-icon-btn" onClick={() => setIsMenuOpen(false)}>
                    <X size={20} />
                </button>
            </div>
            
            <div className="desktop-search-container">
                <LiveSearch />
            </div>
            
            <div className="nav-links">
                <NextLink href="/genres" className="nav-link-titan" onClick={() => setIsMenuOpen(false)}>Thể loại</NextLink>
                <NextLink href="/transfer" className="nav-link-titan" onClick={() => setIsMenuOpen(false)}>Dịch chuyển</NextLink>
                <NextLink href="/leaderboard" className="nav-link-titan" onClick={() => setIsMenuOpen(false)}>Xếp hạng</NextLink>
            </div>
          </nav>

          {/* MOBILE SEARCH OVERLAY (HUD) */}
          {isSearchOpen && (
              <div className="mobile-search-hud-industrial fade-in">
                  <div className="search-hud-header-industrial">
                      <button onClick={() => setIsSearchOpen(false)} className="titan-icon-btn">
                          <X size={20} />
                      </button>
                      <h3 className="search-hud-title-industrial">Tìm truyện</h3>
                  </div>
                  <LiveSearch onSelect={() => setIsSearchOpen(false)} />
              </div>
          )}

          <div className="header-actions">
            <button className="mobile-only titan-icon-btn" onClick={() => setIsSearchOpen(true)}>
              <Search size={18} />
            </button>

            <UserActions loading={loading} />

            <button className="mobile-only titan-icon-btn" onClick={() => setIsMenuOpen(true)}>
              <Menu size={20} />
            </button>
          </div>
        </div>
      </div>
      <style jsx>{`
        .mobile-search-hud-industrial {
            position: fixed;
            inset: 0;
            background: var(--bg-primary);
            z-index: 6000;
            padding: 20px;
            display: flex;
            flex-direction: column;
        }
        .search-hud-header-industrial {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 30px;
        }
        .search-hud-title-industrial {
            margin: 0;
            font-weight: 950;
            letter-spacing: -1px;
            font-size: 1.5rem;
            color: white;
        }
      `}</style>
    </header>
  );
}

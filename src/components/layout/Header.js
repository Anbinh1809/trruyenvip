'use client';

import NextLink from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMounted } from '@/hooks/useIsMounted';
import LiveSearch from '@/components/shared/LiveSearch';
import { Search, X, Menu } from 'lucide-react';

// Sub-components
import HeaderLogo from './layout/Header/HeaderLogo';
import UserActions from './layout/Header/UserActions';
import NotificationBell from '@/components/layout/NotificationBell';
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
        heartbeatInterval = setInterval(async () => {
            try {
                const res = await fetch('/api/auth/heartbeat', { method: 'POST' });
                if (res.status === 401) {
                    console.warn('[Titan] Session expired. Force logging out...');
                    // Note: In an ideal world, we'd call a logout function from useAuth
                    // But for now, we'll let the next restricted action handle it
                    // or force a refresh if necessary.
                }
            } catch (e) {}
        }, 300000); // 5 minutes
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
                <button 
                  className="titan-icon-btn" 
                  onClick={() => setIsMenuOpen(false)}
                  aria-label="Đóng menu điều hướng"
                >
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
              <div className="mobile-search-hud-industrial fade-in" role="dialog" aria-modal="true" aria-label="Tìm kiếm truyện">
                  <div className="search-hud-header-industrial">
                      <button 
                        onClick={() => setIsSearchOpen(false)} 
                        className="titan-icon-btn"
                        aria-label="Đóng tìm kiếm"
                      >
                          <X size={20} />
                      </button>
                      <h3 className="search-hud-title-industrial">Tìm truyện</h3>
                  </div>
                  <LiveSearch onSelect={() => setIsSearchOpen(false)} />
              </div>
          )}

          <div className="header-actions">
            <button 
              className="mobile-only titan-icon-btn" 
              onClick={() => setIsSearchOpen(true)}
              aria-label="Mở tìm kiếm"
            >
              <Search size={18} />
            </button>

            {isAuthenticated && <NotificationBell />}
            <UserActions loading={loading} />

            <button 
              className="mobile-only titan-icon-btn" 
              onClick={() => setIsMenuOpen(true)}
              aria-label="Mở menu điều hướng"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}


'use client';

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
    window.addEventListener('scroll', handleScroll);

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
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  return (
    <header className={`titan-header ${isScrolled ? 'header-scrolled' : ''}`}>
      <div className="container">
        <div className="header-wrapper">
          <HeaderLogo />

          <nav className={`nav-titan ${isMenuOpen ? 'nav-open' : ''}`}>
            <div className="mobile-only-header" style={{ display: isMenuOpen ? 'flex' : 'none', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '30px' }}>
                <HeaderLogo />
                <button className="close-btn" onClick={() => setIsMenuOpen(false)}><X size={24} /></button>
            </div>
            
            <div className="desktop-search-container desktop-only">
                <LiveSearch />
            </div>
            
            <div className="nav-links">
                <Link href="/genres" className="nav-link-titan" onClick={() => setIsMenuOpen(false)}>Thể loại</Link>
                <Link href="/transfer" className="nav-link-titan" onClick={() => setIsMenuOpen(false)}>Dịch chuyển</Link>
                <Link href="/leaderboard" className="nav-link-titan" onClick={() => setIsMenuOpen(false)}>Xếp hạng</Link>
            </div>
          </nav>

          {isSearchOpen && (
              <div className="mobile-search-hud fade-in">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                      <button onClick={() => setIsSearchOpen(false)} className="titan-icon-btn"><X size={24} /></button>
                      <h3 style={{ margin: 0, fontWeight: 950, letterSpacing: '-1px' }}>Tìm kiếm</h3>
                  </div>
                  <LiveSearch onSelect={() => setIsSearchOpen(false)} />
              </div>
          )}

          <div className="header-actions">
            <button className="search-toggle-mobile mobile-only titan-icon-btn" onClick={() => setIsSearchOpen(true)}>
              <Search size={18} />
            </button>

            <UserActions loading={loading} />

            <button className="mobile-menu-btn desktop-hide titan-icon-btn" onClick={() => setIsMenuOpen(true)}>
              <Menu size={20} color="white" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

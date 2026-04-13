'use client';

import { useTheme } from '@/context/ThemeContext';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useEngagement } from '@/context/EngagementContext';
import { useAuth } from '@/context/AuthContext';
import LiveSearch from './LiveSearch';
import { Search, Coins, Trophy, Gem, X, Menu, Settings, LogOut, User, Sun, Moon } from 'lucide-react';



export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const engagement = useEngagement() || {};
  const { vipCoins = 0, level = 1, rankTitle = 'Phàm Nhân', xpProgress = 0 } = engagement;
  const { user, isAuthenticated, logout, loading } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

    // TITAN HEARTBEAT: Extend session every 5 minutes if authenticated
    let heartbeatInterval;
    if (isAuthenticated) {
        heartbeatInterval = setInterval(() => {
            fetch('/api/auth/heartbeat', { method: 'POST' }).catch(() => {});
        }, 300000); // 5 mins
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
        document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  return (
    <header className={`titan-header glass-nav ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <div className="header-wrapper">
          <Link href="/" className="logo">
            <span>Truyen</span>
            <span style={{ color: 'var(--accent)' }}>Vip</span>
          </Link>

          <nav className={`nav-titan ${isMenuOpen ? 'nav-open' : ''}`}>
            <div className="mobile-only-header" style={{ display: isMenuOpen ? 'flex' : 'none', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '30px' }}>
                <span className="logo">Truyen<span style={{ color: 'var(--accent)' }}>Vip</span></span>
                <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }} onClick={() => setIsMenuOpen(false)}><X size={24} /></button>
            </div>
            
            {mounted && isAuthenticated && isMenuOpen && (
                <div style={{ width: '100%', padding: '15px', borderRadius: '16px', marginBottom: '20px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{user?.username}</span>
                        <span style={{ fontSize: '0.6rem', background: 'var(--accent)', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>{user?.role === 'admin' ? 'ADMIN' : 'USER'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.85rem', fontWeight: 700 }}>
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '4px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Coins size={14} color="var(--nebula-orange)" /> 
                            {new Intl.NumberFormat().format(vipCoins)}
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '4px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Trophy size={14} color="var(--nebula-blue)" /> 
                            Lv.{level} - {rankTitle}
                        </div>
                    </div>
                </div>
            )}

            <div className="desktop-search-container desktop-only" style={{ flex: 1, maxWidth: '550px', margin: '0 40px' }}>
                <LiveSearch />
            </div>
            <Link href="/genres" className="nav-link-titan" onClick={() => setIsMenuOpen(false)}>Thể loại</Link>
            <Link href="/transfer" className="nav-link-titan" onClick={() => setIsMenuOpen(false)}>Dịch chuyển</Link>
            <Link href="/leaderboard" className="nav-link-titan" onClick={() => setIsMenuOpen(false)}>Xếp hạng</Link>
          </nav>

          {/* MOBILE SEARCH HUD */}
          {isSearchOpen && (
              <div className="mobile-search-hud fade-in" style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.98)', backdropFilter: 'blur(30px)', zIndex: 30005, padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                      <button onClick={() => setIsSearchOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '10px', borderRadius: '50%' }}><X size={24} /></button>
                      <h3 style={{ margin: 0, fontWeight: 950, letterSpacing: '-1px' }}>Tìm Kiếm Tuyệt Đỉnh</h3>
                  </div>
                  <LiveSearch onSelect={() => setIsSearchOpen(false)} />
              </div>
          )}

          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              className="search-toggle-mobile mobile-only" 
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', flexShrink: 0 }} 
              onClick={() => setIsSearchOpen(true)}
            >
              <Search size={20} />
            </button>

            {!loading && !isAuthenticated && mounted ? (
               <Link href="/auth/login" className="btn btn-primary login-btn">
                 {mounted && typeof window !== 'undefined' && window.innerWidth < 600 ? 'Đăng nhập' : 'Đăng nhập'}
               </Link>
            ) : (
                mounted && isAuthenticated ? (
                    <div className="user-profile-titan desktop-only">
                        <div className="profile-trigger" onClick={() => {}}>
                            <Link href="/rewards" className="coin-display">
                                <Coins size={14} /> {new Intl.NumberFormat().format(vipCoins)} <span className="coin-label">VipCoins</span>
                            </Link>
                            <div className="level-display">
                                <span className="level-accent">Cấp {level}</span> {' // '} {rankTitle}
                            </div>
                        </div>
                        
                        <div className="profile-dropdown-titan glass">
                            <div className="profile-header">
                                <div className="avatar-wrapper">
                                    <img 
                                        src={`https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user?.username || 'Guest')}&backgroundColor=transparent`} 
                                        alt="Avatar" 
                                        className="avatar-img"
                                    />
                                </div>
                                <div className="profile-meta">
                                    <p className="username">{user?.username || 'Người dùng'}</p>
                                    <p className="role">{user?.role === 'admin' ? 'Quản trị viên' : 'Độc giả VIP'}</p>
                                </div>
                            </div>
                            <div className="dropdown-divider" />
                            <Link href="/profile" className="dropdown-item">Hồ sơ cá nhân</Link>
                            <Link href="/favorites" className="dropdown-item">Truyện yêu thích</Link>
                            {user?.role === 'admin' && (
                                <Link href="/admin" className="dropdown-item admin-link">Bảng điều khiển Admin</Link>
                            )}
                            <div className="dropdown-divider" />
                            <button onClick={logout} className="dropdown-item logout-btn">Đăng xuất</button>
                        </div>
                    </div>
                ) : <div style={{ width: 100, opacity: 0 }} />
            )}

            <button 
              className="theme-toggle desktop-only" 
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', width: '45px', height: '45px', borderRadius: '50%', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }} 
              onClick={toggleTheme}
            >
              {mounted ? (theme === 'light' ? <Moon size={20} /> : <Sun size={20} />) : <div style={{ width: 20 }} />}
            </button>
            <button 
              className="mobile-menu-btn desktop-hide" 
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', width: '45px', height: '45px', borderRadius: '12px', cursor: 'pointer', flexShrink: 0 }} 
              onClick={() => setIsMenuOpen(true)}
            >
              <div style={{ width: '20px', height: '2px', background: 'white', margin: '0 auto', position: 'relative' }}>
                  <div style={{ position: 'absolute', width: '100%', height: '2px', background: 'white', top: '-6px' }} />
                  <div style={{ position: 'absolute', width: '100%', height: '2px', background: 'white', bottom: '-6px' }} />
              </div>
            </button>
          </div>
        </div>
      </div>
      <style jsx>{`
        .profile-trigger {
            text-align: right;
            cursor: pointer;
        }
        .coin-display {
            display: flex;
            align-items: center;
            gap: 5px;
            margin-bottom: 2px;
            color: var(--nebula-orange);
            font-size: 0.85rem;
            font-weight: 800;
            text-decoration: none;
        }
        .coin-label {
            font-size: 0.7rem;
            color: rgba(255,255,255,0.4);
        }
        .level-display {
            font-size: 0.75rem;
            font-weight: 700;
            color: rgba(255,255,255,0.6);
        }
        .level-accent {
            color: var(--accent);
        }
        .profile-header {
            display: flex;
            gap: 15px;
            padding: 15px;
        }
        .avatar-wrapper {
            width: 45px;
            height: 45px;
            border-radius: 50%;
            background: rgba(255,255,255,0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }
        .avatar-img {
            width: 80%;
            height: 80%;
            object-fit: contain;
        }
        .username {
            font-weight: 800;
            color: white;
            font-size: 0.95rem;
            margin: 0;
        }
        .role {
            font-size: 0.75rem;
            color: rgba(255,255,255,0.4);
            font-weight: 600;
            margin: 0;
        }
        .dropdown-divider {
            height: 1px;
            background: rgba(255,255,255,0.05);
            margin: 5px 0;
        }
        .dropdown-item {
            display: block;
            padding: 12px 15px;
            color: rgba(255,255,255,0.8);
            font-size: 0.85rem;
            font-weight: 700;
            text-decoration: none;
            transition: 0.2s;
        }
        .dropdown-item:hover {
            background: rgba(255,255,255,0.03);
            color: white;
        }
        .admin-link {
            color: var(--accent);
            font-weight: 800;
        }
        .logout-btn {
            width: 100%;
            text-align: left;
            background: none;
            border: none;
            color: #ff3e3e;
            cursor: pointer;
        }
        .logout-btn:hover {
            background: rgba(255, 62, 62, 0.05);
        }
      `}</style>
    </header>
  );
}

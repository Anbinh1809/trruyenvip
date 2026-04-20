'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    User, 
    LogOut, 
    Heart, 
    Award, 
    Menu,
    X,
    LayoutDashboard,
    Zap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEngagement } from '@/contexts/EngagementContext';
import LiveSearch from '@/components/shared/LiveSearch';

export default function Header() {
    const { user, isAuthenticated, logout } = useAuth() || {};
    const { vipCoins, level, rankTitle, mounted } = useEngagement();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
    const closeMobileMenu = () => setMobileMenuOpen(false);

    return (
        <header className={`glass-nav ${scrolled ? 'scrolled' : ''}`}>
            <div className="header-wrapper container">
                <div className="header-left">
                    <Link href="/" className="logo" onClick={closeMobileMenu}>
                        <div className="logo-icon-titan">
                            <Zap size={24} fill="var(--accent)" strokeWidth={1.5} />
                        </div>
                        TRUYEN<span className="accent">VIP</span>
                    </Link>

                    <nav className={`nav-titan ${mobileMenuOpen ? 'nav-open' : ''}`}>
                        <Link href="/genres" className={`nav-link-titan ${pathname === '/genres' ? 'active' : ''}`} onClick={closeMobileMenu}>THỂ LOẠI</Link>
                        <Link href="/leaderboard" className={`nav-link-titan ${pathname === '/leaderboard' ? 'active' : ''}`} onClick={closeMobileMenu}>XẾP HẠNG</Link>
                        <Link href="/history" className={`nav-link-titan ${pathname === '/history' ? 'active' : ''}`} onClick={closeMobileMenu}>LỊCH SỬ</Link>
                    </nav>
                </div>

                <div className="header-actions">
                    <div className="desktop-search-container">
                        <LiveSearch onSelect={closeMobileMenu} />
                    </div>

                    <div className="user-interactions">
                        {isAuthenticated ? (
                            <div className="user-profile-titan">
                                <div className="profile-trigger-titan">
                                    {user?.avatar ? (
                                        <img src={user.avatar} alt={user.username} className="avatar-img-tag" />
                                    ) : (
                                        <div className="avatar-placeholder-titan">
                                            {user?.username?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="profile-indicator-titan" />
                                </div>
                                
                                <div className="profile-dropdown-titan">
                                    <div className="dropdown-header-titan">
                                        <div className="user-meta-titan">
                                            <div className="user-name-titan truncate-1">{user?.username}</div>
                                            <div className="rank-badge-titan-mini">{rankTitle} - Cấp {level}</div>
                                        </div>
                                        <div className="coins-pill-titan">
                                            Số dư: {mounted ? vipCoins.toLocaleString() : '...'}
                                        </div>
                                    </div>
                                    <div className="dropdown-divider-titan" />
                                    <div className="dropdown-links-titan">
                                        <Link href="/profile" className="dropdown-link-node" onClick={closeMobileMenu}>
                                            <User size={18} /> Hồ sơ cá nhân
                                        </Link>
                                        <Link href="/favorites" className="dropdown-link-node" onClick={closeMobileMenu}>
                                            <Heart size={18} /> Truyện yêu thích
                                        </Link>
                                        <Link href="/rewards" className="dropdown-link-node" onClick={closeMobileMenu}>
                                            <Award size={18} /> Đổi phần thưởng
                                        </Link>
                                        {user?.role === 'admin' && (
                                            <Link href="/admin" className="dropdown-link-node admin-link" onClick={closeMobileMenu}>
                                                <LayoutDashboard size={18} /> Bảng điều khiển
                                            </Link>
                                        )}
                                        <div className="dropdown-divider-titan" />
                                        <button onClick={() => { logout(); closeMobileMenu(); }} className="dropdown-link-node logout-node">
                                            <LogOut size={18} /> Đăng xuất
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <Link href="/auth/login" className="btn-auth-titan" onClick={closeMobileMenu}>
                                <User size={18} /> <span>ĐĂNG NHẬP</span>
                            </Link>
                        )}

                        <button className="mobile-menu-btn desktop-hide" onClick={toggleMobileMenu}>
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}

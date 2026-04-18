'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMounted } from '@/hooks/useIsMounted';
import { Home, LayoutGrid, Bookmark, User, LogIn } from 'lucide-react';

export default function MobileNav() {
    const pathname = usePathname();
    const { isAuthenticated, loading } = useAuth();
    const mounted = useIsMounted();

    if (!mounted) return null;


    const navItems = [
        { label: 'Trang chủ', icon: Home, path: '/' },
        { label: 'Thể loại', icon: LayoutGrid, path: '/genres' },
        { label: 'Yêu thích', icon: Bookmark, path: '/favorites' },
        { 
            label: loading ? '...' : (isAuthenticated ? 'Cá nhân' : 'Đăng nhập'), 
            icon: loading ? User : (isAuthenticated ? User : LogIn), 
            path: loading ? '#' : (isAuthenticated ? '/profile' : '/auth/login') 
        }
    ];

    return (
        <nav className="titan-mobile-nav">
            <div className="titan-mobile-nav-container">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.path;
                    return (
                        <Link 
                            key={item.label} 
                            href={item.path} 
                            className={`titan-mobile-nav-item ${isActive ? 'active' : ''}`}
                        >
                            <span className="titan-mobile-nav-icon">
                                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                            </span>
                            <span className="titan-mobile-nav-label">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    );
}



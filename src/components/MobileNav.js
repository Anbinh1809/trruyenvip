'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';

export default function MobileNav() {
    const pathname = usePathname();
    const { isAuthenticated } = useAuth();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const navItems = [
        { label: 'Trang chủ', icon: '🏠', path: '/' },
        { label: 'Thể loại', icon: '📚', path: '/genres' },
        { label: 'Yêu thích', icon: '🔖', path: '/favorites' },
        { label: isAuthenticated ? 'Cá nhân' : 'Đăng nhập', icon: '👤', path: isAuthenticated ? '/profile' : '/auth/login' }
    ];

    return (
        <nav className="titan-mobile-nav">
            <div className="titan-mobile-nav-container">
                {navItems.map((item) => (
                    <Link 
                        key={item.label} 
                        href={item.path} 
                        className={`titan-mobile-nav-item ${pathname === item.path ? 'active' : ''}`}
                    >
                        <span className="titan-mobile-nav-icon">{item.icon}</span>
                        <span className="titan-mobile-nav-label">{item.label}</span>
                    </Link>
                ))}
            </div>
        </nav>
    );
}

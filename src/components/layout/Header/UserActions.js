'use client';

import NextLink from 'next/link';
import { User, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useIsMounted } from '@/hooks/useIsMounted';

export default function UserActions({ loading }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const mounted = useIsMounted();

  if (!mounted) return <div style={{ width: 100, opacity: 0 }} />;

  return (
    <div className="header-actions-group">
      {!loading && !isAuthenticated ? (
         <NextLink href="/auth/login" className="btn btn-primary login-btn" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
           Đăng nhập
         </NextLink>
      ) : (
          isAuthenticated && (
              <div className="user-profile-titan desktop-only">
                  <div className="profile-trigger">
                      <User size={16} />
                      <span className="username-text" style={{ fontWeight: 800, fontSize: '0.85rem' }}>{user?.username || 'Tài khoản'}</span>
                  </div>
                  
                  <div className="profile-dropdown-titan glass-titan">
                      <div style={{ padding: '10px 15px', fontSize: '0.65rem', fontWeight: 900, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px' }}>Tài khoản</div>
                      <NextLink href="/profile" className="dropdown-item">Hồ sơ cá nhân</NextLink>
                      <NextLink href="/favorites" className="dropdown-item">Truyện yêu thích</NextLink>
                      {user?.role === 'admin' && (
                          <NextLink href="/admin" className="dropdown-item admin-link">Bảng điều khiển Admin</NextLink>
                      )}
                      <div className="dropdown-divider" />
                      <button onClick={logout} className="dropdown-item logout-btn">Đăng xuất</button>
                  </div>
              </div>
          )
      )}

      <button className="theme-toggle desktop-only titan-icon-btn" onClick={toggleTheme}>
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>
    </div>
  );
}

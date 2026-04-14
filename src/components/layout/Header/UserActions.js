'use client';

import Link from 'next/link';
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
    <div className="header-actions-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      {!loading && !isAuthenticated ? (
         <Link href="/auth/login" className="btn btn-primary login-btn">
           Đăng nhập
         </Link>
      ) : (
          isAuthenticated && (
              <div className="user-profile-titan desktop-only">
                  <div className="profile-trigger" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', cursor: 'pointer' }}>
                      <User size={16} />
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{user?.username || 'Tài khoản'}</span>
                  </div>
                  
                  <div className="profile-dropdown-titan glass">
                      <Link href="/profile" className="dropdown-item">Hồ sơ cá nhân</Link>
                      <Link href="/favorites" className="dropdown-item">Truyện yêu thích</Link>
                      {user?.role === 'admin' && (
                          <Link href="/admin" className="dropdown-item admin-link">Bảng điều khiển Admin</Link>
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

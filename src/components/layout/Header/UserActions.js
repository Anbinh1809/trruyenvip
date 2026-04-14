'use client';

import NextLink from 'next/link';
import { User, LogOut, Sun, Moon, ChevronDown, UserCircle, Heart, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useIsMounted } from '@/hooks/useIsMounted';

export default function UserActions({ loading }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const mounted = useIsMounted();

  if (!mounted) return <div className="skeleton-user-actions skeleton-shimmer" />;

  return (
    <div className="header-actions-group">
      {/* Auth section */}
      {!loading && !isAuthenticated ? (
        <NextLink href="/auth/login" className="btn btn-primary login-btn-titan">
          Đăng nhập
        </NextLink>
      ) : (
        isAuthenticated && (
          <div className="user-profile-titan">
            <div className="profile-trigger" role="button" tabIndex={0} aria-haspopup="true" aria-label="Tài khoản">
              <UserCircle size={20} className="profile-icon-titan" />
              <span className="username-text desktop-only">
                {user?.username?.split(' ')[0] || 'Tài khoản'}
              </span>
              <ChevronDown size={14} className="desktop-only trigger-arrow" />
            </div>

            <div className="profile-dropdown-titan">
              <div className="user-info-plate">
                <div className="user-member-label">Hội viên</div>
                <div className="user-display-name truncate-1">{user?.username}</div>
              </div>

              <NextLink href="/profile" className="dropdown-item">
                <User size={16} /> Hồ sơ cá nhân
              </NextLink>
              <NextLink href="/favorites" className="dropdown-item">
                <Heart size={16} /> Truyện yêu thích
              </NextLink>
              {user?.role === 'admin' && (
                <NextLink href="/admin" className="dropdown-item admin-link">
                  <LayoutDashboard size={16} /> Bảng điều khiển
                </NextLink>
              )}
              <div className="dropdown-divider" />
              <button onClick={logout} className="dropdown-item logout-btn">
                <LogOut size={16} /> Đăng xuất
              </button>
            </div>
          </div>
        )
      )}

      {/* Theme toggle — visible on all screen sizes */}
      <button
        className="titan-icon-btn"
        onClick={toggleTheme}
        title={theme === 'light' ? 'Chuyển sang tối' : 'Chuyển sang sáng'}
        aria-label={theme === 'light' ? 'Chuyển sang chế độ tối' : 'Chuyển sang chế độ sáng'}
      >
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>
    </div>
  );
}

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

  if (!mounted) return <div className="skeleton-industrial skeleton-user-actions" />;

  return (
    <div className="header-actions-group">
      {!loading && !isAuthenticated ? (
         <NextLink href="/auth/login" className="btn btn-primary login-btn-titan">
           Đăng nhập
         </NextLink>
      ) : (
          isAuthenticated && (
              <div className="user-profile-titan">
                  <div className="profile-trigger">
                      <UserCircle size={20} className="profile-icon-titan" />
                      <span className="username-text desktop-only">
                          {user?.username?.split(' ')[0] || 'Tài khoản'}
                      </span>
                      <ChevronDown size={14} className="desktop-only trigger-arrow" />
                  </div>
                  
                  <div className="profile-dropdown-titan glass-titan">
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

      <button className="titan-icon-btn desktop-only" onClick={toggleTheme} title="Đổi giao diện">
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>

      <style jsx>{`
        .header-actions-group {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .skeleton-user-actions {
            width: 100px;
            height: 40px;
            border-radius: 10px;
        }
        .login-btn-titan {
            padding: 10px 24px;
            font-size: 0.85rem;
            font-weight: 850;
            letter-spacing: 0.5px;
        }
        .profile-icon-titan {
            color: var(--accent);
            stroke-width: 2.5px;
        }
        .username-text {
            font-weight: 950;
            font-size: 0.85rem;
            letter-spacing: -0.3px;
        }
        .trigger-arrow {
            opacity: 0.5;
            transition: transform 0.3s;
        }
        .user-profile-titan:hover .trigger-arrow {
            transform: rotate(180deg);
        }
        .logout-btn {
            display: flex;
            align-items: center;
            gap: 10px;
            width: 100%;
            border: none;
            background: none;
            cursor: pointer;
            text-align: left;
        }
        .dropdown-divider {
            height: 1px;
            background: rgba(255, 255, 255, 0.05);
            margin: 5px 0;
        }
      `}</style>
    </div>
  );
}

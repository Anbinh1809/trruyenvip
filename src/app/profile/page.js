'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { useEngagement } from '@/context/EngagementContext';
import { useToast } from '@/components/ToastProvider';
import Link from 'next/link';
import { User, Shield, Coins, Sparkles, Activity, Heart, History, LogOut, ShieldCheck, AlertOctagon, ChevronRight } from 'lucide-react';

export default function ProfilePage() {
  const { user, isAuthenticated, logout, loading, refreshUser } = useAuth();
  const engagement = useEngagement() || {};
  const { vipCoins = 0, level = 1, rankTitle = 'Phàm Nhân', xp = 0, xpProgress = 0 } = engagement;
  const { addToast } = useToast();
  const [avatarUrl, setAvatarUrl] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user?.avatar) {
        const timer = setTimeout(() => setAvatarUrl(user.avatar), 0);
        return () => clearTimeout(timer);
    }
  }, [user?.avatar]);

  const handleUpdateAvatar = async () => {
    if (!addToast) return;
    setUpdating(true);
    try {
        const res = await fetch('/api/user/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ avatar: avatarUrl })
        });
        if (res.ok) {
            await refreshUser();
            addToast('Đã cập nhật ảnh đại diện!', 'success');
        } else {
            addToast('Lỗi cập nhật! Vui lòng thử lại.', 'error');
        }
    } catch (e) {
        addToast('Lỗi kết nối máy chủ.', 'error');
    }
    setUpdating(false);
  };

  if (loading) return null;

  if (!isAuthenticated) {
    return (
        <main className="main-wrapper titan-bg">
            <Header />
            <div className="container auth-required-industrial fade-up">
                <div className="center-icon-titan">
                    <AlertOctagon size={80} color="var(--accent)" />
                </div>
                <h1 className="auth-required-title">Yêu cầu đăng nhập</h1>
                <p className="auth-required-subtitle">Cần đăng nhập để xem thông tin cá nhân và quản lý tài khoản của bạn.</p>
                <Link href="/auth/login" className="btn btn-primary login-trigger-titan">ĐĂNG NHẬP NGAY</Link>
            </div>
            <Footer />
            <style jsx>{`
                .center-icon-titan { display: flex; justify-content: center; margin-bottom: 30px; }
                .auth-required-subtitle { color: rgba(255,255,255,0.4); margin-bottom: 40px; font-weight: 700; font-size: 1.1rem; }
                .login-trigger-titan { padding: 18px 60px; font-weight: 950; letter-spacing: 1px; }
            `}</style>
        </main>
    );
  }

  return (
    <main className="main-wrapper titan-bg">
      <Header />
      
      <div className="container profile-container fade-in">
        <section className="profile-card-industrial">
          <div className="avatar-wrapper-titan">
            {user.avatar ? (
                <img src={user.avatar} alt="Avatar" className="avatar-img-industrial" />
            ) : (
                <User size={60} color="rgba(255,255,255,0.2)" />
            )}
          </div>
          <h1 className="profile-name-industrial">{user.username}</h1>
          <p className="profile-role-badge">
            {user.role === 'admin' ? <><Shield size={16} /> QUẢN TRỊ VIÊN</> : <><User size={16} /> ĐỘC GIẢ VIP</>}
          </p>
          
          <div className="avatar-form-industrial">
            <input 
                type="text" 
                placeholder="Dán link ảnh đại diện mới..." 
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="input-titan-profile"
            />
            <button 
                onClick={handleUpdateAvatar} 
                className="btn btn-primary avatar-update-btn" 
                disabled={updating || !avatarUrl.trim()}
            >
                {updating ? '...' : 'CẬP NHẬT'}
            </button>
          </div>
          {user.role === 'admin' && (
              <Link href="/admin" className="btn btn-outline admin-portal-btn-titan">
                <ShieldCheck size={18} /> BẢNG ĐIỀU KHIỂN QUẢN TRỊ
              </Link>
          )}
        </section>

        <div className="stat-grid-profile">
            <div className="stat-card-profile">
                <div className="stat-icon-box">
                    <Coins size={32} color="#fbbf24" />
                </div>
                <div className="stat-label-profile">VipCoins</div>
                <div className="stat-value-profile">{new Intl.NumberFormat().format(vipCoins)}</div>
            </div>
            <div className="stat-card-profile">
                <div className="stat-icon-box">
                    <Sparkles size={32} color="var(--accent)" />
                </div>
                <div className="stat-label-profile">Cấp Độ</div>
                <div className="stat-value-profile">{level}</div>
            </div>
            <div className="stat-card-profile">
                <div className="stat-icon-box">
                    <Activity size={32} color="#60a5fa" />
                </div>
                <div className="stat-label-profile">Hạng</div>
                <div className="stat-value-profile accent-rank">{rankTitle}</div>
            </div>
        </div>

        <section className="xp-progress-section shadow-titan">
            <div className="xp-header-profile">
                <span className="xp-label-main">TIẾN ĐỘ CẤP BẬC</span>
                <span className="xp-percent-tag">{Math.floor(xpProgress)}%</span>
            </div>
            <div className="xp-track-industrial">
                <div className="xp-fill-industrial" style={{ '--progress': `${xpProgress}%` }} />
            </div>
            <p className="xp-footer-hint">
                Cần thêm <strong>{new Intl.NumberFormat().format((level * 100) - xp)} XP</strong> để thăng cấp tiếp theo.
            </p>
        </section>

        <div className="profile-actions-list">
            <Link href="/favorites" className="profile-action-node">
                <span className="node-left-industrial"><Heart size={20} color="var(--accent)" /> TRUYỆN YÊU THÍCH</span>
                <ChevronRight size={18} className="node-arrow" />
            </Link>
            <Link href="/history" className="profile-action-node">
                <span className="node-left-industrial"><History size={20} color="#60a5fa" /> LỊCH SỬ ĐỌC TRUYỆN</span>
                <ChevronRight size={18} className="node-arrow" />
            </Link>
            <button onClick={logout} className="logout-btn-industrial">
                <LogOut size={20} /> ĐĂNG XUẤT TÀI KHOẢN
            </button>
        </div>
      </div>
      <Footer />
      <style jsx>{`
        .avatar-update-btn { padding: 0 35px; font-weight: 950; font-size: 0.85rem; }
        .admin-portal-btn-titan { margin-top: 30px; padding: 14px 40px; font-weight: 950; letter-spacing: 1px; display: inline-flex; gap: 12px; }
        .accent-rank { color: var(--accent) !important; font-size: 1.4rem !important; }
        .node-arrow { opacity: 0.3; transition: transform 0.3s; }
        .profile-action-node:hover .node-arrow { opacity: 1; transform: translateX(5px); }
        .xp-footer-hint strong { color: white; }
      `}</style>
    </main>
  );
}

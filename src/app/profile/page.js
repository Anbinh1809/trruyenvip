'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useEngagement } from '@/contexts/EngagementContext';
import { useToast } from '@/components/widgets/ToastProvider';
import Link from 'next/link';
import { User, Shield, Coins, Sparkles, Activity, Heart, History, LogOut, ShieldCheck, AlertOctagon, ChevronRight } from 'lucide-react';

export default function ProfilePage() {
  const { user, isAuthenticated, logout, loading, refreshUser } = useAuth() || {};
  const engagement = useEngagement() || {};
  const { vipCoins = 0, level = 1, rankTitle = 'Phàm Nhân', xp = 0, xpProgress = 0 } = engagement;
  const { addToast } = useToast();
  const [avatarUrl, setAvatarUrl] = useState('');
  const [updating, setUpdating] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user?.avatar) {
        const timer = setTimeout(() => setAvatarUrl(user.avatar), 0);
        return () => clearTimeout(timer);
    }
  }, [user?.avatar]);

  const handleUpdateAvatar = async (newUrl) => {
    if (!addToast) return;
    setUpdating(true);
    try {
        const res = await fetch('/api/user/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ avatar: newUrl || avatarUrl })
        });
        if (res.ok) {
            await refreshUser();
            addToast('Đã cập nhật ảnh đại diện thành công!', 'success');
        } else {
            addToast('Lỗi cập nhật! Vui lòng thử lại.', 'error');
        }
    } catch (e) {
        addToast('Lỗi kết nối máy chủ.', 'error');
    }
    setUpdating(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        addToast('Ảnh quá lớn. Vui lòng chọn ảnh dưới 2MB.', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
        const base64String = reader.result;
        setAvatarUrl(base64String);
        handleUpdateAvatar(base64String);
    };
    reader.readAsDataURL(file);
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
            <style>{`
                .center-icon-titan { display: flex; justify-content: center; margin-bottom: 30px; }
                .auth-required-subtitle { color: var(--text-muted); margin-bottom: 40px; font-weight: 700; font-size: 1.1rem; }
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
                type="file" 
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
            />
            <button 
                onClick={() => fileInputRef.current?.click()} 
                className="btn btn-primary avatar-update-btn" 
                disabled={updating}
            >
                {updating ? 'ĐANG TẢI LÊN...' : 'ĐỔI ẢNH ĐẠI DIỆN'}
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
      <style>{`
        .profile-container {
            max-width: 900px;
            margin: 60px auto 100px;
            padding: 0 20px;
            display: flex;
            flex-direction: column;
            gap: 40px;
        }

        .profile-card-industrial {
            background: var(--nebula-glass);
            border: 1px solid var(--glass-border);
            border-radius: 24px;
            padding: 50px 30px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            position: relative;
            overflow: hidden;
            box-shadow: 0 20px 50px rgba(0,0,0,0.3);
        }

        .profile-card-industrial::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 140px;
            background: linear-gradient(135deg, rgba(var(--accent-rgb), 0.2), transparent);
            z-index: 0;
        }

        .avatar-wrapper-titan {
            position: relative;
            z-index: 1;
            width: 130px;
            height: 130px;
            border-radius: 50%;
            background: var(--glass-bg);
            border: 4px solid var(--bg-dark);
            box-shadow: 0 0 0 2px var(--accent), 0 10px 30px rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            margin-bottom: 25px;
        }

        .avatar-img-industrial {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .profile-name-industrial {
            font-size: 2.2rem;
            font-weight: 950;
            color: var(--text-primary);
            letter-spacing: -0.5px;
            margin-bottom: 10px;
            z-index: 1;
        }

        .profile-role-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(var(--accent-rgb), 0.15);
            color: var(--accent);
            padding: 8px 16px;
            border-radius: 30px;
            font-size: 0.85rem;
            font-weight: 800;
            letter-spacing: 1px;
            z-index: 1;
            border: 1px solid rgba(var(--accent-rgb), 0.3);
        }

        .avatar-form-industrial {
            display: flex;
            justify-content: center;
            margin-top: 25px;
            z-index: 1;
            width: 100%;
        }

        .avatar-update-btn { 
            padding: 14px 40px; 
            font-weight: 950; 
            font-size: 0.9rem;
            border-radius: 30px;
            white-space: nowrap;
            letter-spacing: 1px;
            box-shadow: 0 10px 20px rgba(var(--accent-rgb), 0.3);
            transition: all 0.3s;
        }

        .avatar-update-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 15px 30px rgba(var(--accent-rgb), 0.5);
        }

        .admin-portal-btn-titan { 
            margin-top: 30px; 
            padding: 14px 40px; 
            font-weight: 950; 
            letter-spacing: 1px; 
            display: inline-flex; 
            align-items: center;
            gap: 12px;
            z-index: 1;
        }

        .stat-grid-profile {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
        }

        .stat-card-profile {
            background: var(--nebula-glass);
            border: 1px solid var(--glass-border);
            border-radius: 20px;
            padding: 30px 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            transition: transform 0.3s, box-shadow 0.3s;
        }

        .stat-card-profile:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 40px rgba(0,0,0,0.4);
            border-color: rgba(255,255,255,0.15);
        }

        .stat-icon-box {
            width: 64px;
            height: 64px;
            border-radius: 18px;
            background: var(--glass-bg);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
            border: 1px solid var(--glass-border);
        }

        .stat-label-profile {
            font-size: 0.9rem;
            font-weight: 700;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
        }

        .stat-value-profile {
            font-size: 2.2rem;
            font-weight: 950;
            color: var(--text-primary);
            line-height: 1;
        }

        .accent-rank { 
            color: var(--accent) !important; 
            font-size: 1.6rem !important; 
            background: linear-gradient(90deg, #ff4b4b, var(--accent));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .xp-progress-section {
            background: var(--nebula-glass);
            border: 1px solid var(--glass-border);
            border-radius: 20px;
            padding: 35px;
        }

        .xp-header-profile {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-bottom: 20px;
        }

        .xp-label-main {
            font-size: 1.1rem;
            font-weight: 900;
            color: var(--text-primary);
            letter-spacing: 1px;
        }

        .xp-percent-tag {
            font-size: 1.8rem;
            font-weight: 950;
            color: var(--accent);
            line-height: 1;
        }

        .xp-track-industrial {
            width: 100%;
            height: 16px;
            background: rgba(0,0,0,0.4);
            border-radius: 30px;
            overflow: hidden;
            border: 1px solid var(--glass-border);
            margin-bottom: 20px;
            box-shadow: inset 0 2px 5px rgba(0,0,0,0.5);
        }

        .xp-fill-industrial {
            height: 100%;
            width: var(--progress);
            background: linear-gradient(90deg, #ff4b4b, var(--accent));
            border-radius: 30px;
            box-shadow: 0 0 20px rgba(var(--accent-rgb), 0.5);
            transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
        }

        .xp-fill-industrial::after {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            animation: shimmer 2s infinite linear;
        }

        .xp-footer-hint {
            color: var(--text-muted);
            font-size: 0.95rem;
            text-align: center;
        }
        .xp-footer-hint strong { color: var(--text-primary); }

        .profile-actions-list {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }

        .profile-action-node {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: var(--nebula-glass);
            border: 1px solid var(--glass-border);
            padding: 24px 30px;
            border-radius: 20px;
            transition: all 0.3s;
            cursor: pointer;
        }

        .profile-action-node:hover {
            background: var(--glass-bg);
            border-color: rgba(255,255,255,0.15);
            transform: translateX(10px);
        }

        .node-left-industrial {
            display: flex;
            align-items: center;
            gap: 15px;
            font-weight: 800;
            font-size: 1.1rem;
            color: var(--text-primary);
            letter-spacing: 1px;
        }

        .node-arrow { 
            opacity: 0.3; 
            transition: transform 0.3s, opacity 0.3s; 
            color: var(--text-primary);
        }

        .profile-action-node:hover .node-arrow { 
            opacity: 1; 
            transform: translateX(5px); 
            color: var(--accent);
        }

        .logout-btn-industrial {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.2);
            color: #ef4444;
            padding: 20px;
            border-radius: 20px;
            font-weight: 900;
            font-size: 1rem;
            letter-spacing: 1px;
            cursor: pointer;
            transition: all 0.3s;
            margin-top: 10px;
        }

        .logout-btn-industrial:hover {
            background: #ef4444;
            color: #fff;
            transform: translateY(-3px);
            box-shadow: 0 10px 25px rgba(239, 68, 68, 0.4);
        }

        @media (max-width: 768px) {
            .stat-grid-profile { grid-template-columns: 1fr; }
            .profile-card-industrial { padding: 40px 20px; }
            .avatar-form-industrial { flex-direction: column; }
            .avatar-update-btn { width: 100%; }
        }
      `}</style>
    </main>
  );
}

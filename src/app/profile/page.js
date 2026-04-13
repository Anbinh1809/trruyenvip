'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
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
        <main className="main-wrapper titan-bg" style={{ minHeight: '100vh', paddingBottom: '100px', color: 'white' }}>
            <Header />
            <div className="container" style={{ marginTop: '200px', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
                    <AlertOctagon size={80} color="var(--accent)" />
                </div>
                <h1 style={{ fontSize: '2rem', fontWeight: 900 }}>Yêu cầu đăng nhập</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '30px', fontWeight: 600 }}>Cần đăng nhập để xem thông tin cá nhân.</p>
                <Link href="/auth/login" className="btn btn-primary" style={{ padding: '14px 40px' }}>Đăng Nhập</Link>
            </div>
        </main>
    );
  }

  return (
    <main className="main-wrapper titan-bg" style={{ minHeight: '100vh', paddingBottom: '100px', color: 'white' }}>
      <Header />
      
      <div className="container fade-in" style={{ marginTop: '120px', maxWidth: '800px' }}>
        <section className="profile-card-titan" style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ width: '140px', height: '140px', borderRadius: '70px', background: 'rgba(255,255,255,0.05)', margin: '0 auto 25px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid var(--accent)', boxShadow: '0 0 30px rgba(255, 62, 62, 0.2)' }}>
            {user.avatar ? (
                <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
                <User size={60} color="rgba(255,255,255,0.2)" />
            )}
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '5px' }}>{user.username}</h1>
          <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.8rem' }}>
            {user.role === 'admin' ? <><Shield size={16} /> Quản trị viên</> : <><User size={16} /> Độc giả VIP</>}
          </p>
          
          <div style={{ marginTop: '35px', display: 'flex', gap: '10px', maxWidth: '450px', margin: '35px auto 0' }}>
            <input 
                type="text" 
                placeholder="Dán link ảnh đại diện mới..." 
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                style={{ flex: 1, padding: '10px 16px', borderRadius: 'var(--border-radius)', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', fontWeight: 600, outline: 'none' }}
            />
            <button 
                onClick={handleUpdateAvatar} 
                className="btn btn-primary" 
                disabled={updating || !avatarUrl.trim()}
                style={{ padding: '0 20px' }}
            >
                {updating ? '...' : 'Cập nhật'}
            </button>
          </div>
          {user.role === 'admin' && (
              <Link href="/admin" className="btn btn-outline" style={{ marginTop: '25px', padding: '12px 35px', fontWeight: 700, color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={18} /> Bảng điều khiển Admin
              </Link>
          )}
        </section>

        <div className="stat-grid-titan" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
            <div className="stat-card-titan glass" style={{ padding: '25px', borderRadius: 'var(--border-radius)', textAlign: 'center', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
                    <Coins size={28} color="#fbbf24" />
                </div>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>VipCoins</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>{new Intl.NumberFormat().format(vipCoins)}</div>
            </div>
            <div className="stat-card-titan glass" style={{ padding: '25px', borderRadius: 'var(--border-radius)', textAlign: 'center', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
                    <Sparkles size={28} color="var(--accent)" />
                </div>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Cấp Độ</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>{level}</div>
            </div>
            <div className="stat-card-titan glass" style={{ padding: '25px', borderRadius: 'var(--border-radius)', textAlign: 'center', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
                    <Activity size={28} color="#60a5fa" />
                </div>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Hạng</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--accent)' }}>{rankTitle}</div>
            </div>
        </div>

        <section className="glass" style={{ padding: '30px', borderRadius: 'var(--border-radius)', border: '1px solid var(--glass-border)', marginBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontWeight: 800, fontSize: '0.95rem' }}>
                <span>Tiến độ</span>
                <span style={{ color: 'var(--accent)' }}>{Math.floor(xpProgress)}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: 'var(--border-radius)', overflow: 'hidden' }}>
                <div style={{ width: `${xpProgress}%`, height: '100%', background: 'var(--accent)', borderRadius: 'var(--border-radius)' }} />
            </div>
            <p style={{ marginTop: '15px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontWeight: 600 }}>
                Cần thêm <strong style={{ color: 'white' }}>{new Intl.NumberFormat().format((level * 100) - xp)} XP</strong> để lên cấp tiếp theo.
            </p>
        </section>

        <div className="profile-actions" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '100px' }}>
            <Link href="/favorites" className="nav-link-titan glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 25px', borderRadius: 'var(--border-radius)', fontSize: '1rem', textDecoration: 'none', color: 'white' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Heart size={18} color="var(--accent)" /> Truyện yêu thích</span>
                <ChevronRight size={18} style={{ opacity: 0.3 }} />
            </Link>
            <Link href="/history" className="nav-link-titan glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 25px', borderRadius: 'var(--border-radius)', fontSize: '1rem', textDecoration: 'none', color: 'white' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><History size={18} color="#60a5fa" /> Lịch sử đọc truyện</span>
                <ChevronRight size={18} style={{ opacity: 0.3 }} />
            </Link>
            <div style={{ height: '1px', background: 'var(--glass-border)', margin: '8px 0' }} />
            <button onClick={logout} style={{ background: 'rgba(255, 62, 62, 0.05)', color: '#ff4d4d', border: '1px solid rgba(255, 62, 62, 0.15)', padding: '18px 25px', borderRadius: 'var(--border-radius)', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                <LogOut size={18} /> Đăng xuất
            </button>
        </div>
      </div>
    </main>
  );
}

'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password.length < 6) {
        setError('Mật khẩu phải dài ít nhất 6 ký tự');
        setLoading(false);
        return;
    }

    // Lấy dữ liệu ẩn danh hiện tại để đồng bộ
    const xp = localStorage.getItem('truyenvip_xp') || '0';
    const coins = localStorage.getItem('truyenvip_coins') || '0';
    const uuid = localStorage.getItem('truyenvip_user_uuid') || `v-${Math.random().toString(36).substr(2, 9)}`;

    const res = await register({
        username,
        password,
        email,
        uuid,
        xp,
        vipCoins: coins
    });
    setLoading(false);

    if (res.success) {
        router.push('/');
    } else {
        const errorMsg = res.error || 'Đăng ký thất bại. Vui lòng thử lại với thông tin khác.';
        setError(errorMsg);
    }
  };

    return (
        <main className="auth-page titan-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />
            
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', position: 'relative', zIndex: 1 }}>
                <div className="auth-container-titan fade-up" style={{ textAlign: 'center', maxWidth: '500px' }}>
                    <div style={{ display: 'inline-block', padding: '4px 14px', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', color: '#a855f7', borderRadius: 'var(--border-radius)', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '2px', marginBottom: '20px' }}>
                        ĐĂNG KÝ THÀNH VIÊN
                    </div>
                    <div className="auth-header">
                        <h1 className="auth-title-titan">Đăng ký tài khoản</h1>
                        <p className="auth-subtitle-titan">Bảo mật thông tin và lưu lịch sử đọc truyện vĩnh viễn</p>
                    </div>

                    <form className="auth-form-titan" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
                        {error && <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', borderRadius: 'var(--border-radius)', fontSize: '0.85rem', fontWeight: 700, textAlign: 'center' }}>{error}</div>}
                        
                        <div className="input-field-titan">
                            <label className="input-label-titan">Tên đăng nhập</label>
                            <input 
                                className="input-control-titan"
                                type="text" 
                                placeholder="Ví dụ: NguoiDocVip123..." 
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoComplete="username"
                                required
                            />
                        </div>

                        <div className="input-field-titan">
                            <label className="input-label-titan">Email (Không bắt buộc)</label>
                            <input 
                                className="input-control-titan"
                                type="email" 
                                placeholder="email@vidu.com..." 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="input-field-titan">
                            <label className="input-label-titan">Mật khẩu</label>
                            <input 
                                className="input-control-titan"
                                type="password" 
                                placeholder="Tối thiểu 6 ký tự..." 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="new-password"
                                required
                            />
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ height: '55px', fontSize: '1rem', fontWeight: 800, marginTop: '15px' }} disabled={loading}>
                            {loading ? 'Đang khởi tạo...' : 'Đăng ký tài khoản'}
                        </button>
                    </form>

                    <div style={{ marginTop: '35px', fontSize: '0.95rem', color: 'rgba(255, 255, 255, 0.4)' }}>
                        <span>Đã có tài khoản? </span>
                        <Link href="/auth/login" style={{ color: 'var(--accent)', fontWeight: 800, textDecoration: 'none', marginLeft: '5px' }}>Đăng nhập ngay</Link>
                    </div>
                </div>
            </div>
        </main>
    );
}

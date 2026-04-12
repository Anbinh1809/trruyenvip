'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login(username, password);
    if (res.success) {
        router.push('/');
    } else {
        setError(res.error || 'Đăng nhập thất bại');
        setLoading(false);
    }
  };

    return (
        <main className="auth-page titan-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />
            
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', position: 'relative', zIndex: 1 }}>
                <div className="auth-container-titan fade-up" style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-block', padding: '6px 16px', background: 'rgba(255, 62, 62, 0.1)', border: '1px solid rgba(255, 62, 62, 0.3)', color: 'var(--accent)', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '3px', marginBottom: '25px' }}>
                        TRUYEN VIP
                    </div>
                    <div className="auth-header">
                        <h1 className="auth-title-titan">Chào mừng!</h1>
                        <p className="auth-subtitle-titan">Đọc truyện tranh chất lượng cao tại TruyenVip</p>
                    </div>

                    <form className="auth-form-titan" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '25px', textAlign: 'left' }}>
                        {error && <div style={{ padding: '15px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', borderRadius: '15px', fontSize: '0.85rem', fontWeight: 700, textAlign: 'center' }}>{error}</div>}
                        
                        <div className="input-field-titan">
                            <label className="input-label-titan">Tên đăng nhập</label>
                            <input 
                                className="input-control-titan"
                                type="text" 
                                placeholder="Nhập tên đăng nhập của bạn..." 
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoComplete="username"
                                required
                            />
                        </div>

                        <div className="input-field-titan">
                            <label className="input-label-titan">Mật Khẩu</label>
                            <input 
                                className="input-control-titan"
                                type="password" 
                                placeholder="Nhập mật khẩu..." 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                required
                            />
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ height: '65px', borderRadius: '20px', fontSize: '1.1rem', fontWeight: 900, marginTop: '15px' }} disabled={loading}>
                            {loading ? 'Đang xác thực...' : 'Đăng nhập'}
                        </button>
                    </form>

                    <div style={{ marginTop: '40px', fontSize: '0.95rem', color: 'rgba(255, 255, 255, 0.4)' }}>
                        <span>Chưa có tài khoản? </span>
                        <Link href="/auth/register" style={{ color: 'var(--accent)', fontWeight: 800, textDecoration: 'none', marginLeft: '5px' }}>Đăng ký tài khoản</Link>
                    </div>
                </div>
            </div>
        </main>
    );
}

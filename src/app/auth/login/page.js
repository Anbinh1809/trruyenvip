'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { LogIn, User, Lock, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const success = await login(username, password);
      if (success) {
        router.push('/');
      } else {
        setError('T�n đăng nhập hoặc mật khẩu kh�ng ch�nh x�c.');
      }
    } catch (err) {
      setError('Đ� x?y ra lo�i k?t n?i. Vui l�ng th? lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="main-wrapper titan-bg auth-page">
      <Header />
      
      <div className="auth-wrapper-industrial">
        <div className="auth-card-titan shadow-titan fade-up">
            <div className="auth-badge-titan">TRUYENVIP SECURE LOGIN</div>
            <h1 className="auth-title-industrial">ĐĂNG NHẬP</h1>
            <p className="auth-subtitle-industrial">Truy c?p v�o thu vi?n v� bo� suu tập c� nh�n c?a bạn.</p>

            <form className="auth-form-industrial" onSubmit={handleSubmit}>
                {error && <div className="auth-error-banner fade-in">{error}</div>}
                
                <div className="auth-input-group">
                    <label className="auth-label-titan">T�n đăng nhập</label>
                    <div className="input-relative">
                        <User className="input-icon-titan" size={18} />
                        <input 
                            type="text" 
                            className="auth-input-titan with-icon"
                            placeholder="Nhập t�n đăng nhập..."
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="auth-input-group">
                    <label className="auth-label-titan">Mật khẩu</label>
                    <div className="input-relative">
                        <Lock className="input-icon-titan" size={18} />
                        <input 
                            type="password" 
                            className="auth-input-titan with-icon"
                            placeholder="Nhập mật khẩu..."
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <button 
                    type="submit" 
                    className="btn btn-primary auth-submit-btn-titan shadow-titan"
                    disabled={loading}
                >
                    {loading ? 'ĐANG Xo� L�...' : 'ĐĂNG NHẬP H? THo�NG'} <LogIn size={20} />
                </button>
            </form>

            <div className="auth-footer-industrial">
                Chua c� t�i kho?n? 
                <Link href="/auth/register" className="auth-link-titan">
                    Đăng k� ngay <ArrowRight size={16} />
                </Link>
            </div>
        </div>
      </div>

      <Footer />
      <style jsx>{`
        .input-relative { position: relative; }
        .input-icon-titan { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.2); transition: color 0.3s; }
        .auth-input-titan.with-icon { padding-left: 50px; }
        .auth-input-titan:focus + .input-icon-titan { color: var(--accent); }
      `}</style>
    </main>
  );
}


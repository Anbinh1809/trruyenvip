'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { UserPlus, User, Lock, Mail, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Mật khẩu x�c nhận kh�ng kho�p.');
      setLoading(false);
      return;
    }

    // TITAN IDENTITY: Ensure device UUID is present
    let uuid = localStorage.getItem('truyenvip_user_uuid');
    if (!uuid) {
        uuid = 'user-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('truyenvip_user_uuid', uuid);
    }
    
    try {
      const response = await register({ username, password, email, uuid });
      if (response.success) {
        router.push('/');
      } else {
        setError(response.error || 'T�n đăng nhập d� t?nn tại hoặc d? li?u kh�ng ho�p l?.');
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
            <div className="auth-badge-titan">JOIN THE ELITE ELITE COMMUNITY</div>
            <h1 className="auth-title-industrial">ĐĂNG K�</h1>
            <p className="auth-subtitle-industrial">Kho�i tạo h�nh tr�nh đo�c truy?n kh�ng gio�i hạn c?a bạn.</p>

            <form className="auth-form-industrial" onSubmit={handleSubmit}>
                {error && <div className="auth-error-banner fade-in">{error}</div>}
                
                <div className="auth-input-group">
                    <label className="auth-label-titan">T�n đăng nhập</label>
                    <div className="input-relative">
                        <User className="input-icon-titan" size={18} />
                        <input 
                            type="text" 
                            className="auth-input-titan with-icon"
                            placeholder="Nhập t�n đăng nhập mong muo�n..."
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="auth-input-group">
                    <label className="auth-label-titan">Email (T�y cho�n)</label>
                    <div className="input-relative">
                        <Mail className="input-icon-titan" size={18} />
                        <input 
                            type="email" 
                            className="auth-input-titan with-icon"
                            placeholder="Nhập đo�a cho� email c?a bạn..."
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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
                            placeholder="Nhập mật khẩu b� mật..."
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="auth-input-group">
                    <label className="auth-label-titan">X�c nhận mật khẩu</label>
                    <div className="input-relative">
                        <Lock className="input-icon-titan" size={18} />
                        <input 
                            type="password" 
                            className="auth-input-titan with-icon"
                            placeholder="Nhập lại mật khẩu..."
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <button 
                    type="submit" 
                    className="btn btn-primary auth-submit-btn-titan shadow-titan"
                    disabled={loading}
                >
                    {loading ? 'ĐANG KHo�I TẠO...' : 'TẠO T�I KHOẢN NGAY'} <UserPlus size={20} />
                </button>
            </form>

            <div className="auth-footer-industrial">
                Đ� c� t�i kho?n? 
                <Link href="/auth/login" className="auth-link-titan">
                    Đăng nhập ngay <ArrowRight size={16} />
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


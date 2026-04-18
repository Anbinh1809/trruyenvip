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
      setError('Mật khẩu xác nhận không khớp.');
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
        setError(response.error || 'Tên đăng nhập đã tồn tại hoặc dữ liệu không hợp lệ.');
      }
    } catch (err) {
      setError('Đã xảy ra lỗi kết nối. Vui lòng thử lại.');
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
            <h1 className="auth-title-industrial">ĐĂNG KÝ</h1>
            <p className="auth-subtitle-industrial">Khởi tạo hành trình đọc truyện không giới hạn của bạn.</p>

            <form className="auth-form-industrial" onSubmit={handleSubmit}>
                {error && <div className="auth-error-banner fade-in">{error}</div>}
                
                <div className="auth-input-group">
                    <label className="auth-label-titan">Tên đăng nhập</label>
                    <div className="input-relative">
                        <User className="input-icon-titan" size={18} />
                        <input 
                            type="text" 
                            className="auth-input-titan with-icon"
                            placeholder="Nhập tên đăng nhập mong muốn..."
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="auth-input-group">
                    <label className="auth-label-titan">Email (Tùy chọn)</label>
                    <div className="input-relative">
                        <Mail className="input-icon-titan" size={18} />
                        <input 
                            type="email" 
                            className="auth-input-titan with-icon"
                            placeholder="Nhập địa chỉ email của bạn..."
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
                            placeholder="Nhập mật khẩu bảo mật..."
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="auth-input-group">
                    <label className="auth-label-titan">Xác nhận mật khẩu</label>
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
                    {loading ? 'ĐANG KHỞI TẠO...' : 'TẠO TÀI KHOẢN NGAY'} <UserPlus size={20} />
                </button>
            </form>

            <div className="auth-footer-industrial">
                Đã có tài khoản? 
                <Link href="/auth/login" className="auth-link-titan">
                    Đăng nhập ngay <ArrowRight size={16} />
                </Link>
            </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}


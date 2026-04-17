'use client';

import { useState } from 'react';
import { useAuth } from '@/NguCanh/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/GiaoDien/BoCuc/Header';
import Footer from '@/GiaoDien/BoCuc/Footer';
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
      setError('Máº­t kháº©u xác nháº­n không kho›p.');
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
        setError(response.error || 'Tên Ä‘Äƒng nháº­p đã tồnn táº¡i hoáº·c dữ liệu không ho£p lệ.');
      }
    } catch (err) {
      setError('Äà£ xảy ra lo—i kết nối. Vui lòng thử láº¡i.');
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
            <h1 className="auth-title-industrial">ÄÄ‚NG Kà</h1>
            <p className="auth-subtitle-industrial">KhoŸi táº¡o hà nh trà¬nh Ä‘oc truyện không gio›i háº¡n của báº¡n.</p>

            <form className="auth-form-industrial" onSubmit={handleSubmit}>
                {error && <div className="auth-error-banner fade-in">{error}</div>}
                
                <div className="auth-input-group">
                    <label className="auth-label-titan">Tên Ä‘Äƒng nháº­p</label>
                    <div className="input-relative">
                        <User className="input-icon-titan" size={18} />
                        <input 
                            type="text" 
                            className="auth-input-titan with-icon"
                            placeholder="Nháº­p tên Ä‘Äƒng nháº­p mong muo‘n..."
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="auth-input-group">
                    <label className="auth-label-titan">Email (Tà¹y chon)</label>
                    <div className="input-relative">
                        <Mail className="input-icon-titan" size={18} />
                        <input 
                            type="email" 
                            className="auth-input-titan with-icon"
                            placeholder="Nháº­p Ä‘o‹a cho‰ email của báº¡n..."
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>

                <div className="auth-input-group">
                    <label className="auth-label-titan">Máº­t kháº©u</label>
                    <div className="input-relative">
                        <Lock className="input-icon-titan" size={18} />
                        <input 
                            type="password" 
                            className="auth-input-titan with-icon"
                            placeholder="Nháº­p máº­t kháº©u bà­ máº­t..."
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="auth-input-group">
                    <label className="auth-label-titan">Xác nháº­n máº­t kháº©u</label>
                    <div className="input-relative">
                        <Lock className="input-icon-titan" size={18} />
                        <input 
                            type="password" 
                            className="auth-input-titan with-icon"
                            placeholder="Nháº­p láº¡i máº­t kháº©u..."
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
                    {loading ? 'ÄANG KHožI Táº O...' : 'Táº O Tà€I KHOáº¢N NGAY'} <UserPlus size={20} />
                </button>
            </form>

            <div className="auth-footer-industrial">
                Äà£ cà³ tà i khoản? 
                <Link href="/auth/login" className="auth-link-titan">
                    ÄÄƒng nháº­p ngay <ArrowRight size={16} />
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


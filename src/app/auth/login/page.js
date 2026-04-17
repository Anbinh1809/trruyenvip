'use client';

import { useState } from 'react';
import { useAuth } from '@/NguCanh/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/GiaoDien/BoCuc/Header';
import Footer from '@/GiaoDien/BoCuc/Footer';
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
        setError('Tên Ä‘Äƒng nháº­p hoáº·c máº­t kháº©u không chà­nh xác.');
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
            <div className="auth-badge-titan">TRUYENVIP SECURE LOGIN</div>
            <h1 className="auth-title-industrial">ÄÄ‚NG NHáº¬P</h1>
            <p className="auth-subtitle-industrial">Truy cập và o thư viện và  bo™ sưu táº­p cá nhà¢n của báº¡n.</p>

            <form className="auth-form-industrial" onSubmit={handleSubmit}>
                {error && <div className="auth-error-banner fade-in">{error}</div>}
                
                <div className="auth-input-group">
                    <label className="auth-label-titan">Tên Ä‘Äƒng nháº­p</label>
                    <div className="input-relative">
                        <User className="input-icon-titan" size={18} />
                        <input 
                            type="text" 
                            className="auth-input-titan with-icon"
                            placeholder="Nháº­p tên Ä‘Äƒng nháº­p..."
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
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
                            placeholder="Nháº­p máº­t kháº©u..."
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
                    {loading ? 'ÄANG Xo¬ Là...' : 'ÄÄ‚NG NHáº¬P Hộ THoNG'} <LogIn size={20} />
                </button>
            </form>

            <div className="auth-footer-industrial">
                Chưa cà³ tà i khoản? 
                <Link href="/auth/register" className="auth-link-titan">
                    ÄÄƒng kà½ ngay <ArrowRight size={16} />
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


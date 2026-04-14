'use client';

import Header from '@/components/Header';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useEngagement } from '@/context/EngagementContext';
import { useToast } from '@/components/ToastProvider';
import { Coins, Landmark, CheckCircle, Clock, AlertTriangle, XCircle, CreditCard, User } from 'lucide-react';

const REWARDS_CATALOG = [
    { label: 'Rút 10.000đ', value: 10, cost: 10000, color: '#ff3e3e' },
    { label: 'Rút 20.000đ', value: 20, cost: 20000, color: '#3b82f6' },
    { label: 'Rút 50.000đ', value: 50, cost: 50000, color: '#10b981' },
    { label: 'Rút 100.000đ', value: 100, cost: 100000, color: '#f59e0b' },
];

const BANK_LIST = [
    'Vietcombank', 'MB Bank', 'Techcombank', 'VietinBank', 
    'Agribank', 'BIDV', 'TPBank', 'VPBank', 'ACB', 
    'MoMo (E-Wallet)', 'ZaloPay (E-Wallet)'
];

export default function RewardsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { vipCoins, mounted } = useEngagement();
  const { addToast } = useToast();
  
  const [bankName, setBankName] = useState(BANK_LIST[0]);
  const [accountNo, setAccountNo] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('info');

  const fetchHistory = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
        const res = await fetch('/api/redemption');
        if (res.ok) {
            const data = await res.json();
            setHistory(data);
        }
    } catch (e) {
        console.error('Fetch error', e);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
        const timer = setTimeout(() => fetchHistory(), 0);
        return () => clearTimeout(timer);
    }
  }, [isAuthenticated, fetchHistory]);

  const handleRedeem = async (item) => {
    if (vipCoins < item.cost) {
      setMsg('Số dư VipCoins không đủ để rút tiền.');
      setMsgType('error');
      return;
    }
    if (!accountNo || !accountHolder) {
      setMsg('Vui lòng cung cấp STK và Tên chủ tài khoản.');
      setMsgType('error');
      return;
    }

    setLoading(true);
    setMsg('');
    try {
      const res = await fetch('/api/redemption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bankName, 
          accountNo, 
          accountHolder, 
          amount: item.value
        })
      });

      if (res.ok) {
        addToast('Yêu cầu rút tiền thành công!', 'success');
        setMsg(`Yêu cầu rút ${item.value}k về ${bankName} đã được gửi. Chúng tôi sẽ xử lý trong vòng 24 giờ.`);
        setMsgType('success');
        setAccountNo('');
        setAccountHolder('');
        fetchHistory();
      } else {
        const errText = await res.text();
        setMsg('Rút tiền thất bại: ' + errText);
        setMsgType('error');
      }
    } catch (e) {
      setMsg('Lỗi kết nối máy chủ.');
      setMsgType('error');
    }
    setLoading(false);
  };

  if (authLoading || !mounted) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div className="loader-ring"></div>
    </div>
  );

  return (
    <main className="main-wrapper titan-bg" style={{ minHeight: '100vh', color: 'white' }}>
      <Header />
      
      <div className="container fade-in" style={{ marginTop: '140px', paddingBottom: '100px' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
               <h1 style={{ fontSize: '3rem', fontWeight: 950, marginBottom: '15px', color: 'var(--accent)' }}>Rút Tiền Tài Khoản</h1>
               <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 40px', fontWeight: 600 }}>Cày truyện nhận thưởng. Chuyển tiền trực tiếp về ngân hàng của bạn.</p>
               
               <div className="glass" style={{ display: 'inline-flex', alignItems: 'center', gap: '15px', padding: '15px 30px', borderRadius: 'var(--border-radius)', border: '1px solid var(--accent)' }}>
                  <Coins size={32} color="#fbbf24" />
                  <div style={{ textAlign: 'left' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, opacity: 0.5, textTransform: 'uppercase' }}>VipCoins hiện có</span>
                      <div style={{ fontSize: '1.6rem', fontWeight: 900 }}>{vipCoins.toLocaleString()}</div>
                  </div>
               </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px' }}>
          {/* FORM SECTION */}
          <div className="glass" style={{ padding: '35px', borderRadius: 'var(--border-radius)', border: '1px solid var(--glass-border)' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Landmark size={24} color="var(--accent)" /> Thông tin thụ hưởng
                </h3>
                
                <div className="input-group-titan" style={{ marginBottom: '20px' }}>
                        <label className="input-label-titan">Ngân hàng / Ví</label>
                        <select className="input-titan" value={bankName} onChange={(e) => setBankName(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: 'white' }}>
                            {BANK_LIST.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                </div>
                
                <div className="input-group-titan" style={{ marginBottom: '20px' }}>
                        <label className="input-label-titan">Số tài khoản</label>
                        <input className="input-titan" type="text" placeholder="Nhập STK..." value={accountNo} onChange={(e) => setAccountNo(e.target.value)} />
                </div>

                <div className="input-group-titan" style={{ marginBottom: '30px' }}>
                        <label className="input-label-titan">Tên chủ tài khoản</label>
                        <input className="input-titan" type="text" placeholder="NGUYEN VAN A..." value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} style={{ textTransform: 'uppercase' }} />
                </div>

                {msg && (
                    <div className="fade-in" style={{ 
                        padding: '15px', borderRadius: 'var(--border-radius)', textAlign: 'center', fontWeight: 700, 
                        background: msgType === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 62, 62, 0.1)', 
                        color: msgType === 'success' ? '#10b981' : 'var(--accent)', 
                        border: `1px solid ${msgType === 'success' ? '#10b98133' : '#ff3e3e33'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                    }}>
                        {msgType === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                        <span style={{ fontSize: '0.9rem' }}>{msg}</span>
                    </div>
                )}
          </div>

          {/* CATALOG SECTION */}
          <div>
                <h3 style={{ marginBottom: '25px', fontWeight: 900, fontSize: '1.6rem' }}>Chọn mệnh giá rút</h3>
                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                    {REWARDS_CATALOG.map(item => (
                        <div key={item.value} className="glass card-titan" style={{ padding: '30px', textAlign: 'center', border: `1px solid ${item.color}33`, transition: 'all 0.3s ease' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px', color: item.color }}>
                                <CreditCard size={48} />
                            </div>
                            <h4 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '5px' }}>{item.label}</h4>
                            <p style={{ opacity: 0.5, fontSize: '0.85rem', marginBottom: '20px' }}>Tốn {item.cost.toLocaleString()} Coins</p>
                            <button 
                                className="btn btn-primary" 
                                disabled={loading || vipCoins < item.cost}
                                onClick={() => handleRedeem(item)}
                                style={{ background: vipCoins < item.cost ? 'rgba(255,255,255,0.05)' : item.color, width: '100%', opacity: vipCoins < item.cost ? 0.3 : 1 }}
                            >
                                {loading ? '...' : (vipCoins < item.cost ? 'Chưa đủ Coins' : 'Rút ngay')}
                            </button>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: '50px' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '25px', fontWeight: 900, fontSize: '1.6rem' }}>
                            <Clock size={24} color="#60a5fa" /> Lịch sử rút tiền
                        </h3>
                        <div className="glass" style={{ borderRadius: 'var(--border-radius)', padding: '5px', maxHeight: '400px', overflowY: 'auto' }}>
                            {history.map(req => (
                                <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div>
                                        <div style={{ fontWeight: 900, fontSize: '1.1rem', marginBottom: '3px' }}>{req.card_value}k → <span style={{ color: 'var(--accent)' }}>{req.bank_name || 'Legacy'}</span></div>
                                        <div style={{ fontSize: '0.75rem', opacity: 0.4 }}>{new Date(req.created_at).toLocaleString()}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '0.85rem' }}>
                                        {req.status === 'Pending' && <span style={{ color: '#ffa500' }}>● Chờ duyệt</span>}
                                        {req.status === 'Done' && <span style={{ color: '#10b981' }}>● Hoàn tất</span>}
                                        {req.status === 'Rejected' && <span style={{ color: '#ef4444' }}>● Từ chối</span>}
                                    </div>
                                </div>
                            ))}
                            {history.length === 0 && <div style={{ padding: '60px', textAlign: 'center', opacity: 0.3 }}>Chưa có giao dịch nào gần đây.</div>}
                        </div>
                </div>
          </div>
        </div>
      </div>
    </main>
  );
}

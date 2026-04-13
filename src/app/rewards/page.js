'use client';

import Header from '@/components/Header';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useEngagement } from '@/context/EngagementContext';
import { useToast } from '@/components/ToastProvider';
import { calculateRank } from '@/context/EngagementContext';
import Link from 'next/link';

const REWARDS_CATALOG = [
    { label: 'Thẻ 10k', value: 10, cost: 10000, color: '#ff3e3e' },
    { label: 'Thẻ 20k', value: 20, cost: 20000, color: '#3b82f6' },
    { label: 'Thẻ 50k', value: 50, cost: 50000, color: '#10b981' },
    { label: 'Thẻ 100k', value: 100, cost: 100000, color: '#f59e0b' },
];

export default function RewardsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { vipCoins, mounted } = useEngagement();
  const { addToast } = useToast();
  const [phone, setPhone] = useState('');
  const [network, setNetwork] = useState('Viettel');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [msg, setMsg] = useState('');

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
      setMsg('❌ Nghi án thiếu thâm hậu! Hãy chăm chỉ tu luyện (đọc truyện) để tích lũy thêm VipCoins.');
      return;
    }
    if (phone.length < 10) {
      setMsg('⚠️ Vui lòng để lại truyền tin (Số điện thoại) để nhận pháp bảo.');
      return;
    }

    setLoading(true);
    setMsg('');
    try {
      const res = await fetch('/api/redemption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cardType: network, 
          cardValue: item.value, 
          phoneNumber: phone,
          userName: localStorage.getItem('truyenvip_username') || 'Ẩn danh',
        })
      });

      if (res.ok) {
        const traceId = res.headers.get('X-Trace-Id');
        addToast('Yêu cầu đã được gửi! ✅', 'success');
        setMsg(`🚀 Lệnh bài đã được xuất! Pháp bảo sẽ được gửi tới hòm thư của Đạo hữu trong vòng 24 giờ. (Mã: ${traceId})`);
        fetchHistory();
      } else {
        const errText = await res.text();
        setMsg('⛔ Phép trận lỗi: ' + errText);
      }
    } catch (e) {
      setMsg('🚫 Thần giao cách trở (Lỗi kết nối).');
    }
    setLoading(false);
  };

  if (authLoading || !mounted) return <div className="loading">Cảm ứng thiên địa...</div>;

  return (
    <main className="main-wrapper">
      <Header />
      
      <div className="container fade-in" style={{ marginTop: '140px', paddingBottom: '100px' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
               <span style={{ background: 'rgba(255, 165, 0, 0.1)', color: '#ffa500', padding: '6px 14px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 900, letterSpacing: '2px', marginBottom: '20px', display: 'inline-block' }}>PHÁP BẢO CÁC</span>
               <h1 style={{ fontSize: '3.5rem', fontWeight: 950, letterSpacing: '-3px', marginBottom: '15px' }}>Kho Phòng Đổi Thưởng</h1>
               <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 40px', fontWeight: 600 }}>Đạo hữu có thể dùng VipCoins tích lũy để quy đổi thành các pháp bảo giá trị (Thẻ cào điện thoại).</p>
               
               <div className="glass" style={{ display: 'inline-flex', alignItems: 'center', gap: '20px', padding: '15px 35px', borderRadius: '50px', border: '1px solid gold' }}>
                  <div style={{ fontSize: '2rem', filter: 'drop-shadow(0 0 10px gold)' }}>💰</div>
                  <div style={{ textAlign: 'left' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '1px' }}>VipCoins hiện có</span>
                      <div style={{ fontSize: '1.5rem', fontWeight: 950, color: 'gold' }}>{vipCoins.toLocaleString()}</div>
                  </div>
               </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: '1fr 2fr', gap: '30px', alignItems: 'start' }}>
          <div className="glass" style={{ padding: '40px', borderRadius: '30px' }}>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '30px', letterSpacing: '-0.5px' }}>1. Thông tin truyền tin</h3>
                  <div className="input-group-titan" style={{ marginBottom: '20px' }}>
                          <label className="input-label-titan">Mạng Pháp Bảo</label>
                          <select className="input-titan" value={network} onChange={(e) => setNetwork(e.target.value)}>
                              <option value="Viettel">Viettel (Khuyến nghị)</option>
                              <option value="MobiFone">MobiFone</option>
                              <option value="VinaPhone">VinaPhone</option>
                          </select>
                  </div>
                  <div className="input-group-titan">
                          <label className="input-label-titan">Liên lạc (Số ĐT)</label>
                          <input className="input-titan" type="text" placeholder="Nhập số điện thoại..." value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>

                  {msg && <div style={{ marginTop: '30px', padding: '20px', borderRadius: '14px', textAlign: 'center', fontWeight: 700, background: msg.includes('🚀') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 62, 62, 0.1)', color: msg.includes('🚀') ? '#10b981' : 'var(--accent)', border: `1px solid ${msg.includes('🚀') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 62, 62, 0.2)'}` }}>{msg}</div>}
          </div>

          <div>
          <h3 style={{ marginBottom: '25px', fontWeight: 900, fontSize: '1.6rem', letterSpacing: '-0.5px' }}>2. Chọn pháp bảo quy đổi</h3>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
              {REWARDS_CATALOG.map(item => (
                  <div key={item.value} className="glass card-titan" style={{ padding: '30px', textAlign: 'center', border: `1px solid ${item.color}33`, position: 'relative', overflow: 'hidden' }}>
                      <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📜</div>
                      <h4 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '5px' }}>{item.label}</h4>
                      <p style={{ opacity: 0.5, fontSize: '0.85rem', marginBottom: '20px' }}>Tốn {item.cost.toLocaleString()} VipCoins</p>
                      <button 
                          className="btn-primary" 
                          disabled={loading || vipCoins < item.cost}
                          onClick={() => handleRedeem(item)}
                          style={{ background: item.color, width: '100%' }}
                      >
                          {loading ? '...' : (vipCoins < item.cost ? 'Chưa đủ tu vi' : 'Đổi ngay')}
                      </button>
                  </div>
              ))}
          </div>

          <div style={{ marginTop: '50px' }}>
                  <h3 style={{ marginBottom: '25px', fontWeight: 900, fontSize: '1.6rem', letterSpacing: '-0.5px' }}>📜 Sử sách đổi thưởng</h3>
                  <div className="glass" style={{ borderRadius: '25px', padding: '10px' }}>
                      {history.map(req => (
                          <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <div>
                                  <div style={{ fontWeight: 900, fontSize: '1.1rem', marginBottom: '3px' }}>Thẻ {req.card_type} <span style={{ color: 'var(--accent)' }}>{req.card_value}k</span></div>
                                  <div style={{ fontSize: '0.75rem', opacity: 0.4 }}>{new Date(req.created_at).toLocaleString()}</div>
                              </div>
                              <div style={{ fontWeight: 800, color: (req.status || '').toLowerCase() === 'pending' ? '#ffa500' : '#10b981' }}>
                                  {(req.status || '').toLowerCase() === 'pending' ? '⏳ Đang duyệt' : '✅ Hoàn tất'}
                              </div>
                          </div>
                      ))}
                      {history.length === 0 && <div style={{ padding: '40px', textAlign: 'center', opacity: 0.3 }}>Chưa có dấu ấn nào.</div>}
                  </div>
          </div>
          </div>
        </div>
      </div>
    </main>
  );
}

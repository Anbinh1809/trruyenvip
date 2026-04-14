'use client';

import Header from '@/components/Header';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ToastProvider';
import Link from 'next/link';
import { Landmark, User, CreditCard, CheckCircle, XCircle, Clock, Search } from 'lucide-react';

export default function AdminRewardsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Pending');

  const fetchRequests = useCallback(async () => {
    if (user?.role !== 'admin') return;
    setLoading(true);
    try {
      const res = await fetch(`/api/redemption`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (e) {
      console.error('Fetch error', e);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => fetchRequests(), 0);
    return () => clearTimeout(timer);
  }, [fetchRequests]);

  const updateStatus = async (id, status) => {
    if (status === 'Rejected' && !confirm('Bạn có chắc chắn muốn TỪ CHỐI yêu cầu này? Tiền sẽ không tự động hoàn lại (cần xử lý thủ công nếu muốn hoàn).')) return;
    
    try {
      const res = await fetch('/api/redemption', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      if (res.ok) {
        addToast(status === 'Done' ? '✅ Đã xác nhận hoàn tất!' : '❌ Đã hủy yêu cầu.', 'success');
        fetchRequests();
      } else {
        addToast('Lỗi cập nhật trạng thái.', 'error');
      }
    } catch (e) {
      addToast('Lỗi kết nối máy chủ.', 'error');
    }
  };

  const filteredRequests = requests.filter(r => filter === 'All' || r.status === filter);

  if (authLoading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div className="loader-ring"></div>
    </div>
  );

  if (!isAuthenticated || user?.role !== 'admin') {
      return (
          <main className="main-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '20px' }}>
              <XCircle size={80} color="var(--accent)" />
              <h2>Truy cập bị từ chối</h2>
              <Link href="/" className="btn btn-primary">Quay lại trang chủ</Link>
          </main>
      );
  }

  return (
    <main className="main-wrapper titan-bg" style={{ minHeight: '100vh', color: 'white' }}>
      <Header />
      
      <div className="container fade-in" style={{ marginTop: '120px', paddingBottom: '100px' }}>
        <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div>
                <h1 style={{ fontWeight: 950, fontSize: '2.5rem', marginBottom: '10px' }}>Quản lý Giao dịch</h1>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Phê duyệt yêu cầu rút tiền về ngân hàng của người dùng</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '5px', borderRadius: 'var(--border-radius)' }}>
                {['Pending', 'Done', 'Rejected', 'All'].map(f => (
                    <button 
                        key={f}
                        onClick={() => setFilter(f)}
                        style={{ 
                            padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem',
                            background: filter === f ? 'var(--accent)' : 'transparent',
                            color: filter === f ? 'white' : 'rgba(255,255,255,0.5)'
                        }}
                    >
                        {f === 'Pending' ? 'Chờ duyệt' : f === 'Done' ? 'Hoàn tất' : f === 'Rejected' ? 'Từ chối' : 'Tất cả'}
                    </button>
                ))}
            </div>
        </header>
        
        <div className="glass" style={{ borderRadius: 'var(--border-radius)', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--glass-border)' }}>
                        <th style={{ padding: '20px' }}>Yêu cầu / Thời gian</th>
                        <th style={{ padding: '20px' }}>Người thụ hưởng</th>
                        <th style={{ padding: '20px' }}>Chi tiết Ngân hàng</th>
                        <th style={{ padding: '20px' }}>Mệnh giá</th>
                        <th style={{ padding: '20px' }}>Trạng thái</th>
                        <th style={{ padding: '20px' }}>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredRequests.map(req => (
                        <tr key={req.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}>
                            <td style={{ padding: '20px' }}>
                                <div style={{ fontSize: '0.7rem', opacity: 0.4, marginBottom: '5px' }}>#{req.id}</div>
                                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{new Date(req.created_at).toLocaleString()}</div>
                            </td>
                            <td style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                                    <User size={14} color="var(--accent)" /> {req.user_name}
                                </div>
                                <div style={{ fontSize: '0.65rem', opacity: 0.4, marginTop: '4px' }}>UUID: {req.user_uuid.substring(0, 8)}...</div>
                            </td>
                            <td style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 900, color: '#60a5fa' }}>
                                    <Landmark size={14} /> {req.bank_name || 'Card Legacy'}
                                </div>
                                <div style={{ fontWeight: 800, marginTop: '4px', fontSize: '1rem', letterSpacing: '1px' }}>{req.account_no || req.phone_number}</div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.6, textTransform: 'uppercase', marginTop: '2px' }}>{req.account_holder || 'N/A'}</div>
                            </td>
                            <td style={{ padding: '20px', color: 'var(--accent)', fontWeight: 900, fontSize: '1.2rem' }}>
                                {req.card_value}k
                            </td>
                            <td style={{ padding: '20px' }}>
                                <span style={{ 
                                    padding: '6px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase',
                                    background: req.status === 'Pending' ? 'rgba(255,165,0,0.1)' : req.status === 'Done' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                    color: req.status === 'Pending' ? '#ffa500' : req.status === 'Done' ? '#10b981' : '#ef4444',
                                    border: `1px solid ${req.status === 'Pending' ? '#ffa50033' : req.status === 'Done' ? '#10b98133' : '#ef444433'}`
                                }}>
                                    {req.status === 'Pending' ? 'Đang chờ' : req.status === 'Done' ? 'Hoàn tất' : 'Đã hủy'}
                                </span>
                            </td>
                            <td style={{ padding: '20px' }}>
                                {req.status === 'Pending' && (
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button 
                                            onClick={() => updateStatus(req.id, 'Done')}
                                            title="Hoàn tất chuyển khoản"
                                            style={{ padding: '8px 15px', borderRadius: '8px', background: '#10b981', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '5px' }}
                                        >
                                            <CheckCircle size={14} /> Duyệt
                                        </button>
                                        <button 
                                            onClick={() => updateStatus(req.id, 'Rejected')}
                                            title="Từ chối yêu cầu"
                                            style={{ padding: '8px 15px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid #ef444433', cursor: 'pointer', fontWeight: 800 }}
                                        >
                                            <Slash size={14} />
                                        </button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {filteredRequests.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '100px', background: 'rgba(255,255,255,0.01)' }}>
                    <Search size={48} style={{ opacity: 0.1, marginBottom: '20px' }} />
                    <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Không tìm thấy yêu cầu nào phù hợp.</p>
                </div>
            )}
            {loading && (
                <div style={{ padding: '100px', textAlign: 'center' }}>
                    <div className="loader-ring" style={{ margin: '0 auto' }}></div>
                </div>
            )}
        </div>
      </div>
    </main>
  );
}

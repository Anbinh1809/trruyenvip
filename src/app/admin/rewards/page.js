'use client';

import Header from '@/components/Header';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ToastProvider';
import Link from 'next/link';

export default function AdminRewardsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

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
    // Use a small delay to avoid cascading render warnings in React 19
    const timer = setTimeout(() => fetchRequests(), 0);
    return () => clearTimeout(timer);
  }, [fetchRequests]);

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch('/api/redemption', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      if (res.ok) {
        addToast('✅ Xác nhận hoàn thành yêu cầu!', 'success');
        fetchRequests();
      } else {
        addToast('Lỗi cập nhật trạng thái.', 'error');
      }
    } catch (e) {
      addToast('Lỗi kết nối máy chủ.', 'error');
    }
  };

  if (authLoading) return <div className="loading">Checking authority...</div>;
  if (!isAuthenticated || user?.role !== 'admin') {
      return (
          <main className="main-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '20px' }}>
              <h1 style={{ fontSize: '5rem' }}>🚫</h1>
              <h2>Truy cập bị từ chối</h2>
              <p>Chỉ có bậc tiền bối (Admin) mới có quyền vào đây.</p>
              <Link href="/" className="btn-primary">Quay lại trang chủ</Link>
          </main>
      );
  }

  return (
    <main className="main-wrapper">
      <Header />
      
      <div className="container fade-in" style={{ marginTop: '120px' }}>
        <h1 style={{ marginBottom: '40px' }}>💵 Quản lý Đổi Thẻ</h1>
        
        <div className="glass" style={{ padding: '30px', borderRadius: '25px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <th style={{ padding: '15px' }}>Thời gian</th>
                        <th style={{ padding: '15px' }}>Người dùng</th>
                        <th style={{ padding: '15px' }}>Số ĐT</th>
                        <th style={{ padding: '15px' }}>Loại thẻ</th>
                        <th style={{ padding: '15px' }}>Mệnh giá</th>
                        <th style={{ padding: '15px' }}>Trạng thái</th>
                        <th style={{ padding: '15px' }}>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {requests.map(req => (
                        <tr key={req.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '15px', fontSize: '0.85rem' }}>{new Date(req.created_at).toLocaleString()}</td>
                            <td style={{ padding: '15px' }}>{req.user_name} ({req.user_uuid})</td>
                            <td style={{ padding: '15px', fontWeight: 700 }}>{req.phone_number}</td>
                            <td style={{ padding: '15px' }}>{req.card_type}</td>
                            <td style={{ padding: '15px', color: 'var(--accent)', fontWeight: 800 }}>{req.card_value}k</td>
                            <td style={{ padding: '15px' }}>
                                <span style={{ 
                                    padding: '5px 12px', 
                                    borderRadius: '20px', 
                                    fontSize: '0.75rem', 
                                    fontWeight: 800,
                                    background: req.status === 'Pending' ? 'orange' : 'green' 
                                }}>
                                    {req.status}
                                </span>
                            </td>
                            <td style={{ padding: '15px' }}>
                                {req.status === 'Pending' && (
                                    <button 
                                        onClick={() => updateStatus(req.id, 'Done')}
                                        style={{ padding: '8px 15px', borderRadius: '10px', background: 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                                    >
                                        ✅ Gửi mã
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                    {requests.length === 0 && !loading && (
                        <tr>
                            <td colSpan="7" style={{ textAlign: 'center', padding: '100px', color: 'var(--text-muted)' }}>Chưa có yêu cầu nào.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </main>
  );
}

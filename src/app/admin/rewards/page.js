'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/widgets/ToastProvider';
import { CheckCircle, XCircle, Clock, User, Landmark, CreditCard, ChevronRight, Shield } from 'lucide-react';
import '../admin.css';

export default function AdminRewardsPage() {
  const { user, isAuthenticated, loading } = useAuth() || {};
  const { addToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [fetching, setFetching] = useState(true);

  const fetchRequests = useCallback(async () => {
    setFetching(true);
    try {
      const res = await fetch(`/api/admin/rewards?status=${statusFilter}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (e) {
      addToast('Lội khi lấy danh s�ch y�u cầu.', 'error');
    }
    setFetching(false);
  }, [statusFilter, addToast]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      startTransition(() => {
        fetchRequests();
      });
    }
  }, [isAuthenticated, user, statusFilter, fetchRequests]);

  const handleAction = async (requestId, action) => {
    try {
      const res = await fetch('/api/admin/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action })
      });
      if (res.ok) {
        addToast(`Đã ${action === 'approve' ? 'phê duyệt' : 'từ chối'} yêu cầu thành công!`, 'success');
        fetchRequests();
      } else {
        addToast('Thao tác thất bại.', 'error');
      }
    } catch (e) {
      addToast('Lỗi kết nối máy chủ.', 'error');
    }
  };

  if (loading || fetching && requests.length === 0) {
    return (
        <div className="main-wrapper titan-bg">
            <Header />
            <div className="system-center-industrial">
                <div className="titan-loader-pulse"></div>
                <p className="loading-status-hint">Đang t?i d? li?u quản trị�...</p>
            </div>
        </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
        <div className="main-wrapper titan-bg">
            <Header />
            <div className="system-center-industrial">
                <XCircle size={60} color="var(--accent)" />
                <h1 className="system-title-industrial">TRUY C?P Bộ Tộ CHộI</h1>
                <p className="system-desc-industrial">B?n kh�ng c� quyộn hạn độ truy c?p v�o khu vực quản trị� tội mật n�y.</p>
            </div>
        </div>
    );
  }

  return (
    <main className="main-wrapper titan-bg admin-page">
      <Header />
      
      <div className="container admin-container fade-in">
        <header className="admin-header-industrial fade-up">
            <div className="header-left">
                <div className="library-badge-titan">ADMIN CONSOLE</div>
                <h1 className="admin-title-industrial">QUẢN L� GIAO DộCH</h1>
                <p className="admin-subtitle">Ph� duy?t c�c y�u cầu quy đội phần thuộng t? nguội d�ng.</p>
            </div>
            <div className="admin-filter-group shadow-titan">
                {['pending', 'approved', 'rejected'].map(s => (
                    <button 
                        key={s}
                        className={`filter-btn-titan ${statusFilter === s ? 'active' : ''}`}
                        onClick={() => setStatusFilter(s)}
                    >
                        {s === 'pending' ? 'CHộ DUY?T' : (s === 'approved' ? 'Đ� DUY?T' : 'Đ� Tộ CHộI')}
                    </button>
                ))}
            </div>
        </header>

        <div className="admin-table-wrapper shadow-titan fade-in">
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Y�U CẦU / THộI GIAN</th>
                        <th>NGƯộI THộ HƯộNG</th>
                        <th>TH�NG TIN THANH TO�N</th>
                        <th>M?NH GI�</th>
                        <th>TRẠNG TH�I</th>
                        <th>THAO T�C</th>
                    </tr>
                </thead>
                <tbody>
                    {requests.length === 0 ? (
                        <tr>
                            <td colSpan="6" className="empty-table-cell">
                                Kh�ng c� y�u cầu n�o trong danh s�ch n�y.
                            </td>
                        </tr>
                    ) : requests.map(req => (
                        <tr key={req.id}>
                            <td>
                                <div className="req-id-tag">REQID: {req.id}</div>
                                <div className="req-date-titan">{new Date(req.created_at).toLocaleString('vi-VN')}</div>
                            </td>
                            <td>
                                <div className="beneficiary-box">
                                    <div className="avatar-mini-titan">
                                        <User size={14} />
                                    </div>
                                    <div className="user-tag-admin">{req.username}</div>
                                </div>
                            </td>
                            <td>
                                <div className="bank-detail-box">
                                    <div className="bank-name-titan"><Landmark size={14} /> {req.bank_name || 'MOMO/PHONE'}</div>
                                    <div className="account-no-titan"><CreditCard size={14} /> {req.account_no || req.phone_number}</div>
                                    <div className="holder-name-titan">{req.account_holder || 'N/A'}</div>
                                </div>
                            </td>
                            <td>
                                <div className="amount-admin-titan">{new Intl.NumberFormat().format(req.amount_vnd)} VNĐ</div>
                                <div className="cost-coins-titan">({new Intl.NumberFormat().format(req.cost_coins)} Coins)</div>
                            </td>
                            <td>
                                <span className={`status-pill-industrial status-${req.status}`}>
                                    {req.status === 'pending' ? 'ĐANG CHộ' : (req.status === 'approved' ? 'HO�N TẤT' : 'Bộ HUộ')}
                                </span>
                            </td>
                            <td>
                                {req.status === 'pending' ? (
                                    <div className="action-btn-group">
                                        <button className="approve-btn-titan" onClick={() => handleAction(req.id, 'approve')}>
                                            <CheckCircle size={16} /> DUY?T
                                        </button>
                                        <button className="reject-btn-titan" onClick={() => handleAction(req.id, 'reject')}>
                                            HUộ
                                        </button>
                                    </div>
                                ) : (
                                    <span className="action-done-titan">Đ� Xộ L�</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
      <Footer />
    </main>
  );
}


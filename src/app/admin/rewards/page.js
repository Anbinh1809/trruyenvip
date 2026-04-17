'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import Header from '@/GiaoDien/BoCuc/Header';
import Footer from '@/GiaoDien/BoCuc/Footer';
import { useAuth } from '@/NguCanh/AuthContext';
import { useToast } from '@/GiaoDien/TienIch/ToastProvider';
import { CheckCircle, XCircle, Clock, User, Landmark, CreditCard, ChevronRight, Shield } from 'lucide-react';
import '../admin.css';

export default function AdminRewardsPage() {
  const { user, isAuthenticated, loading } = useAuth();
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
      addToast('Lo—i khi láº¥y danh sách yêu cáº§u.', 'error');
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
        addToast(`Äà£ ${action === 'approve' ? 'phê duyệt' : 'từ cho‘i'} yêu cáº§u thành công!`, 'success');
        fetchRequests();
      } else {
        addToast('Thao tác tháº¥t báº¡i.', 'error');
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
                <p className="loading-status-hint">Äang tải dữ liệu quản tro‹...</p>
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
                <h1 className="system-title-industrial">TRUY CẬP BoŠ Toª CHoI</h1>
                <p className="system-desc-industrial">Bạn không cà³ quyon háº¡n Ä‘oƒ truy cập và o khu vựcc quản tro‹ to‘i máº­t nà y.</p>
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
                <h1 className="admin-title-industrial">QUáº¢N Là GIAO DoŠCH</h1>
                <p className="admin-subtitle">Phê duyệt các yêu cáº§u quy Ä‘o•i pháº§n thưoŸng từ ngưoi dà¹ng.</p>
            </div>
            <div className="admin-filter-group shadow-titan">
                {['pending', 'approved', 'rejected'].map(s => (
                    <button 
                        key={s}
                        className={`filter-btn-titan ${statusFilter === s ? 'active' : ''}`}
                        onClick={() => setStatusFilter(s)}
                    >
                        {s === 'pending' ? 'CHoœ DUYộT' : (s === 'approved' ? 'Äàƒ DUYộT' : 'Äàƒ Toª CHoI')}
                    </button>
                ))}
            </div>
        </header>

        <div className="admin-table-wrapper shadow-titan fade-in">
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>YàŠU Cáº¦U / THoœI GIAN</th>
                        <th>NGÆ¯oœI THo¤ HÆ¯ožNG</th>
                        <th>THà”NG TIN THANH TOàN</th>
                        <th>MộNH GIà</th>
                        <th>TRáº NG THàI</th>
                        <th>THAO TàC</th>
                    </tr>
                </thead>
                <tbody>
                    {requests.length === 0 ? (
                        <tr>
                            <td colSpan="6" className="empty-table-cell">
                                Khà´ng cà³ yêu cáº§u nà o trong danh sách nà y.
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
                                <div className="amount-admin-titan">{new Intl.NumberFormat().format(req.amount_vnd)} VNÄ</div>
                                <div className="cost-coins-titan">({new Intl.NumberFormat().format(req.cost_coins)} Coins)</div>
                            </td>
                            <td>
                                <span className={`status-pill-industrial status-${req.status}`}>
                                    {req.status === 'pending' ? 'ÄANG CHoœ' : (req.status === 'approved' ? 'HOà€N Táº¤T' : 'BoŠ HUo¶')}
                                </span>
                            </td>
                            <td>
                                {req.status === 'pending' ? (
                                    <div className="action-btn-group">
                                        <button className="approve-btn-titan" onClick={() => handleAction(req.id, 'approve')}>
                                            <CheckCircle size={16} /> DUYộT
                                        </button>
                                        <button className="reject-btn-titan" onClick={() => handleAction(req.id, 'reject')}>
                                            HUo¶
                                        </button>
                                    </div>
                                ) : (
                                    <span className="action-done-titan">Äàƒ Xo¬ Là</span>
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


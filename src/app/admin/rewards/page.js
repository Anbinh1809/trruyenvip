'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ToastProvider';
import { CheckCircle, XCircle, Clock, User, Landmark, CreditCard, ChevronRight, Shield } from 'lucide-react';

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
      addToast('Lỗi khi lấy danh sách yêu cầu.', 'error');
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
                <p className="loading-status-hint">Đang tải dữ liệu quản trị...</p>
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
                <h1 className="system-title-industrial">TRUY CẬP BỊ TỪ CHỐI</h1>
                <p className="system-desc-industrial">Bạn không có quyền hạn để truy cập vào khu vực quản trị tối mật này.</p>
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
                <h1 className="admin-title-industrial">QUẢN LÝ GIAO DỊCH</h1>
                <p className="admin-subtitle">Phê duyệt các yêu cầu quy đổi phần thưởng từ người dùng.</p>
            </div>
            <div className="admin-filter-group shadow-titan">
                {['pending', 'approved', 'rejected'].map(s => (
                    <button 
                        key={s}
                        className={`filter-btn-titan ${statusFilter === s ? 'active' : ''}`}
                        onClick={() => setStatusFilter(s)}
                    >
                        {s === 'pending' ? 'CHỜ DUYỆT' : (s === 'approved' ? 'ĐÃ DUYỆT' : 'ĐÃ TỪ CHỐI')}
                    </button>
                ))}
            </div>
        </header>

        <div className="admin-table-wrapper shadow-titan fade-in">
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>YÊU CẦU / THỜI GIAN</th>
                        <th>NGƯỜI THỤ HƯỞNG</th>
                        <th>THÔNG TIN THANH TOÁN</th>
                        <th>MỆNH GIÁ</th>
                        <th>TRẠNG THÁI</th>
                        <th>THAO TÁC</th>
                    </tr>
                </thead>
                <tbody>
                    {requests.length === 0 ? (
                        <tr>
                            <td colSpan="6" className="empty-table-cell">
                                Không có yêu cầu nào trong danh sách này.
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
                                    {req.status === 'pending' ? 'ĐANG CHỜ' : (req.status === 'approved' ? 'HOÀN TẤT' : 'BỊ HUỶ')}
                                </span>
                            </td>
                            <td>
                                {req.status === 'pending' ? (
                                    <div className="action-btn-group">
                                        <button className="approve-btn-titan" onClick={() => handleAction(req.id, 'approve')}>
                                            <CheckCircle size={16} /> DUYỆT
                                        </button>
                                        <button className="reject-btn-titan" onClick={() => handleAction(req.id, 'reject')}>
                                            HUỶ
                                        </button>
                                    </div>
                                ) : (
                                    <span className="action-done-titan">ĐÃ XỬ LÝ</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
      <Footer />
      <style jsx>{`
        .empty-table-cell { text-align: center; padding: 60px; color: rgba(255,255,255,0.2); font-weight: 800; font-style: italic; }
        .avatar-mini-titan { width: 24px; height: 24px; background: rgba(255,255,255,0.05); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .bank-name-titan { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; color: rgba(255,255,255,0.4); text-transform: uppercase; margin-bottom: 4px; }
        .account-no-titan { display: flex; align-items: center; gap: 8px; font-size: 1rem; color: #60a5fa; margin-bottom: 2px; }
        .holder-name-titan { font-size: 0.75rem; color: rgba(255,255,255,0.3); text-transform: uppercase; }
        .cost-coins-titan { font-size: 0.75rem; color: rgba(255,255,255,0.3); font-weight: 800; }
        .action-done-titan { font-size: 0.8rem; font-weight: 950; color: rgba(255,255,255,0.1); letter-spacing: 1px; }
      `}</style>
    </main>
  );
}

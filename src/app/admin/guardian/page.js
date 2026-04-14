'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { RefreshCcw, ShieldCheck, Activity, Search, AlertCircle, Clock } from 'lucide-react';

export default function AdminGuardianPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const [data, setData] = useState({ metrics: {}, history: [] });
  const [fetching, setFetching] = useState(true);
  const [isPending, startTransition] = useTransition();

  const fetchHistory = useCallback(async () => {
    setFetching(true);
    try {
        const res = await fetch('/api/admin/guardian/history');
        if (res.ok) {
            const history = await res.json();
            
            // Calc metrics for display
            const metrics = history.reduce((acc, curr) => {
                acc.total_fixes++;
                if (curr.type === 'GAP_FILL') acc.gaps_filled++;
                if (curr.type === 'IMAGE_RESCUE') acc.images_rescued++;
                return acc;
            }, { total_fixes: 0, gaps_filled: 0, images_rescued: 0 });

            setData({ metrics, history: history.slice(0, 50) });
        }
    } catch (e) {
        console.error('Failed to fetch guardian history', e);
    }
    setFetching(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
        startTransition(() => {
            fetchHistory();
        });
    }
  }, [isAuthenticated, user, fetchHistory]);

  if (loading || fetching && data.history.length === 0) {
    return (
        <div className="main-wrapper titan-bg">
            <Header />
            <div className="system-center-industrial">
                <div className="titan-loader-pulse"></div>
                <p className="loading-status-hint">Đang kết nối với Guardian Network...</p>
            </div>
        </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
        <div className="main-wrapper titan-bg">
            <Header />
            <div className="system-center-industrial">
                <AlertCircle size={60} color="var(--accent)" />
                <h1 className="system-title-industrial">TRUY CẬP HẠN CHẾ</h1>
                <p className="system-desc-industrial">Vùng dữ liệu này được bảo vệ bởi Guardian Autopilot.</p>
            </div>
        </div>
    );
  }

  return (
    <main className="main-wrapper titan-bg admin-page">
      <Header />
      
      <div className="container guardian-container fade-in">
        <header className="admin-header-industrial fade-up">
            <div className="header-left">
                <div className="guardian-status-tag">
                    <div className="status-dot-active"></div>
                    <span className="status-text-active">GUARDIAN_ONLINE</span>
                </div>
                <h1 className="admin-title-industrial">TRUNG TÂM PHỤC HỒI</h1>
                <p className="admin-subtitle">Chi tiết lịch sử xử lý và khắc phục sự cố dữ liệu tự động của Autopilot.</p>
            </div>
            <button className="btn btn-outline rotate-hover-titan" onClick={fetchHistory}>
                <RefreshCcw size={18} /> LÀM MỚI DỮ LIỆU
            </button>
        </header>

        <section className="recovery-metrics-grid fade-in">
            <div className="metric-card-titan shadow-titan">
                <div className="metric-label-titan"><Activity size={14} /> SỰ CỐ ĐÃ XỬ LÝ (24H)</div>
                <div className="metric-value-titan">{data.metrics.total_fixes || 0}</div>
                <p className="metric-desc-titan">Dữ liệu được hệ thống tự động nhận diện và khắc phục thành công.</p>
            </div>
            <div className="metric-card-titan shadow-titan">
                <div className="metric-label-titan"><Search size={14} /> VÁ CHƯƠNG TRỐNG</div>
                <div className="metric-value-titan">{data.metrics.gaps_filled || 0}</div>
                <p className="metric-desc-titan">Số lượng chương truyện bị thiếu đã được đồng bộ hóa bổ sung.</p>
            </div>
            <div className="metric-card-titan shadow-titan">
                <div className="metric-label-titan"><ShieldCheck size={14} /> IMAGE_RESCUE</div>
                <div className="metric-value-titan">{data.metrics.images_rescued || 0}</div>
                <p className="metric-desc-titan">Hình ảnh lỗi hoặc không khả dụng đã được khôi phục từ nguồn dự phòng.</p>
            </div>
        </section>

        <section className="recovery-log-wrapper shadow-titan fade-up">
            <div className="recovery-log-header">
                <h3 className="recovery-log-title">📂 NHẬT KÝ HOẠT ĐỘNG CHI TIẾT</h3>
                <div className="recovery-log-hint">Hiển thị 50 bản ghi đồng bộ gần nhất</div>
            </div>
            <div className="recovery-table-container">
                <table className="recovery-table">
                    <thead>
                        <tr>
                            <th>THỜI GIAN</th>
                            <th>LOẠI PHỤC HỒI</th>
                            <th>CHI TIẾT SỰ KIỆN</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.history.length === 0 ? (
                            <tr>
                                <td colSpan="3" className="empty-log-cell">Guardian chưa ghi nhận hoạt động phục hồi nào trong phiên này.</td>
                            </tr>
                        ) : data.history.map((log, idx) => (
                            <tr key={log.id} style={{ '--delay': `${idx * 0.03}s` }}>
                                <td>
                                    <div className="log-time-box">
                                        <Clock size={12} className="opacity-0-3" />
                                        <span className="log-time-tag">{new Date(log.created_at).toLocaleString('vi-VN')}</span>
                                    </div>
                                </td>
                                <td>
                                    <span className="fix-type-badge">{log.type}</span>
                                </td>
                                <td>
                                    <div className="log-message-titan">{log.message}</div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
      </div>

      <Footer />
      <style jsx>{`
        .rotate-hover-titan:hover :global(svg) { transform: rotate(180deg); }
        .rotate-hover-titan :global(svg) { transition: transform 0.5s; }
        .empty-log-cell { text-align: center; padding: 60px; color: rgba(255,255,255,0.2); font-weight: 800; font-style: italic; }
        .log-time-box { display: flex; align-items: center; gap: 8px; }
        .opacity-0-3 { opacity: 0.3; }
        .recovery-table tr { animation: fadeLeft 0.5s both var(--delay); }
        @keyframes fadeLeft { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </main>
  );
}

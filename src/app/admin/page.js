'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ToastProvider';
import Link from 'next/link';
import { 
    Users, 
    BookOpen, 
    Layers, 
    Gift, 
    ArrowRight, 
    Activity, 
    ShieldAlert, 
    Zap, 
    RefreshCcw,
    Database,
    Lock
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const { addToast } = useToast();
  const [stats, setStats] = useState(null);
  const [crawlLoading, setCrawlLoading] = useState(false);

  useEffect(() => {
    const fetchStats = () => {
        if (isAuthenticated && user?.role === 'admin') {
            fetch('/api/admin/stats')
              .then(res => res.json())
              .then(data => setStats(data))
              .catch(err => console.error('Failed to fetch admin stats', err));
        }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Auto-poll every 30s
    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  const triggerCrawl = async () => {
    setCrawlLoading(true);
    try {
        const res = await fetch('/api/crawl', { method: 'POST' });
        const data = await res.json();
        
        if (res.ok) {
            addToast(data.message || 'Đã kích hoạt tiến trình quét dữ liệu tự động!', 'success');
            // Refresh stats after a short delay to show pending tasks
            setTimeout(() => {
                fetch('/api/admin/stats')
                  .then(res => res.json())
                  .then(d => setStats(d));
            }, 2000);
        } else {
            addToast(data.error || 'Kích hoạt thất bại. Vui lòng kiểm tra log.', 'error');
        }
    } catch (e) {
        addToast('Lỗi kết nối máy chủ.', 'error');
    } finally {
        setCrawlLoading(false);
    }
  };

  if (loading) {
    return (
        <div className="main-wrapper titan-bg">
            <Header />
            <div className="system-center-industrial">
                <div className="titan-loader-pulse"></div>
                <p className="loading-status-hint">Đang xác thực quyền quản trị...</p>
            </div>
        </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
        <div className="main-wrapper titan-bg">
            <Header />
            <div className="system-center-industrial">
                <Lock size={60} color="var(--accent)" />
                <h1 className="system-title-industrial">BẢO MẬT TỐI CAO</h1>
                <p className="system-desc-industrial">Khu vực này chỉ dành cho các quản trị viên cấp cao của hệ thống.</p>
                <Link href="/" className="btn btn-primary">QUAY LẠI TRANG CHỦ</Link>
            </div>
        </div>
    );
  }

  const dbLoadPercent = Math.min(100, (stats?.syncsLastHour || 0) * 2);

  return (
    <main className="main-wrapper titan-bg admin-page">
      <Header />
      
      <div className="container admin-container fade-in">
        <header className="admin-header-industrial fade-up">
            <div className="header-left">
                <div className="library-badge-titan">SYSTEM OVERWATCH</div>
                <h1 className="admin-title-industrial">DASHBOARD QUẢN TRỊ</h1>
                <p className="admin-subtitle">Chi tiết các chỉ số vận hành & hiệu suất hệ thống thời gian thực.</p>
            </div>
            <div className="header-right">
                <button 
                    onClick={() => {
                        setStats(null);
                        fetch('/api/admin/stats').then(res => res.json()).then(d => setStats(d));
                    }}
                    className="btn-icon-titan" 
                    title="Làm mới dữ liệu"
                >
                    <RefreshCcw size={18} className={!stats ? 'spin-titan' : ''} />
                </button>
            </div>
        </header>

        <section className="admin-stats-grid-industrial">
            <div className="admin-stat-node-industrial fade-in" style={{ '--delay': '0s' }}>
                <div className="admin-stat-label-industrial"><Users size={14} /> TỔNG NGƯỜI DÙNG</div>
                <div className="admin-stat-value-industrial">
                    {stats ? stats.totalUsers?.toLocaleString() : <span className="skeleton-text-titan">...</span>}
                </div>
            </div>
            <div className="admin-stat-node-industrial fade-in" style={{ '--delay': '0.05s' }}>
                <div className="admin-stat-label-industrial"><BookOpen size={14} /> TỔNG ĐẦU TRUYỆN</div>
                <div className="admin-stat-value-industrial">
                    {stats ? stats.totalManga?.toLocaleString() : <span className="skeleton-text-titan">...</span>}
                </div>
            </div>
            <div className="admin-stat-node-industrial fade-in" style={{ '--delay': '0.1s' }}>
                <div className="admin-stat-label-industrial"><Layers size={14} /> TỔNG CHƯƠNG</div>
                <div className="admin-stat-value-industrial">
                    {stats ? stats.totalChapters?.toLocaleString() : <span className="skeleton-text-titan">...</span>}
                </div>
            </div>
            <div className="admin-stat-node-industrial accent-node fade-in" style={{ '--delay': '0.15s' }}>
                <div className="admin-stat-label-industrial"><Gift size={14} /> ĐANG ĐỢI ĐỔI QUÀ</div>
                <div className="admin-stat-value-industrial">
                    {stats ? stats.pendingRewards : <span className="skeleton-text-titan">...</span>}
                </div>
                <Link href="/admin/rewards" className="stat-action-link-titan">
                    Quản lý ngay <ArrowRight size={14} />
                </Link>
            </div>
        </section>

        <section className="admin-action-grid-industrial">
            <div className="admin-card-industrial shadow-titan fade-up">
                <h2 className="admin-card-title-industrial"><Activity size={20} color="var(--accent)" /> QUẢN LÝ VẬN HÀNH</h2>
                
                <div className="monitored-task-box-industrial">
                    <div className="task-stat-line">
                        <span className="task-stat-label-industrial">Tasks Pending:</span>
                        <span className={`task-stat-value-titan ${stats?.taskPending > 0 ? 'status-pending' : ''}`}>
                            {stats?.taskPending || 0}
                        </span>
                    </div>
                    <div className="task-stat-line">
                        <span className="task-stat-label-industrial">Failed Tasks:</span>
                        <span className={`task-stat-value-titan ${stats?.taskFailed > 0 ? 'status-rejected' : ''}`}>
                            {stats?.taskFailed || 0}
                        </span>
                    </div>
                    <div className="task-stat-line">
                        <span className="task-stat-label-industrial">Syncs/Hour:</span>
                        <span className="task-stat-value-titan status-approved">
                            {stats?.syncsLastHour || 0}
                        </span>
                    </div>
                </div>

                <div className="admin-action-footer-titan">
                    <button 
                        onClick={triggerCrawl} 
                        disabled={crawlLoading} 
                        className="btn btn-primary full-width-titan"
                    >
                        {crawlLoading ? <RefreshCcw className="spin-titan" size={18} /> : <Zap size={18} />}
                        KÍCH HOẠT QUÉT DỮ LIỆU
                    </button>
                    <div className="action-hint-titan">Thao tác này sẽ ép buộc Guardian Autopilot khởi chạy ngay lập tức.</div>
                </div>
            </div>

            <div className="admin-card-industrial shadow-titan fade-up">
                <h2 className="admin-card-title-industrial"><ShieldAlert size={20} color="#f87171" /> NHẬT KÝ LỖI HỆ THỐNG</h2>
                
                <div className="failure-log-mini-industrial">
                    <div className="failure-log-title">RECENT_SYNC_FAILURES:</div>
                    {stats?.failures && stats.failures.length > 0 ? stats.failures.map((f, i) => (
                        <div key={f.id || i} className="failure-entry-industrial fade-in" style={{ '--delay': `${i * 0.1}s` }}>
                            <span className="err-type-tag">[{f.type || 'ERR'}]</span> {f.last_error?.substring(0, 70)}...
                        </div>
                    )) : (
                        <div className="empty-log-titan">Hoạt động bình thường.</div>
                    )}
                </div>

                <div className="heatmap-engine-industrial shadow-inner-titan">
                    <div className="heatmap-header-titan">
                        <div className="heatmap-label-titan"><Database size={14} /> DB_LOAD_INDICATOR</div>
                        <div className="heatmap-value-titan">{dbLoadPercent}%</div>
                    </div>
                    <div className="heatmap-track-titan">
                        <div className="heatmap-pulse-titan" style={{ width: `${dbLoadPercent}%`, background: dbLoadPercent > 80 ? '#f87171' : 'var(--accent)' }}></div>
                    </div>
                </div>
            </div>
        </section>
      </div>

      <Footer />
      <style jsx>{`
        .admin-header-industrial { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; }
        .btn-icon-titan { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; width: 45px; height: 45px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s; }
        .btn-icon-titan:hover { background: var(--accent); border-color: var(--accent); transform: rotate(30deg); }
        .skeleton-text-titan { opacity: 0.2; }
        .stat-action-link-titan { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; font-weight: 950; color: var(--accent); text-decoration: none; margin-top: 20px; transition: all 0.3s; }
        .stat-action-link-titan:hover { transform: translateX(5px); }
        .full-width-titan { width: 100%; height: 55px; display: flex; align-items: center; justify-content: center; gap: 12px; font-weight: 950; letter-spacing: 1px; }
        .action-hint-titan { font-size: 0.7rem; color: rgba(255,255,255,0.2); margin-top: 15px; text-align: center; }
        .err-type-tag { color: var(--accent); font-weight: 900; font-size: 0.7rem; }
        .empty-log-titan { opacity: 0.3; padding: 20px; text-align: center; font-style: italic; }
        .heatmap-header-titan { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .heatmap-label-titan { font-size: 0.65rem; color: rgba(255,255,255,0.2); font-weight: 950; letter-spacing: 2px; }
        .heatmap-value-titan { font-size: 0.65rem; color: var(--accent); font-weight: 950; }
        .heatmap-track-titan { width: 100%; height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px; overflow: hidden; }
        .heatmap-pulse-titan { height: 100%; border-radius: 2px; box-shadow: 0 0 10px currentColor; transition: width 1s ease-in-out; animation: scan 3s infinite linear; }
        .spin-titan { animation: spin 1s infinite linear; }
        @keyframes scan { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .fade-in { animation: fadeIn 0.8s both var(--delay, 0s); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </main>
  );
}

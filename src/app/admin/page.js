'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import Header from '@/GiaoDien/BoCuc/Header';
import Footer from '@/GiaoDien/BoCuc/Footer';
import { useAuth } from '@/NguCanh/AuthContext';
import { useToast } from '@/GiaoDien/TienIch/ToastProvider';
import Link from 'next/link';
import './admin.css';
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
  const [isPending, startTransition] = useTransition();

  const fetchStats = useCallback(async (silent = false) => {
    if (!isAuthenticated || user?.role !== 'admin') return;
    
    try {
        const res = await fetch('/api/admin/stats');
        if (res.ok) {
            const data = await res.json();
            startTransition(() => {
                setStats({ ...data, lastFetched: new Date() });
            });
        }
    } catch (err) {
        console.error('[TITAN ERROR] Failed to fetch admin stats:', err.message);
        if (!silent) addToast('Khà´ng thoƒ tải dữ liệu quản tro‹.', 'error');
    }
  }, [isAuthenticated, user?.role, addToast]);

  useEffect(() => {
    fetchStats(true);
    const interval = setInterval(() => fetchStats(true), 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const triggerCrawl = async () => {
    setCrawlLoading(true);
    try {
        const res = await fetch('/api/crawl', { method: 'POST' });
        const data = await res.json();
        
        if (res.ok) {
            addToast(data.message || 'Äà£ kà­ch hoáº¡t tiáº¿n trà¬nh quà©t dữ liệu tực Ä‘o™ng!', 'success');
            setTimeout(() => fetchStats(true), 2000);
        } else {
            addToast(data.error || 'Kà­ch hoáº¡t tháº¥t báº¡i. Vui lòng kioƒm tra log.', 'error');
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
                <p className="loading-status-hint">Äang xác thựcc quyon quản tro‹...</p>
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
                <h1 className="system-title-industrial">Báº¢O Máº¬T ToI CAO</h1>
                <p className="system-desc-industrial">Khu vựcc nà y cho‰ dà nh cho các quản tro‹ viên cấp cao của hệ thống.</p>
                <Link href="/" className="btn btn-primary">QUAY Láº I TRANG CHo¦</Link>
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
                <h1 className="admin-title-industrial">DASHBOARD QUáº¢N TRoŠ</h1>
                <div className="admin-meta-info-titan">
                    <p className="admin-subtitle">Cho‰ so‘ váº­n hà nh hệ thống thoi gian thựcc.</p>
                    {stats?.lastFetched && (
                        <div className="last-sync-tag-titan fade-in">
                            <Database size={12} className="opacity-0-5" />
                            Dữ liệu vừa cập nhật: {stats.lastFetched.toLocaleTimeString('vi-VN')}
                        </div>
                    )}
                </div>
            </div>
            <div className="header-right">
                <button 
                    onClick={() => {
                        startTransition(() => { setStats(null); });
                        fetchStats();
                    }}
                    className="btn-icon-titan" 
                    disabled={isPending}
                    title="Là m mo›i dữ liệu"
                >
                    <RefreshCcw size={18} className={isPending || !stats ? 'spin-titan' : ''} />
                </button>
            </div>
        </header>

        <section className="admin-stats-grid-industrial">
            <div className="admin-stat-node-industrial fade-in" style={{ '--delay': '0s' }}>
                <div className="admin-stat-label-industrial"><Users size={14} /> To”NG NGÆ¯oœI Dà™NG</div>
                <div className="admin-stat-value-industrial">
                    {stats ? (stats.totalUsers ?? 0).toLocaleString() : <span className="skeleton-text-titan">...</span>}
                </div>
            </div>
            <div className="admin-stat-node-industrial fade-in" style={{ '--delay': '0.05s' }}>
                <div className="admin-stat-label-industrial"><BookOpen size={14} /> To”NG Äáº¦U TRUYộN</div>
                <div className="admin-stat-value-industrial">
                    {stats ? (stats.totalManga ?? 0).toLocaleString() : <span className="skeleton-text-titan">...</span>}
                </div>
            </div>
            <div className="admin-stat-node-industrial fade-in" style={{ '--delay': '0.1s' }}>
                <div className="admin-stat-label-industrial"><Layers size={14} /> To”NG CHÆ¯Æ NG</div>
                <div className="admin-stat-value-industrial">
                    {stats ? (stats.totalChapters ?? 0).toLocaleString() : <span className="skeleton-text-titan">...</span>}
                </div>
            </div>
            <div className="admin-stat-node-industrial accent-node fade-in" style={{ '--delay': '0.15s' }}>
                <div className="admin-stat-label-industrial"><Gift size={14} /> ÄANG Äo¢I Äo”I QUà€</div>
                <div className="admin-stat-value-industrial">
                    {stats ? (stats.pendingRewards ?? 0).toLocaleString() : <span className="skeleton-text-titan">...</span>}
                </div>
                <Link href="/admin/rewards" className="stat-action-link-titan">
                    Quản là½ ngay <ArrowRight size={14} />
                </Link>
            </div>
        </section>

        <section className="admin-action-grid-industrial">
            <div className="admin-card-industrial shadow-titan fade-up">
                <h2 className="admin-card-title-industrial"><Activity size={20} color="var(--accent)" /> QUáº¢N Là Váº¬N Hà€NH</h2>
                
                <div className="monitored-task-box-industrial">
                    <div className="task-stat-line">
                        <span className="task-stat-label-industrial">Tasks Pending:</span>
                        <span className={`task-stat-value-titan ${(stats?.taskPending ?? 0) > 0 ? 'status-pending' : ''}`}>
                            {stats?.taskPending ?? 0}
                        </span>
                    </div>
                    <div className="task-stat-line">
                        <span className="task-stat-label-industrial">Failed Tasks:</span>
                        <span className={`task-stat-value-titan ${(stats?.taskFailed ?? 0) > 0 ? 'status-rejected' : ''}`}>
                            {stats?.taskFailed ?? 0}
                        </span>
                    </div>
                    <div className="task-stat-line">
                        <span className="task-stat-label-industrial">Syncs/Hour:</span>
                        <span className="task-stat-value-titan status-approved">
                            {stats?.syncsLastHour ?? 0}
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
                        KàCH HOáº T QUà‰T DoŠCH Vo¤
                    </button>
                    <div className="action-hint-titan">Thao tác nà y sáº½ à©p buo™c Guardian Autopilot khoŸi cháº¡y ngay láº­p to©c.</div>
                </div>
            </div>

            <div className="admin-card-industrial shadow-titan fade-up">
                <h2 className="admin-card-title-industrial"><ShieldAlert size={20} color="#f87171" /> NHáº¬T Kà Lo–I Hộ THoNG</h2>
                
                <div className="failure-log-mini-industrial">
                    <div className="failure-log-title">RECENT_SYNC_FAILURES:</div>
                    {stats?.failures && stats.failures.length > 0 ? stats.failures.map((f, i) => (
                        <div key={f.id || i} className="failure-entry-industrial fade-in" style={{ '--delay': `${i * 0.1}s` }}>
                            <span className="err-type-tag">[{f.type || 'ERR'}]</span> {f.last_error?.toString()?.substring(0, 70) || 'Unknown error details'}...
                        </div>
                    )) : (
                        <div className="empty-log-titan">Hoáº¡t Ä‘o™ng bà¬nh thưong.</div>
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
    </main>
  );
}


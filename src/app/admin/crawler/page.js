'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
    Zap, 
    ShieldCheck, 
    Cpu, 
    Activity, 
    RefreshCcw, 
    Flame, 
    Rocket, 
    ShieldQuestion,
    ChevronRight,
    AlertCircle
} from 'lucide-react';

export default function AdminCrawlerPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const [telemetry, setTelemetry] = useState(null);
  const [ramUsage, setRamUsage] = useState(0);
  const [fetching, setFetching] = useState(true);
  const router = useRouter();

  const fetchData = async () => {
    setFetching(true);
    try {
        const res = await fetch('/api/admin/crawler/telemetry');
        if (res.ok) {
            const data = await res.json();
            setTelemetry(data);
            setRamUsage(data.ramUsage || 0);
        }
    } catch (e) {
        console.error('Failed to fetch crawler telemetry', e);
    }
    setFetching(false);
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
        fetchData();
        const timer = setInterval(fetchData, 10000);
        return () => clearInterval(timer);
    }
  }, [isAuthenticated, user]);

  const triggerDeepScan = async (pages) => {
    try {
        await fetch('/api/crawl', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pages })
        });
        alert(`Đã kích hoạt deep scan ${pages} trang!`);
    } catch (e) {
        alert('Lỗi khi kích hoạt deep scan.');
    }
  };

  if (loading || (fetching && !telemetry)) {
    return (
        <div className="main-wrapper titan-bg">
            <Header />
            <div className="system-center-industrial">
                <div className="titan-loader-pulse"></div>
                <p className="loading-status-hint">Đang thiết lập kết nối Telemetry...</p>
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
                <h1 className="system-title-industrial">TRUY CẬP BỊ TỪ CHỐI</h1>
                <p className="system-desc-industrial">Vùng giám sát Crawler chỉ dành cho nhân sự vận hành hệ thống.</p>
            </div>
        </div>
    );
  }

  return (
    <main className="main-wrapper titan-bg admin-page">
      <Header />
      
      <div className="container crawler-container fade-in">
        <header className="crawler-header-industrial fade-up">
            <div className="header-left">
                <div className="library-badge-titan">CRAWLER COMMAND CENTER</div>
                <h1 className="crawler-title-industrial">GIÁM SÁT TELEMETRY</h1>
                <p className="admin-subtitle">Hệ thống quản lý và thu thập dữ liệu tự động thời gian thực.</p>
            </div>
            <div className="status-badges-group">
                <div className="status-badge-titan active shadow-titan">
                    <div className="status-dot-active"></div>
                    AUTO-CRAWL: ACTIVE
                </div>
                <div className={`status-badge-titan shadow-titan ${ramUsage > 500 ? 'warning' : 'active'}`}>
                    <Cpu size={14} /> MEM_USAGE: {ramUsage}MB
                </div>
                <button className="btn btn-outline rotate-hover-titan" onClick={fetchData}>
                    <RefreshCcw size={16} />
                </button>
            </div>
        </header>

        <section className="crawler-stats-grid fade-in">
            <div className="telemetry-card-titan shadow-titan">
                <div className="telemetry-label-titan"><Activity size={14} /> DISCOVERY ENGINE</div>
                <div className="telemetry-flex">
                    <div className="telemetry-value-industrial">
                        PAGE <span className="accent">{telemetry?.discoveryPage || 1}</span>
                        <span className="limit-tag">/ 500</span>
                    </div>
                    <div className="discovery-ring-box">
                        <div className="scanning-pulse-ring"></div>
                        <Zap size={24} color="var(--accent)" />
                    </div>
                </div>
                <div className="pulse-banner-titan">
                    {telemetry?.isArchivalPulse ? 'MOD: ARCHIVAL_PULSE' : 'MOD: RECENT_ONLY'}
                </div>
            </div>

            <div className="telemetry-card-titan shadow-titan">
                <div className="telemetry-label-titan"><Rocket size={14} /> HÀNH ĐỘNG NHANH</div>
                <div className="action-grid-mini-industrial">
                    <div className="action-node-mini-titan" onClick={() => triggerDeepScan(20)}>
                        <Rocket className="icon" color="var(--accent)" />
                        <span>QUÉT 20 TRANG</span>
                        <div className="sub-label">Discovery sâu</div>
                    </div>
                    <div className="action-node-mini-titan" onClick={() => triggerDeepScan(50)}>
                        <Flame className="icon" color="#f59e0b" />
                        <span>QUÉT 50 TRANG</span>
                        <div className="sub-label">Phủ sóng rộng</div>
                    </div>
                    <div className="action-node-mini-titan" onClick={() => router.push('/admin/guardian')}>
                        <ShieldCheck className="icon" color="#10b981" />
                        <span>GUARDIAN</span>
                        <div className="sub-label">Phục hồi dữ liệu</div>
                    </div>
                </div>
            </div>
        </section>

        <section className="admin-card-industrial shadow-titan fade-up">
            <h2 className="admin-card-title-industrial"><ShieldQuestion size={20} color="var(--accent)" /> CẤU HÌNH CRAWLER</h2>
            <div className="config-grid-titan">
                <div className="config-item-titan">
                    <div className="config-label-titan">TARGET_SOURCES</div>
                    <div className="config-value-titan">NetTruyen, TruyenQQ</div>
                </div>
                <div className="config-item-titan">
                    <div className="config-label-titan">CONCURRENCY_LIMIT</div>
                    <div className="config-value-titan">15 Workers</div>
                </div>
                <div className="config-item-titan">
                    <div className="config-label-titan">SYNC_INTERVAL</div>
                    <div className="config-value-titan">300 Seconds</div>
                </div>
                <div className="config-item-titan">
                    <div className="config-label-titan">PROTOCOL_VERSION</div>
                    <div className="config-value-titan">TITAN_V2.1.0_PROD</div>
                </div>
            </div>
        </section>
      </div>

      <Footer />
      <style jsx>{`
        .status-badges-group { display: flex; gap: 15px; align-items: center; }
        .telemetry-flex { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .limit-tag { font-size: 0.9rem; opacity: 0.2; margin-left: 10px; }
        .pulse-banner-titan { font-size: 0.65rem; font-weight: 950; background: rgba(139, 92, 246, 0.1); color: #a78bfa; padding: 6px 12px; border-radius: 4px; display: inline-block; letter-spacing: 1px; }
        .config-grid-titan { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 30px; }
        .config-label-titan { font-size: 0.7rem; font-weight: 950; color: rgba(255,255,255,0.2); letter-spacing: 2px; margin-bottom: 8px; }
        .config-value-titan { font-size: 1rem; font-weight: 850; color: white; }
        .rotate-hover-titan { width: 45px; height: 45px; display: flex; alignItems: center; justifyContent: center; padding: 0; }
        .rotate-hover-titan:hover :global(svg) { transform: rotate(180deg); }
        .rotate-hover-titan :global(svg) { transition: transform 0.5s; }
      `}</style>
    </main>
  );
}

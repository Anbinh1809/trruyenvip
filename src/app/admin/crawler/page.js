'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import Header from '@/GiaoDien/BoCuc/Header';
import Footer from '@/GiaoDien/BoCuc/Footer';
import { useAuth } from '@/NguCanh/AuthContext';
import { useRouter } from 'next/navigation';
import '../admin.css';
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
    AlertCircle,
    Database
} from 'lucide-react';
import { useToast } from '@/GiaoDien/TienIch/ToastProvider';

export default function AdminCrawlerPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const { addToast } = useToast();
  const [telemetry, setTelemetry] = useState(null);
  const [ramUsage, setRamUsage] = useState(0);
  const [fetching, setFetching] = useState(true);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const fetchData = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
        startTransition(() => {
            fetchData();
        });
        const timer = setInterval(fetchData, 10000);
        return () => clearInterval(timer);
    }
  }, [isAuthenticated, user, fetchData]);

  const triggerDeepScan = async (pages) => {
    try {
        await fetch('/api/crawl', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pages })
        });
        addToast(`Äà£ kà­ch hoáº¡t deep scan ${pages} trang!`, 'success');
    } catch (e) {
        addToast('Lo—i khi kà­ch hoáº¡t deep scan.', 'error');
    }
  };

  const triggerAction = async (action) => {
    try {
        const res = await fetch('/api/admin/crawler/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action })
        });
        const data = await res.json();
        if (res.ok) {
            addToast(data.message || 'Lệnh đã Ä‘ưo£c gửi thành công!', 'success');
            fetchData();
        } else {
            addToast('Lo—i: ' + (data.error || 'Yêu cáº§u không thoƒ hoà n thà nh.'), 'error');
        }
    } catch (e) {
        addToast('Lỗi kết nối máy chủ.', 'error');
    }
  };

  if (loading || (fetching && !telemetry)) {
    return (
        <div className="main-wrapper titan-bg">
            <Header />
            <div className="system-center-industrial">
                <div className="titan-loader-pulse"></div>
                <p className="loading-status-hint">Äang thiáº¿t láº­p kết nối Telemetry...</p>
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
                <h1 className="system-title-industrial">TRUY CẬP BoŠ Toª CHoI</h1>
                <p className="system-desc-industrial">Và¹ng giám sát Crawler cho‰ dà nh cho nhà¢n sực váº­n hà nh hệ thống.</p>
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
                <h1 className="crawler-title-industrial">GIàM SàT TELEMETRY</h1>
                <p className="admin-subtitle">Hệ tho‘ng quản là½ và  thu tháº­p dữ liệu tực Ä‘o™ng thoi gian thựcc.</p>
            </div>
            <div className="status-badges-group">
                <div className={`status-badge-titan shadow-titan ${telemetry?.status && telemetry.status !== 'idle' ? 'active' : ''}`}>
                    <div className={telemetry?.status && telemetry.status !== 'idle' ? 'status-dot-active' : 'status-dot-idle'}></div>
                    AUTOPILOT: {telemetry?.status?.toUpperCase() || 'IDLE'}
                </div>
                <div className={`status-badge-titan shadow-titan ${ramUsage > 1000 ? 'warning' : 'active'}`}>
                    <Database size={14} /> RAM: {ramUsage}MB
                </div>
                <button className="btn btn-outline rotate-hover-titan" onClick={fetchData}>
                    <RefreshCcw size={16} />
                </button>
            </div>
        </header>

        <section className="crawler-actions-industrial fade-up shadow-titan">
            <h2 className="section-subtitle-industrial"><Cpu size={18} /> CÆ  CHáº¾ TàC CHIáº¾N</h2>
            <div className="action-button-grid-titan">
                <button 
                    className={`btn-action-titan ${telemetry?.status && telemetry.status !== 'idle' ? 'dimmed' : 'active'}`}
                    onClick={() => triggerAction('start_autopilot')}
                    disabled={telemetry?.status && telemetry.status !== 'idle'}
                >
                    <Rocket size={20} />
                    <div className="action-text">
                        <span className="action-title">KàCH HOáº T AUTOPILOT</span>
                        <span className="action-desc">Cháº¡y và²ng láº·p Guardian tực Ä‘o™ng</span>
                    </div>
                </button>

                <button 
                    className="btn-action-titan active"
                    onClick={() => triggerAction('force_discovery')}
                >
                    <Flame size={20} />
                    <div className="action-text">
                        <span className="action-title">QUà‰T TRANG MỚI</span>
                        <span className="action-desc">Discovery Page 1 - 5 (Æ¯u tiên)</span>
                    </div>
                </button>

                <button 
                    className="btn-action-titan"
                    onClick={() => triggerAction('maintenance')}
                >
                    <ShieldCheck size={20} />
                    <div className="action-text">
                        <span className="action-title">DoŒN Dáº¸P Hộ THoNG</span>
                        <span className="action-desc">Prune Logs & Orphaned Records</span>
                    </div>
                </button>
            </div>
        </section>

        <section className="crawler-stats-grid fade-in">
            <div className="telemetry-card-titan shadow-titan">
                <div className="telemetry-label-titan"><Activity size={14} /> DISCOVERY ENGINE</div>
                <div className="telemetry-flex">
                    <div className="telemetry-value-industrial">
                        PAGE <span className="accent">{telemetry?.discoveryPage || 1}</span>
                        <span className="limit-tag">/ 500</span>
                    </div>
                    <div className="discovery-ring-box">
                        <div className={telemetry?.status === 'guardian_discovery' ? 'scanning-pulse-ring' : ''}></div>
                        <Zap size={24} color={telemetry?.status === 'guardian_discovery' ? 'var(--accent)' : 'rgba(255,255,255,0.1)'} />
                    </div>
                </div>
                <div className="pulse-banner-titan">
                    {telemetry?.isArchivalPulse ? 'MOD: ARCHIVAL_PULSE' : 'MOD: RECENT_ONLY'}
                </div>
            </div>

            <div className="telemetry-card-titan shadow-titan">
                <div className="telemetry-label-titan"><Zap size={14} /> WORKER STATUS</div>
                <div className="telemetry-flex">
                    <div className="telemetry-value-industrial">
                        <span className="accent">{telemetry?.activeWorkers || 0}</span>
                        <span className="limit-tag">/ {telemetry?.concurrencyLimit || 128}</span>
                    </div>
                    <div className="worker-load-indicator">
                        <div className="load-fill" style={{ width: `${Math.min(100, ((telemetry?.activeWorkers || 0) / (telemetry?.concurrencyLimit || 128)) * 100)}%` }}></div>
                    </div>
                </div>
                <div className="pulse-banner-titan">
                    {telemetry?.status === 'scraping_images' ? `SCRAPING: ${telemetry.currentManga?.substring(0, 20)}...` : 'WAITING_FOR_TASKS'}
                </div>
            </div>
        </section>

        <section className="admin-card-industrial shadow-titan fade-up">
            <h2 className="admin-card-title-industrial"><ShieldQuestion size={20} color="var(--accent)" /> Cáº¤U HàŒNH CRAWLER</h2>
            <div className="config-grid-titan">
                <div className="config-item-titan">
                    <div className="config-label-titan">TARGET_SOURCES</div>
                    <div className="config-value-titan">NetTruyen, TruyenQQ</div>
                </div>
                <div className="config-item-titan">
                    <div className="config-label-titan">ADAPTIVE_LIMIT</div>
                    <div className="config-value-titan">{telemetry?.concurrencyLimit || 128} Weight Units</div>
                </div>
                <div className="config-item-titan">
                    <div className="config-label-titan">HEARTBEAT</div>
                    <div className="config-value-titan">60-600s Industrial</div>
                </div>
                <div className="config-item-titan">
                    <div className="config-label-titan">PROTOCOL_VERSION</div>
                    <div className="config-value-titan">TITAN_V2.2.0_INDUSTRIAL</div>
                </div>
            </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}


'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CrawlerDashboard() {
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const router = useRouter();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ today: 0, success: 0, total: 0, flagged: 0 });
    const [telemetry, setTelemetry] = useState(null);
    const [ramUsage, setRamUsage] = useState(null);

    const fetchData = useCallback(async (signal) => {
        try {
            const res = await fetch('/api/admin/crawler/stats?limit=50', { signal });
            if (res.ok) {
                const json = await res.json();
                setData(json);
                setStats({
                    today: (json.summary?.total_logs || 0) + (json.summary?.total_images_today || 0),
                    success: json.summary?.success_logs || 0,
                    total: json.counts?.total_chapters || 0,
                    flagged: json.counts?.total_reports || 0
                });
            }
        } catch (e) {
            if (e.name !== 'AbortError') console.error('Fetch error:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchTelemetry = useCallback(async (signal) => {
        try {
            const res = await fetch('/api/admin/crawler/telemetry', { signal });
            if (res.ok) {
                const json = await res.json();
                setTelemetry(json.state);
                if (json.memoryMB) setRamUsage(json.memoryMB);
            }
        } catch (e) {
            if (e.name !== 'AbortError') console.error('Telemetry fetch failed:', e.message);
        }
    }, []);

    const triggerDeepScan = async (pages) => {
        try {
            const res = await fetch('/api/admin/crawler/deep-scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pages, startPage: telemetry?.discoveryPage || 1 })
            });
            if (res.ok) {
                alert(`Kích hoạt cào ${pages} trang thành công!`);
                fetchTelemetry();
            }
        } catch (e) {
            alert('Lỗi kích hoạt Deep Scan');
        }
    };

    useEffect(() => {
        const controller = new AbortController();
        
        // Initial fetch
        fetchData(controller.signal);
        fetchTelemetry(controller.signal);
        
        // Timers: Reduced pressure by 60%
        const statsInterval = setInterval(() => fetchData(controller.signal), 15000);
        const telemetryInterval = setInterval(() => fetchTelemetry(controller.signal), 5000);

        return () => {
            controller.abort();
            clearInterval(statsInterval);
            clearInterval(telemetryInterval);
        };
    }, [fetchData, fetchTelemetry]);

    if (authLoading || (loading && !data)) {
        return (
          <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
            <div className="titan-loader-pulse"></div>
          </div>
        );
    }

    if (!isAuthenticated || user?.role !== 'admin') return null;

    const calculateSpeed = () => {
        if (!telemetry?.startTime || telemetry.successCount === 0 || telemetry.status === 'idle') return '0.0';
        const elapsedSeconds = (Date.now() - telemetry.startTime) / 1000;
        if (elapsedSeconds < 1) return '...';
        
        const eps = telemetry.successCount / elapsedSeconds;
        if (eps >= 1) return `${eps.toFixed(1)} mục/giây`;
        return `${(eps * 60).toFixed(1)} mục/phút`;
    };

    return (
        <main className="admin-page titan-bg" style={{ minHeight: '100vh', paddingBottom: '100px', color: 'white' }}>
            <Header />
            
            <div className="container" style={{ paddingTop: '120px' }}>
                <div className="section-header" style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '10px' }}>Giám sát Crawler</h1>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Hệ thống quản lý và thu thập dữ liệu tự động</p>
                    </div>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        {telemetry?.guardianActive && (
                            <div className="titan-admin-status" style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.2)' }}>
                                <span className="dot-pulse" style={{ background: '#38bdf8' }}></span> Auto-Crawl: ACTIVE
                            </div>
                        )}
                        <div className={`titan-admin-status ${telemetry?.status !== 'idle' ? 'active' : ''}`}>
                            <span className="dot-pulse"></span> {telemetry?.status === 'idle' ? 'IDLE' : 'PROCESSING'}
                        </div>
                        <div className={`titan-admin-status ${ramUsage > 500 ? 'warning' : 'active'}`} style={{ marginLeft: '10px' }}>
                            <span className="dot-pulse" style={{ background: ramUsage > 500 ? '#f59e0b' : '#10b981' }}></span> 
                            {ramUsage ? `${ramUsage}MB RAM` : 'Đang đo...'}
                        </div>
                        <button className="btn btn-outline" style={{ padding: '8px 18px' }} onClick={() => fetchData()}>
                            Làm mới
                        </button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                    {/* Discovery Status Card */}
                    <div className="glass-card" style={{ padding: '25px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--border-radius)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '0.75rem', fontWeight: 900, letterSpacing: '2px', color: 'rgba(255,255,255,0.4)' }}>ROBUST DISCOVERY ENGINE</h3>
                            <div style={{ background: telemetry?.isArchivalPulse ? 'rgba(139, 92, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: telemetry?.isArchivalPulse ? '#a78bfa' : '#10b981', padding: '4px 10px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 900 }}>
                                {telemetry?.isArchivalPulse ? 'ĐANG ĐÀO SÂU' : 'KIỂM TRA TRUYỆN MỚI'}
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '5px' }}>TRANG HIỆN TẠI (ARCHIVE)</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 950, color: 'var(--text-primary)' }}>
                                    PAGE <span style={{ color: 'var(--accent)' }}>{telemetry?.discoveryPage || 1}</span>
                                    <span style={{ fontSize: '0.9rem', opacity: 0.3, marginLeft: '10px' }}>/ 500</span>
                                </div>
                            </div>
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                <div className="scanning-ring" style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', border: '2px solid var(--accent)', borderTopColor: 'transparent', animation: 'spin 2s linear infinite' }}></div>
                                <div style={{ fontSize: '1.2rem' }}>🔎</div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions / Deep Scan Card */}
                    <div className="glass-card" style={{ padding: '25px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--border-radius)' }}>
                        <h3 style={{ fontSize: '0.75rem', fontWeight: 900, letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', marginBottom: '20px' }}>HÀNH ĐỘNG NHANH</h3>
                        <div style={{ display: 'flex', gap: '10px', height: 'calc(100% - 40px)' }}>
                            <button onClick={() => triggerDeepScan(20)} className="btn btn-primary" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '0.8rem' }}>
                                <span style={{ fontSize: '1.5rem' }}>🚀</span>
                                <div><b>QUÉT 20 TRANG</b><br/><small style={{ opacity: 0.7 }}>Discovery sâu</small></div>
                            </button>
                            <button onClick={() => triggerDeepScan(50)} className="btn btn-outline" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '0.8rem' }}>
                                <span style={{ fontSize: '1.5rem' }}>🔥</span>
                                <div><b>QUÉT 50 TRANG</b><br/><small style={{ opacity: 0.7 }}>Phủ sóng</small></div>
                            </button>
                            <button onClick={() => router.push('/admin/guardian')} className="btn btn-outline" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '0.8rem' }}>
                                <span style={{ fontSize: '1.5rem' }}>🛡️</span>
                                <div><b>TUẦN TRA</b><br/><small style={{ opacity: 0.7 }}>Guardian</small></div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mirror Health Intelligence */}
                {data?.mirrorHealth && Object.keys(data.mirrorHealth).length > 0 && (
                    <div className="glass-card" style={{ marginBottom: '40px', padding: '25px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--border-radius)' }}>
                        <h3 style={{ fontSize: '0.75rem', fontWeight: 900, letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', marginBottom: '20px' }}>ĐỘ ỔN ĐỊNH HỆ THỐNG MIRROR</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
                            {Object.entries(data.mirrorHealth).map(([mirror, score]) => (
                                <div key={mirror} style={{ padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--border-radius)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 800, marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={mirror}>
                                        {mirror.replace('https://', '').replace('www.', '')}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontWeight: 950, fontSize: '0.9rem', color: score > 120 ? '#10b981' : (score < 30 ? '#ef4444' : '#f59e0b') }}>
                                            {score} <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>PTS</span>
                                        </div>
                                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', flex: 1, marginLeft: '12px', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div 
                                                style={{ 
                                                    width: `${Math.min(100, (score / 200) * 100)}%`, 
                                                    height: '100%', 
                                                    background: score > 120 ? '#10b981' : (score < 30 ? '#ef4444' : '#f59e0b'),
                                                    boxShadow: `0 0 10px ${score > 120 ? 'rgba(16, 185, 129, 0.4)' : 'transparent'}`
                                                }} 
                                            />
                                        </div>
                                    </div>
                                    {score <= 10 && <div style={{ fontSize: '0.6rem', color: '#ef4444', fontWeight: 900, marginTop: '5px' }}>CÁCH LY</div>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Live Telemetry monitor */}
                <div className="glass-card" style={{ position: 'relative', overflow: 'hidden', padding: '25px', borderRadius: 'var(--border-radius)', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '40px' }}>
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ width: '60%' }}>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
                                <h3 style={{ textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '2px', color: 'var(--accent)' }}>TRẠNG THÁI XỬ LÝ THỜI GIAN THỰC</h3>
                                <div style={{ fontSize: '0.6rem', padding: '2px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', fontWeight: 900 }}>TỰ ĐỘNG CHUYỂN NGUỒN: BẬT</div>
                            </div>
                            <div style={{ marginBottom: '25px' }}>
                                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginBottom: '5px' }}>ĐANG XỬ LÝ TRUYỆN</div>
                                <div style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--accent)' }}>{telemetry?.currentManga || '--'}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '40px' }}>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginBottom: '5px' }}>CHƯƠNG HIỆN TẠI</div>
                                    <div style={{ fontWeight: 800 }}>{telemetry?.currentChapter || '--'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginBottom: '5px' }}>TỐC ĐỘ XỬ LÝ</div>
                                    <div style={{ fontWeight: 800, color: '#10b981' }}>{calculateSpeed()}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginBottom: '5px' }}>CHẾ ĐỘ</div>
                                    <div style={{ fontWeight: 800, color: 'var(--accent)' }}>{telemetry?.status?.toUpperCase() || 'CHỜ'}</div>
                                </div>
                                {telemetry?.guardianNextCycle && (
                                    <div>
                                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginBottom: '5px' }}>QUÉT KẾ TIẾP</div>
                                        <div style={{ fontWeight: 800, color: '#38bdf8' }}>
                                            {new Date(telemetry.guardianNextCycle).toLocaleTimeString('vi-VN')}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right', width: '35%' }}>
                            <div className="titan-image-log">
                                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginBottom: '10px' }}>NHẬT KÝ QUÉT DỮ LIỆU</div>
                                <div style={{ wordBreak: 'break-all', fontSize: '0.85rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.6)' }}>
                                    {telemetry?.currentImage || 'Đang quét ảnh...'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                    <div className="glass-card" style={{ padding: '25px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--border-radius)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.4, marginBottom: '5px' }}>Ảnh & Nhật ký trong ngày</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>{stats.today.toLocaleString()} <span style={{ fontSize: '1rem', opacity: 0.5 }}>sự kiện</span></div>
                    </div>
                    <div className="glass-card" style={{ padding: '25px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--border-radius)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.4, marginBottom: '5px' }}>Tỷ lệ thành công</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10b981' }}>{Math.round((telemetry?.successCount / (telemetry?.successCount + telemetry?.failCount || 1)) * 100)}%</div>
                    </div>
                    <div className="glass-card" style={{ padding: '25px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--border-radius)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.4, marginBottom: '5px' }}>Tổng số truyện</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>{stats.total.toLocaleString()}</div>
                    </div>
                    <div className="glass-card" style={{ padding: '25px', background: 'rgba(255, 62, 62, 0.05)', borderRadius: 'var(--border-radius)', border: '1px solid rgba(255, 62, 62, 0.2)' }}>
                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.6, marginBottom: '5px', color: 'var(--accent)' }}>Chương bị gắn cờ</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent)' }}>{stats.flagged || 0} <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>báo cáo</span></div>
                    </div>
                </div>
                
                {/* Log Feed */}
                <div className="glass-card" style={{ borderRadius: 'var(--border-radius)', padding: '0', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.01)' }}>
                    <div style={{ padding: '25px 30px', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between' }}>
                        <h3 style={{ fontWeight: 800 }}>📂 Nhật ký hệ thống</h3>
                        <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>100 sự kiện gần nhất</span>
                    </div>
                    <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <tbody className="log-tbody">
                                {data?.logs.slice(0, 100).map(log => (
                                    <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '20px', fontSize: '0.8rem', width: '180px', opacity: 0.4 }}>
                                            {new Date(log.created_at).toLocaleTimeString('vi-VN')}
                                        </td>
                                        <td style={{ padding: '20px', width: '120px' }}>
                                            <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 900, background: log.status === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: log.status === 'success' ? '#10b981' : '#ef4444' }}>
                                                {log.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ padding: '20px', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                                            {log.message || ''}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    );
}

'use client';

import Header from '@/components/Header';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ToastProvider';
import Link from 'next/link';

export default function AdminDashboard() {
  const { addToast } = useToast();
  const [stats, setStats] = useState(null);
  const [crawlLoading, setCrawlLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetch('/api/admin/stats')
        .then(res => {
          if (!res.ok) throw new Error('Cấm chế ngăn cản việc truy xuất số liệu');
          return res.json();
        })
        .then(setStats)
        .catch(err => {
          console.error(err);
          addToast(err.message, 'error');
        });
    }
  }, [isAuthenticated, user, addToast]);

  const triggerCrawl = async () => {
    if (window.confirm('Đạo hữu có chắc muốn kích hoạt chu kỳ cào ngay bây giờ?')) {
        let secret = localStorage.getItem('TRUYENVIP_CRON_SECRET') || '';
        
        if (!secret) {
            secret = window.prompt('Nhập mã cấm chế (CRON_SECRET) để kích hoạt:');
            if (secret) localStorage.setItem('TRUYENVIP_CRON_SECRET', secret);
        }

        if (!secret) return;

        setCrawlLoading(true);
        try {
            const res = await fetch('/api/cron', {
                headers: { 'Authorization': `Bearer ${secret}` }
            });
            if (res.ok) {
                addToast('🚀 Đã kích hoạt vạn dặm scraper thành công!', 'success');
            } else {
                const errorData = await res.json().catch(() => ({}));
                addToast(`❌ Lỗi kích hoạt: ${res.status} - ${errorData.error || 'Mã cấm chế không chính xác'}`, 'error');
                if (res.status === 401) localStorage.removeItem('TRUYENVIP_CRON_SECRET');
            }
        } catch (e) {
            addToast('🚫 Kết nối với pháp bảo bị gián đoạn!', 'error');
        }
        setCrawlLoading(false);
    }
  };

  if (authLoading) {
      return (
          <main className="main-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
              <div className="loader-ring"></div>
              <p style={{ marginTop: '20px', fontWeight: 700 }}>Đang nhận diện danh tính...</p>
          </main>
      );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
        <main className="main-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
            <h1 style={{ fontSize: '5rem' }}>🚫</h1>
            <h2>Bậc tiền bối không phải admin?</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '10px' }}>Quyền hạn hiện tại: {user?.role || 'Guest'}</p>
            <Link href="/" className="btn btn-primary" style={{ marginTop: '30px' }}>Quay lại trần thế</Link>
        </main>
    );
  }

    return (
        <main className="admin-page titan-bg" style={{ minHeight: '100vh', paddingBottom: '100px', color: 'white' }}>
            <Header />
            
            <div className="container" style={{ paddingTop: '120px' }}>
                <header style={{ marginBottom: '50px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: '3rem', fontWeight: 950, marginBottom: '10px' }}>🏰 Đạo Đường Quản Trị</h1>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Cung điện điều hành tối cao của TruyenVip</p>
                    </div>
                </header>

                <div className="dash-grid-titan">
                    <div className="stat-item-titan">
                        <div className="stat-label-titan">📊 TỔNG ĐỆ TỬ</div>
                        <div className="stat-value-titan">
                            {stats ? stats.totalUsers : <div className="skeleton-shimmer" style={{ height: '3rem', width: '80px', borderRadius: '10px' }} />}
                        </div>
                    </div>
                    <div className="stat-item-titan">
                        <div className="stat-label-titan">📚 TỔNG BỘ TỊCH</div>
                        <div className="stat-value-titan">
                            {stats ? stats.totalManga : <div className="skeleton-shimmer" style={{ height: '3rem', width: '80px', borderRadius: '10px' }} />}
                        </div>
                    </div>
                    <div className="stat-item-titan">
                        <div className="stat-label-titan">📜 TỔNG CHƯƠNG</div>
                        <div className="stat-value-titan">
                            {stats ? stats.totalChapters : <div className="skeleton-shimmer" style={{ height: '3rem', width: '80px', borderRadius: '10px' }} />}
                        </div>
                    </div>
                    <div className="stat-item-titan highlight-titan">
                        <div className="stat-label-titan" style={{ color: 'var(--accent)' }}>🎁 ĐỢI ĐỔI QUÀ</div>
                        <div className="stat-value-titan" style={{ color: 'var(--accent)' }}>
                            {stats ? stats.pendingRewards : <div className="skeleton-shimmer" style={{ height: '3rem', width: '40px', borderRadius: '10px' }} />}
                        </div>
                        <Link href="/admin/rewards" className="action-link" style={{ marginTop: '15px', display: 'block', fontWeight: 800, color: 'var(--accent)', textDecoration: 'none' }}>Quản lý ngay →</Link>
                    </div>
                </div>

                <section className="admin-actions-section">
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '30px' }}>⚡ Quyền Năng Hệ Thống</h2>
                    <div className="actions-list-titan">
                        
                        {/* Crawler Control */}
                        <div className="action-node-titan">
                            <div className="action-icon-titan">🕷️</div>
                            <h3 className="action-title-titan">Linh Thú Scraper (V2)</h3>
                            <p className="action-desc-titan">Hệ thống cào truyện thông minh, tự động đồng bộ chương mới và xử lý ảnh cao cấp.</p>
                            
                            {/* TASK MONITOR MINI */}
                            <div className="task-monitor-mini glass" style={{ padding: '15px', borderRadius: '16px', marginBottom: '20px', background: 'rgba(255,255,255,0.03)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 800 }}>
                                    <span>HÀNG CHỜ:</span>
                                    <span style={{ color: 'var(--accent)' }}>{stats?.taskPending || 0}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 800, marginTop: '5px' }}>
                                    <span>LỖI:</span>
                                    <span style={{ color: '#ef4444' }}>{stats?.taskFailed || 0}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 800, marginTop: '5px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '5px' }}>
                                    <span>NHỊP TIM:</span>
                                    <span style={{ color: '#10b981' }}>{stats?.syncsLastHour || 0} / GIỜ</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                                <button onClick={triggerCrawl} disabled={crawlLoading} className="btn btn-primary" style={{ flex: 1 }}>
                                    {crawlLoading ? 'Đang gọi...' : 'Kích hoạt ngay'}
                                </button>
                                <button onClick={async () => {
                                    if(confirm('Thử lại toàn bộ các task lỗi?')) {
                                        const res = await fetch('/api/admin/tasks', { method: 'POST', body: JSON.stringify({ action: 'retry_failed' }) });
                                        if (res.ok) addToast('Đã đưa các task lỗi về hàng chờ.', 'success');
                                        else addToast('Thất bại khi khôi phục task.', 'error');
                                    }
                                }} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '50px' }}>
                                    🔄
                                </button>
                                <button onClick={async () => {
                                    if(confirm('Xóa sạch toàn bộ các task đã hoàn thành?')) {
                                        const res = await fetch('/api/admin/tasks', { method: 'POST', body: JSON.stringify({ action: 'purge_completed' }) });
                                        if (res.ok) addToast('Đã dọn dẹp hàng chờ sạch sẽ.', 'success');
                                        else addToast('Không thể dọn dẹp hàng chờ.', 'error');
                                    }
                                }} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '50px' }}>
                                    🧹
                                </button>
                            </div>
                        </div>

                        {/* Logs Control */}
                        <div className="action-node-titan">
                            <div className="action-icon-titan">⚙️</div>
                            <h3 className="action-title-titan">Chẩn Đoán &apos;Thần Nhãn&apos;</h3>
                            <p className="action-desc-titan">Phân tích lỗi hàng chờ và tìm ra những bộ truyện đang bị &apos;kẹt&apos; pháp bảo.</p>
                            
                            <div className="failure-list-mini glass" style={{ fontSize: '0.65rem', padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', maxHeight: '100px', overflowY: 'auto' }}>
                                <div style={{ fontWeight: 900, color: 'var(--text-muted)', marginBottom: '5px' }}>LỖI CẬP NHẬT GẦN NHẤT:</div>
                                {stats?.recentFailures?.length > 0 ? stats.recentFailures.map(f => (
                                    <div key={f.id} style={{ marginBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '2px' }}>
                                        <span style={{ color: 'var(--accent)' }}>[{f.type}]</span> {f.last_error?.substring(0, 40)}...
                                    </div>
                                )) : <div style={{ opacity: 0.3 }}>Hệ thống thanh tịnh.</div>}
                            </div>

                            {stats?.heatmap?.length > 0 && (
                                <div className="heatmap-titan glass" style={{ marginTop: '10px', padding: '10px', borderRadius: '12px', background: 'rgba(255,62,62,0.02)', border: '1px solid rgba(255,62,62,0.1)' }}>
                                    <div style={{ fontSize: '0.6rem', fontWeight: 900, marginBottom: '5px', color: 'var(--accent)' }}>PHÂN TÍCH LỖI HỆ THỐNG:</div>
                                    {stats.heatmap.map((h, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', marginBottom: '2px' }}>
                                            <span style={{ opacity: 0.7 }}>{h.signature?.substring(0, 30)}...</span>
                                            <span style={{ fontWeight: 800 }}>{h.count}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <Link href="/admin/crawler" className="btn btn-outline" style={{ marginTop: 'auto', textAlign: 'center' }}>
                                Quét Toàn Bộ Radar
                            </Link>
                        </div>

                        {/* Other Tools */}
                        <div className="action-node-titan dimmed" style={{ opacity: 0.6, pointerEvents: 'none' }}>
                            <div className="action-icon-titan">🛠️</div>
                            <h3 className="action-title-titan">Bảo Trì Thần Khí</h3>
                            <p className="action-desc-titan">Tính năng đang được phát triển. Sẽ sớm ra mắt trong các phiên bản kế tiếp.</p>
                            <button className="btn btn-outline" disabled style={{ marginTop: 'auto', opacity: 0.5 }}>Sắp ra mắt</button>
                        </div>

                    </div>
                </section>
            </div>
        </main>
    );
}

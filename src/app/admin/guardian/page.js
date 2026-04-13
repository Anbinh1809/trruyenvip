'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import Link from 'next/link';
import Image from 'next/image';

export default function GuardianHub() {
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchHistory = async () => {
        try {
            const res = await fetch('/api/admin/guardian/history?limit=100');
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (e) {
            console.error('Guardian fetch error:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated && user?.role === 'admin') {
            fetchHistory();
        }
    }, [isAuthenticated, user]);

    if (authLoading || (loading && !data)) {
        return (
          <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
            <div className="titan-loader-pulse"></div>
          </div>
        );
    }

    if (!isAuthenticated || user?.role !== 'admin') return null;

    return (
        <main className="admin-page titan-bg" style={{ minHeight: '100vh', paddingBottom: '100px', color: 'white' }}>
            <Header />
            
            <div className="container" style={{ paddingTop: '120px' }}>
                <div className="section-header" style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 15px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '50px', marginBottom: '15px' }}>
                            <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px #10b981' }}></span>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#10b981', letterSpacing: '1px' }}>HỆ THỐNG ĐANG BẢO VỆ (AUTOPILOT)</span>
                        </div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 950, marginBottom: '10px' }}>⚙️ Titan Control Center</h1>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Chi tiết lịch sử vá lỗi và phục hồi dữ liệu tự động</p>
                    </div>
                    <button className="btn btn-outline" style={{ padding: '10px 25px', borderRadius: '14px' }} onClick={fetchHistory}>
                        🔄 Làm mới danh sách
                    </button>
                </div>

                {/* Dashboard Metrics */}
                <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                    <div className="glass-card" style={{ padding: '30px', background: 'rgba(255,255,255,0.02)', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.75rem', opacity: 0.5, marginBottom: '5px', fontWeight: 700 }}>TỔNG LẦN PHỤC HỒI (24H)</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 950, color: 'var(--accent)' }}>{data?.metrics?.total_fixes || 0}</div>
                        <div style={{ fontSize: '0.8rem', marginTop: '10px', color: 'rgba(255,255,255,0.4)' }}>Hệ thống đã tự động phục hồi dữ liệu thành công.</div>
                    </div>
                    <div className="glass-card" style={{ padding: '30px', background: 'rgba(255,255,255,0.02)', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <div>
                                <div style={{ fontSize: '0.7rem', opacity: 0.5, fontWeight: 700 }}>VÁ CHƯƠNG THIẾU</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{data?.metrics?.gaps_filled || 0}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.7rem', opacity: 0.5, fontWeight: 700 }}>PHỤC HỒI HÌNH ẢNH</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{data?.metrics?.images_rescued || 0}</div>
                            </div>
                        </div>
                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(to right, #ef4444, #10b981)' }}></div>
                        </div>
                    </div>
                </div>

                {/* Detailed History List */}
                <div className="glass-card" style={{ borderRadius: '32px', overflow: 'hidden', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ padding: '25px 30px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                        <h3 style={{ fontWeight: 900, fontSize: '1.2rem' }}>📜 Nhật Ký Hệ Thống Chi Tiết</h3>
                    </div>
                    
                    {data?.reports.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <th style={{ padding: '20px 30px', fontSize: '0.7rem', opacity: 0.4 }}>THỜI GIAN</th>
                                        <th style={{ padding: '20px', fontSize: '0.7rem', opacity: 0.4 }}>BỘ TRUYỆN</th>
                                        <th style={{ padding: '20px', fontSize: '0.7rem', opacity: 0.4 }}>CHƯƠNG</th>
                                        <th style={{ padding: '20px', fontSize: '0.7rem', opacity: 0.4 }}>LOẠI SỰ CỐ</th>
                                        <th style={{ padding: '20px', fontSize: '0.7rem', opacity: 0.4 }}>CỐ GẮNG</th>
                                        <th style={{ padding: '20px', fontSize: '0.7rem', opacity: 0.4 }}>CHI TIẾT</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.reports.map(report => (
                                        <tr key={report.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s ease' }} className="guardian-row">
                                            <td style={{ padding: '20px 30px', fontSize: '0.8rem', opacity: 0.5, fontVariantNumeric: 'tabular-nums' }}>
                                                {new Date(report.created_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                                            </td>
                                            <td style={{ padding: '20px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '32px', height: '42px', position: 'relative', borderRadius: '4px', overflow: 'hidden' }}>
                                                        <Image src={report.cover.startsWith('http') ? `/api/proxy?url=${encodeURIComponent(report.cover)}` : report.cover} alt="" fill style={{ objectFit: 'cover' }} />
                                                    </div>
                                                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{report.manga_name}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '20px', fontWeight: 600, fontSize: '0.85rem' }}>
                                                {report.chapter_title}
                                            </td>
                                            <td style={{ padding: '20px' }}>
                                                <span style={{ 
                                                    padding: '4px 10px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 900,
                                                    background: report.event_type === 'FIX_IMAGE' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                                    color: report.event_type === 'FIX_IMAGE' ? '#ef4444' : '#10b981',
                                                    border: `1px solid ${report.event_type === 'FIX_IMAGE' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
                                                }}>
                                                    {report.event_type === 'FIX_IMAGE' ? '📸 PHỤC HỒI ẢNH' : '🔧 VÁ DỮ LIỆU'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '20px', textAlign: 'center' }}>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent)' }}>{report.retry_count || 1}</span>
                                            </td>
                                            <td style={{ padding: '20px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', maxWidth: '300px' }}>
                                                {report.message}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div style={{ padding: '100px', textAlign: 'center' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '20px', opacity: 0.2 }}>🔍</div>
                            <h3 style={{ opacity: 0.5 }}>Hệ thống ổn định. Không có bản ghi sự cố.</h3>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .guardian-row:hover {
                    background: rgba(255, 255, 255, 0.02);
                }
            `}</style>
        </main>
    );
}

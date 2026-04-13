'use client';

import Header from '@/components/Header';
import { calculateRank } from '@/context/EngagementContext';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect, useMemo } from 'react';
import { Trophy, Crown, Medal, Shield, User } from 'lucide-react';


export const dynamic = "force-dynamic";

const RankingIcon = ({ index }) => {
    if (index === 0) return <Crown size={28} color="#fbbf24" />;
    if (index === 1) return <Trophy size={24} color="#94a3b8" />;
    if (index === 2) return <Medal size={24} color="#b45309" />;
    return <span style={{ fontSize: '1rem', fontWeight: 800, opacity: 0.3 }}>#{index + 1}</span>;
}

export default function LeaderboardPage() {
  const { user: currentUser } = useAuth();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaders = async () => {
        try {
            const res = await fetch('/api/leaderboard');
            if (res.ok) {
                const data = await res.json();
                setLeaders(data);
            }
        } catch (e) {
            console.error('Failed to fetch leaderboard', e);
        } finally {
            setLoading(false);
        }
    };
    
    fetchLeaders();
  }, []);

  const processedLeaders = useMemo(() => {
    return leaders.map(l => {
        const stats = calculateRank(l.xp);
        return {
            name: l.username,
            level: stats.level,
            rank: stats.title,
            xp: l.xp,
            avatar: l.avatar,
            role: l.role,
            isUser: currentUser && l.username === currentUser.username
        };
    });
  }, [leaders, currentUser]);

    return (
        <main className="leaderboard-page main-wrapper titan-bg" style={{ minHeight: '100vh', paddingBottom: '100px', color: 'white' }}>
            <Header />
            
            <div className="container" style={{ paddingTop: '120px', maxWidth: '1000px' }}>
                <section style={{ textAlign: 'center', marginBottom: '60px' }} className="fade-up">
                    <div style={{ display: 'inline-block', padding: '4px 14px', background: 'rgba(255, 62, 62, 0.08)', border: '1px solid rgba(255, 62, 62, 0.2)', color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1px', borderRadius: 'var(--border-radius)', marginBottom: '20px', textTransform: 'uppercase' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Trophy size={14} /> Bảng Xếp Hạng
                        </div>
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '15px', letterSpacing: '-1.5px', lineHeight: 1 }}>Bảng Xếp Hạng</h1>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem', fontWeight: 600, maxWidth: '600px', margin: '0 auto' }}>Vinh danh những thành viên có hoạt động tích cực nhất.</p>
                </section>

                <div className="leaderboard-list fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '100px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '100px 0' }}>
                            <div className="loader-ring" style={{ margin: '0 auto' }}></div>
                            <p style={{ marginTop: '20px', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>Đang tải...</p>
                        </div>
                    ) : processedLeaders.map((player, idx) => (
                        <div 
                            key={idx} 
                            className={`rank-node-titan ${idx === 0 ? 'podium-gold' : (idx === 1 ? 'podium-silver' : (idx === 2 ? 'podium-bronze' : ''))}`}
                            style={{ 
                                animationDelay: `${idx * 0.03}s`,
                                padding: idx < 3 ? '30px 45px' : '22px 40px',
                                borderLeft: player.isUser ? '4px solid var(--accent)' : ''
                            }}
                        >
                            <div style={{ width: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <RankingIcon index={idx} />
                            </div>
                            
                            <div style={{ position: 'relative' }}>
                                <div style={{ 
                                    width: idx < 3 ? '85px' : '65px', 
                                    height: idx < 3 ? '85px' : '65px', 
                                    borderRadius: '50%', 
                                    background: 'rgba(255,255,255,0.05)', 
                                    border: '2px solid rgba(255,255,255,0.08)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                    overflow: 'hidden',
                                    transition: 'all 0.3s ease'
                                }}>
                                    {player.avatar ? (
                                        <img src={player.avatar} alt={player.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ fontSize: idx < 3 ? '1.5rem' : '1.2rem', opacity: 0.3 }}>
                                            {player.role === 'admin' ? <Shield size={idx < 3 ? 32 : 24} /> : <User size={idx < 3 ? 32 : 24} />}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ flex: 1, paddingLeft: '20px' }}>
                                <h4 style={{ fontSize: idx < 3 ? '1.5rem' : '1.2rem', fontWeight: 900, marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {player.name}
                                    {player.isUser && <span style={{ fontSize: '0.65rem', background: 'var(--accent)', padding: '3px 8px', borderRadius: 'var(--border-radius)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>BẠN</span>}
                                    {player.role === 'admin' && <span style={{ fontSize: '0.6rem', background: 'rgba(255,255,255,0.1)', padding: '3px 8px', borderRadius: 'var(--border-radius)', color: 'rgba(255,255,255,0.6)' }}>ADMIN</span>}
                                </h4>
                                <div style={{ display: 'flex', gap: '15px', fontSize: '0.85rem', fontWeight: 700 }}>
                                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>Cấp: <span style={{ color: 'white' }}>{player.level}</span></span>
                                    <span style={{ color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.75rem' }}>{player.rank}</span>
                                </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: idx < 3 ? '2.2rem' : '1.8rem', fontWeight: 950, letterSpacing: '-1.5px', color: idx === 0 ? '#ffd700' : 'white' }}>{new Intl.NumberFormat().format(player.xp)}</div>
                                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>TỔNG XP</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}

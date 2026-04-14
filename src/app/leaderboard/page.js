'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { calculateRank } from '@/context/EngagementContext';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect, useMemo } from 'react';
import { Trophy, Crown, Medal, Shield, User } from 'lucide-react';

export const dynamic = "force-dynamic";

const RankingIcon = ({ index }) => {
    if (index === 0) return <Crown size={32} color="#fbbf24" />;
    if (index === 1) return <Trophy size={28} color="#94a3b8" />;
    if (index === 2) return <Medal size={28} color="#b45309" />;
    return <span className="rank-number-industrial">#{index + 1}</span>;
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
            rankTitle: stats.title,
            xp: l.xp,
            avatar: l.avatar,
            role: l.role,
            isUser: currentUser && l.username === currentUser.username
        };
    });
  }, [leaders, currentUser]);

    return (
        <main className="main-wrapper titan-bg leaderboard-page">
            <Header />
            
            <div className="container leaderboard-container fade-in">
                <section className="leaderboard-header fade-up">
                    <div className="leaderboard-badge-titan">
                        <Trophy size={14} /> BẢNG VINH DANH
                    </div>
                    <h1 className="leaderboard-title-industrial">BẢNG XẾP HẠNG</h1>
                    <p className="leaderboard-subtitle">Vinh danh những thành viên có hoạt động tích cực nhất trên hệ thống.</p>
                </section>

                <div className="leaderboard-list-industrial">
                    {loading ? (
                        <div className="leaderboard-loading-industrial">
                            <div className="titan-loader-pulse"></div>
                            <p className="loading-text-industrial">Đang truy xuất bảng xếp hạng...</p>
                        </div>
                    ) : processedLeaders.map((player, idx) => (
                        <div 
                            key={idx} 
                            className={`rank-node-titan-industrial ${idx < 3 ? `podium-${['gold', 'silver', 'bronze'][idx]}` : ''} ${player.isUser ? 'is-self' : ''}`}
                            style={{ '--delay': `${idx * 0.05}s` }}
                        >
                            <div className="rank-icon-box-industrial">
                                <RankingIcon index={idx} />
                            </div>
                            
                            <div className="rank-avatar-box-industrial">
                                <div className="rank-avatar-wrapper-industrial">
                                    {player.avatar ? (
                                        <img src={player.avatar} alt={player.name} className="rank-avatar-img-industrial" />
                                    ) : (
                                        <div className="rank-avatar-placeholder">
                                            {player.role === 'admin' ? <Shield size={idx < 3 ? 32 : 24} /> : <User size={idx < 3 ? 32 : 24} />}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="rank-info-industrial">
                                <h4 className="rank-user-title">
                                    {player.name}
                                    {player.isUser && <span className="self-tag-titan">BẠN</span>}
                                    {player.role === 'admin' && <span className="admin-tag-titan">ADMIN</span>}
                                </h4>
                                <div className="rank-stats-industrial">
                                    <span className="rank-stat-node"><span className="label">Cấp:</span> <span className="value">{player.level}</span></span>
                                    <span className="rank-title-tag">{player.rankTitle}</span>
                                </div>
                            </div>

                            <div className="rank-xp-industrial">
                                <div className="xp-value-industrial">{new Intl.NumberFormat().format(player.xp)}</div>
                                <div className="xp-label-industrial">TỔNG XP</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <Footer />
            <style jsx>{`
                .leaderboard-list-industrial { display: flex; flex-direction: column; padding-bottom: 100px; }
                .rank-number-industrial { font-size: 1.2rem; font-weight: 950; opacity: 0.3; }
                .rank-avatar-box-industrial { position: relative; }
                .rank-avatar-img-industrial { width: 100%; height: 100%; object-fit: cover; }
                .rank-avatar-placeholder { opacity: 0.3; }
                .self-tag-titan { font-size: 0.65rem; background: var(--accent); padding: 3px 10px; border-radius: 4px; color: white; letter-spacing: 1px; }
                .admin-tag-titan { font-size: 0.65rem; background: rgba(255,255,255,0.1); padding: 3px 10px; border-radius: 4px; color: rgba(255,255,255,0.6); letter-spacing: 1px; }
                .rank-stat-node .label { color: rgba(255,255,255,0.4); }
                .rank-stat-node .value { color: white; }
                .rank-title-tag { color: var(--accent); text-transform: uppercase; letter-spacing: 1px; font-size: 0.75rem; }
                .xp-label-industrial { font-size: 0.7rem; font-weight: 900; color: rgba(255,255,255,0.3); letter-spacing: 1px; }
                .leaderboard-loading-industrial { text-align: center; padding: 120px 0; }
                .loading-text-industrial { margin-top: 30px; color: rgba(255,255,255,0.4); font-weight: 800; letter-spacing: 1px; }
                .rank-node-titan-industrial { animation: fadeUp 0.8s both var(--delay); }
                @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </main>
    );
}

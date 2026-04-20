'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { calculateRank } from '@/contexts/EngagementContext';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useMemo } from 'react';
import { Trophy, Crown, Medal, Shield, User, Star } from 'lucide-react';

export const dynamic = "force-dynamic";

const RankingIcon = ({ index }) => {
    if (index === 0) return <Crown size={32} color="var(--rank-gold)" />;
    if (index === 1) return <Trophy size={28} color="var(--rank-silver)" />;
    if (index === 2) return <Medal size={28} color="var(--rank-bronze)" />;
    return <span className="rank-number-industrial">#{index + 1}</span>;
}

export default function LeaderboardPage() {
  const { user: currentUser } = useAuth() || {};
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
                        <Trophy size={14} /> BẢNG VINH DANH TRUYỆNVIP
                    </div>
                    <h1 className="leaderboard-title-industrial">BẢNG XẾP HẠNG CAO THỦ</h1>
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
                                    <div className="user-tags-wrapper-titan">
                                        {player.isUser && <span className="self-tag-titan">BẠN</span>}
                                        {player.role === 'admin' && <span className="admin-tag-titan">ADMIN</span>}
                                    </div>
                                </h4>
                                <div className="rank-stats-industrial">
                                    <span className="rank-stat-node"><span className="label">Cấp:</span> <span className="value">{player.level}</span></span>
                                    <span className="rank-title-tag">{player.rankTitle}</span>
                                </div>
                            </div>

                            <div className="rank-values-group-titan">
                                <div className="rank-xp-industrial">
                                    <div className="xp-value-industrial">{new Intl.NumberFormat().format(player.xp)}</div>
                                    <div className="xp-label-industrial">TỔNG XP</div>
                                </div>
                                <div className="v-divider-titan" />
                                <div className="rank-coins-industrial">
                                    <div className="coin-value-industrial">{new Intl.NumberFormat().format(leaders.find(l => l.username === player.name)?.vipcoins || 0)}</div>
                                    <div className="coin-label-industrial">VIPCOINS</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <Footer />
            <style>{`
                .leaderboard-container { padding-top: 60px; }
                .leaderboard-header { text-align: center; margin-bottom: 60px; }
                .leaderboard-badge-titan {
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 16px;
                    background: rgba(251, 191, 36, 0.1);
                    color: #fbbf24;
                    border-radius: 8px;
                    font-size: 0.75rem;
                    font-weight: 900;
                    letter-spacing: 1.5px;
                    margin-bottom: 25px;
                }
                .leaderboard-title-industrial { font-size: 2.8rem; font-weight: 950; letter-spacing: -1.5px; color: var(--text-primary); margin-bottom: 15px; }
                .leaderboard-subtitle { color: var(--text-muted); max-width: 600px; margin: 0 auto; line-height: 1.6; }
                
                .leaderboard-list-industrial { display: flex; flex-direction: column; gap: 12px; padding-bottom: 120px; }
                
                .rank-node-titan-industrial {
                    display: flex;
                    align-items: center;
                    padding: 20px 40px;
                    background: var(--glass-bg);
                    backdrop-filter: blur(10px);
                    border: 1px solid var(--glass-border);
                    border-radius: 20px;
                    transition: all 0.3s var(--ease-titan);
                    animation: fadeUp 0.8s both var(--delay);
                }
                .rank-node-titan-industrial:hover { transform: scale(1.01) translateY(-3px); border-color: var(--glass-border); background: var(--glass-bg); }
                .rank-node-titan-industrial.is-self { border-color: var(--accent); background: rgba(255, 62, 62, 0.05); }

                .podium-gold { border-color: rgba(251, 191, 36, 0.3); background: linear-gradient(90deg, rgba(251, 191, 36, 0.05) 0%, transparent 100%); }
                .podium-silver { border-color: rgba(148, 163, 184, 0.3); }
                .podium-bronze { border-color: rgba(180, 83, 9, 0.3); }

                .rank-icon-box-industrial { width: 50px; display: flex; align-items: center; justify-content: center; }
                .rank-number-industrial { font-size: 1.2rem; font-weight: 950; color: var(--text-muted); }
                
                .rank-avatar-wrapper-industrial {
                    width: 56px; height: 56px; border-radius: 50%; overflow: hidden; 
                    background: var(--nebula-glass); border: 2px solid var(--glass-border);
                    margin: 0 25px;
                }
                .rank-avatar-img-industrial { width: 100%; height: 100%; object-fit: cover; }
                .rank-avatar-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--text-muted); }

                .rank-info-industrial { flex: 1; }
                .rank-user-title { font-size: 1.2rem; font-weight: 900; margin-bottom: 4px; display: flex; align-items: center; color: var(--text-primary); }
                .user-tags-wrapper-titan { display: flex; gap: 8px; margin-left: 15px; }
                .self-tag-titan { font-size: 0.65rem; background: var(--accent); padding: 3px 10px; border-radius: 4px; color: var(--text-primary); letter-spacing: 1px; font-weight: 900; }
                .admin-tag-titan { font-size: 0.65rem; background: var(--nebula-glass); padding: 3px 10px; border-radius: 4px; color: var(--text-secondary); letter-spacing: 1px; font-weight: 900; }
                
                .rank-stats-industrial { display: flex; align-items: center; gap: 15px; }
                .rank-stat-node { font-size: 0.85rem; font-weight: 800; color: var(--text-primary); }
                .rank-stat-node .label { color: var(--text-muted); text-transform: uppercase; margin-right: 5px; }
                .rank-title-tag { color: var(--accent); text-transform: uppercase; letter-spacing: 1px; font-size: 0.75rem; font-weight: 900; }

                .rank-values-group-titan { display: flex; align-items: center; gap: 20px; text-align: right; }
                .v-divider-titan { width: 1px; height: 30px; background: var(--glass-border); }
                .xp-value-industrial { font-size: 1.1rem; font-weight: 950; color: var(--text-primary); }
                .xp-label-industrial { font-size: 0.7rem; font-weight: 900; color: var(--text-muted); letter-spacing: 1px; }
                .coin-value-industrial { font-size: 1.1rem; font-weight: 950; color: #fbbf24; }
                .coin-label-industrial { font-size: 0.7rem; font-weight: 900; color: rgba(251, 191, 36, 0.5); letter-spacing: 1px; }

                .leaderboard-loading-industrial { text-align: center; padding: 120px 0; }
                .loading-text-industrial { margin-top: 30px; color: var(--text-muted); font-weight: 800; letter-spacing: 1px; }
                
                @media (max-width: 768px) {
                    .rank-node-titan-industrial { padding: 15px 20px; }
                    .rank-avatar-wrapper-industrial { margin: 0 15px; width: 44px; height: 44px; }
                    .rank-values-group-titan { display: none; }
                    .rank-user-title { font-size: 1rem; }
                }
                @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </main>
    );
}

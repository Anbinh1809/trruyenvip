'use client';

import { useState } from 'react';
import { useEngagement } from '@/context/EngagementContext';
import { Gift, Trophy, Package, Sparkles, X, Gem, CheckCircle2 } from 'lucide-react';

export default function MissionPanel() {
  const { dailyMissions, openChest, rankTitle, mounted } = useEngagement();
  const [isOpen, setIsOpen] = useState(false);
  const [openingChest, setOpeningChest] = useState(null); // { missionId, prize }
  const [claimedPrize, setClaimedPrize] = useState(null);

  if (!mounted) return null;

  const handleOpenChest = (missionId) => {
    const prize = openChest(missionId);
    if (prize) {
      setOpeningChest({ missionId, prize });
      // Simulate animation
      setTimeout(() => {
        setClaimedPrize(prize);
      }, 1500);
    }
  };

  const closeCelebration = () => {
    setOpeningChest(null);
    setClaimedPrize(null);
  };

  const completedCount = dailyMissions.missions.filter(m => m.current >= m.target).length;

  return (
    <>
      {/* Floating Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="mission-toggle glass skeleton-shimmer glow-pulse"
        style={{
            position: 'fixed',
            right: '20px',
            bottom: '100px',
            width: '55px',
            height: '55px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            background: 'rgba(255, 62, 62, 0.45)',
            backdropFilter: 'blur(15px)',
            border: completedCount > dailyMissions.missions.filter(m => m.claimed).length ? '2px solid var(--accent)' : '1px solid var(--glass-border)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            cursor: 'pointer',
            transition: 'var(--transition)'
        }}
      >
        <span style={{ color: 'white' }}>
            {isOpen ? <X size={24} /> : <Gift size={24} />}
        </span>
        {completedCount > dailyMissions.missions.filter(m => m.claimed).length && (
            <span style={{ position: 'absolute', top: 0, right: 0, width: '16px', height: '16px', background: 'var(--accent)', borderRadius: '50%', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ width: '6px', height: '6px', background: 'white', borderRadius: '50%' }}></span>
            </span>
        )}
      </button>

      {/* Main Panel */}
      {isOpen && (
        <div className="mission-panel-overlay fade-in" onClick={() => setIsOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 10001, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: '20px', paddingBottom: '90px' }}>
          <div className="mission-panel glass glass-scrollbar" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '400px', maxHeight: '75vh', borderRadius: '30px', padding: '28px', border: '1px solid var(--glass-border)', boxShadow: '0 30px 60px rgba(0,0,0,0.8)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: 'var(--accent-gradient)', padding: '10px', borderRadius: '12px' }}>
                        <Trophy size={20} color="white" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontWeight: 950, fontSize: '1.2rem', letterSpacing: '-0.5px' }}>Tiến Độ</h3>
                        <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '1px' }}>Thử thách hàng ngày</p>
                    </div>
                </div>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid var(--glass-border)' }}>{rankTitle}</span>
            </div>

            <div className="mission-list" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {dailyMissions.missions.map(m => {
                    const isDone = m.current >= m.target;
                    const progress = Math.min((m.current / m.target) * 100, 100);
                    return (
                        <div key={m.id} className={`mission-item ${isDone ? 'done' : ''}`} style={{ padding: '18px', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid var(--glass-border)', transition: 'var(--transition)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {isDone ? <CheckCircle2 size={16} color="var(--accent)" /> : <Sparkles size={16} color="var(--nebula-blue)" />}
                                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isDone ? 'var(--accent)' : 'white' }}>{m.label}</span>
                                </div>
                                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: isDone ? 'var(--accent)' : 'var(--text-secondary)' }}>{m.current}/{m.target}</span>
                            </div>
                            <div className="progress-bg" style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '10px', position: 'relative', overflow: 'hidden' }}>
                                <div 
                                    className="progress-fill" 
                                    style={{ 
                                        width: `${progress}%`, 
                                        height: '100%', 
                                        background: isDone ? 'var(--accent-gradient)' : 'var(--nebula-blue)', 
                                        transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                        boxShadow: isDone ? '0 0 15px var(--accent)' : 'none'
                                    }} 
                                ></div>
                            </div>
                            {isDone && (
                                <button 
                                    className={`btn ${m.claimed ? 'btn-outline' : 'btn-primary'}`}
                                    onClick={() => !m.claimed && handleOpenChest(m.id)}
                                    disabled={m.claimed}
                                    style={{ 
                                        width: '100%', 
                                        marginTop: '16px', 
                                        padding: '12px', 
                                        fontSize: '0.85rem', 
                                        fontWeight: 900, 
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    {m.claimed ? <CheckCircle2 size={16} /> : <Gem size={16} />}
                                    {m.claimed ? 'Đã nhận thưởng' : 'Mở rương báu'}
                                </button>
                            )}
                        </div>
                    )
                })}
            </div>
          </div>
        </div>
      )}

      {/* Chest Opening Celebration */}
      {openingChest && (
        <div className="chest-celebration-overlay fade-in" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(10px)', zIndex: 20002, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div className={`celebration-content ${claimedPrize ? 'titan-prize-zoom' : ''}`} style={{ padding: '40px' }}>
                <div className="chest-animation" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {claimedPrize ? (
                        <div className="prize-reveal">
                            <div style={{ marginBottom: '30px', filter: 'drop-shadow(0 0 30px var(--accent))' }}>
                                {claimedPrize.type === 'coin' ? <Gem size={100} color="var(--accent)" /> : <Sparkles size={100} color="var(--nebula-blue)" />}
                            </div>
                            <h2 style={{ fontSize: '3.5rem', fontWeight: 950, color: 'white', marginBottom: '10px', letterSpacing: '-2px' }}>+{claimedPrize.amount}</h2>
                            <p style={{ color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.9rem' }}>{claimedPrize.type.toUpperCase()} THƯỞNG</p>
                            <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: '20px', maxWidth: '300px' }}>Chúc mừng bạn đã mở khóa {openingChest.prize.chestName}</p>
                            <button className="btn btn-primary" onClick={closeCelebration} style={{ marginTop: '40px', padding: '18px 60px', borderRadius: '15px' }}>ĐÓNG</button>
                        </div>
                    ) : (
                        <div className="titan-chest-shake">
                            <div style={{ color: 'var(--accent)', animation: 'pulse 1s infinite' }}>
                                <Package size={120} strokeWidth={1} />
                            </div>
                            <h3 style={{ marginTop: '30px', color: 'white', fontWeight: 900, fontSize: '1.4rem' }}>ĐANG CHI TRẢ THƯỞNG...</h3>
                            <div style={{ width: '100px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '20px', overflow: 'hidden' }}>
                                <div className="skeleton-shimmer" style={{ width: '100%', height: '100%' }}></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </>
  );
}

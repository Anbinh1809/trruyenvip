'use client';

import { useState } from 'react';
import { useEngagement } from '@/context/EngagementContext';

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
        className="mission-toggle glass"
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
            fontSize: '1.4rem',
            zIndex: 2000,
            background: 'rgba(255, 62, 62, 0.4)',
            backdropFilter: 'blur(20px)',
            border: completedCount > dailyMissions.missions.filter(m => m.claimed).length ? '2px solid var(--accent)' : '1px solid var(--glass-border)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            cursor: 'pointer'
        }}
      >
        🎁
        {completedCount > dailyMissions.missions.filter(m => m.claimed).length && (
            <span style={{ position: 'absolute', top: 0, right: 0, width: '16px', height: '16px', background: 'red', borderRadius: '50%', border: '2px solid white' }}></span>
        )}
      </button>

      {/* Main Panel */}
      {isOpen && (
        <div className="mission-panel-overlay fade-in" onClick={() => setIsOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10001, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: '20px', paddingBottom: '90px' }}>
          <div className="mission-panel glass" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '400px', maxHeight: '70vh', borderRadius: '30px', padding: '25px', border: '1px solid var(--glass-border)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.4rem' }}>Tu Luyện Hàng Ngày</h3>
                <span className="badge">{rankTitle}</span>
            </div>

            <div className="mission-list" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {dailyMissions.missions.map(m => {
                    const isDone = m.current >= m.target;
                    return (
                        <div key={m.id} className={`mission-item ${isDone ? 'done' : ''}`} style={{ padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '15px', border: '1px solid var(--glass-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isDone ? 'var(--accent)' : 'white' }}>{m.label}</span>
                                <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>{m.current}/{m.target}</span>
                            </div>
                            <div className="progress-bg" style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', position: 'relative', overflow: 'hidden' }}>
                                <div className="progress-fill" style={{ width: `${(m.current/m.target)*100}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.3s' }}></div>
                            </div>
                            {isDone && (
                                <button 
                                    className={`btn ${m.claimed ? 'btn-outline' : 'btn-primary'}`}
                                    onClick={() => !m.claimed && handleOpenChest(m.id)}
                                    disabled={m.claimed}
                                    style={{ width: '100%', marginTop: '12px', padding: '8px', fontSize: '0.8rem' }}
                                >
                                    {m.claimed ? 'Đã nhận' : '💎 Mở rương'}
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
        <div className="chest-celebration-overlay fade-in" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div className={`celebration-content ${claimedPrize ? 'titan-prize-zoom' : ''}`}>
                <div className="chest-animation">
                    {claimedPrize ? (
                        <div className="prize-reveal">
                            <div style={{ fontSize: '5rem', marginBottom: '20px' }}>{claimedPrize.type === 'coin' ? '💰' : '✨'}</div>
                            <h2 style={{ fontSize: '3rem', fontWeight: 950, color: 'var(--accent)' }}>+{claimedPrize.amount} {claimedPrize.type.toUpperCase()}</h2>
                            <p style={{ color: 'rgba(255,255,255,0.4)' }}>Bạn đã mở được {openingChest.prize.chestName}</p>
                            <button className="btn btn-primary" onClick={closeCelebration} style={{ marginTop: '30px', padding: '15px 50px' }}>Xác nhận</button>
                        </div>
                    ) : (
                        <div className="titan-chest-shake">
                            <div style={{ fontSize: '8rem' }}>📦</div>
                            <h3 style={{ marginTop: '20px', color: 'white' }}>Đang phá giải cấm chế...</h3>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </>
  );
}

'use client';

import { useState } from 'react';
import { useEngagement } from '@/context/EngagementContext';
import { Gift, Trophy, Package, Sparkles, X, Gem, CheckCircle2 } from 'lucide-react';

export default function MissionPanel() {
  const { dailyMissions, openChest, rankTitle, mounted } = useEngagement();
  const [isOpen, setIsOpen] = useState(false);
  const [openingChest, setOpeningChest] = useState(null); 
  const [claimedPrize, setClaimedPrize] = useState(null);

  if (!mounted) return null;

  const handleOpenChest = (missionId) => {
    const prize = openChest(missionId);
    if (prize) {
      setOpeningChest({ missionId, prize });
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
  const unclaimedCount = dailyMissions.missions.filter(m => m.current >= m.target && !m.claimed).length;

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`mission-toggle ${unclaimedCount > 0 ? 'has-rewards' : ''}`}
        title="Nhiệm vụ hàng ngày"
      >
        {isOpen ? <X size={24} /> : <Gift size={24} />}
        {unclaimedCount > 0 && <span className="mission-dot-industrial" />}
      </button>

      {isOpen && (
        <div className="mission-panel-overlay fade-in" onClick={() => setIsOpen(false)}>
          <div className="mission-panel glass-scrollbar" onClick={(e) => e.stopPropagation()}>
            <div className="mission-header-industrial">
                <div className="mission-header-left">
                    <div className="mission-icon-box">
                        <Trophy size={20} color="white" />
                    </div>
                    <div className="mission-header-text">
                        <h3 className="mission-title-main">Tiến Độ</h3>
                        <p className="mission-subtitle">Thử thách hàng ngày</p>
                    </div>
                </div>
                <span className="badge-titan-rank">{rankTitle}</span>
            </div>

            <div className="mission-list-industrial">
                {dailyMissions.missions.map(m => {
                    const isDone = m.current >= m.target;
                    const progress = Math.min((m.current / m.target) * 100, 100);
                    return (
                        <div key={m.id} className={`mission-item ${isDone ? 'done' : ''}`}>
                            <div className="mission-item-header">
                                <div className="mission-item-left">
                                    {isDone ? <CheckCircle2 size={16} color="var(--accent)" /> : <Sparkles size={16} color="#60a5fa" />}
                                    <span className="mission-label-text">{m.label}</span>
                                </div>
                                <span className="mission-count-text">{m.current}/{m.target}</span>
                            </div>
                            <div className="mission-progress-bg">
                                <div 
                                    className={`mission-progress-fill ${isDone ? 'is-done-fill' : ''}`} 
                                    style={{ '--progress': `${progress}%` }} 
                                />
                            </div>
                            {isDone && (
                                <button 
                                    className={`btn ${m.claimed ? 'btn-outline' : 'btn-primary'} mission-reward-btn`}
                                    onClick={() => !m.claimed && handleOpenChest(m.id)}
                                    disabled={m.claimed}
                                >
                                    {m.claimed ? <CheckCircle2 size={16} /> : <Gem size={16} />}
                                    {m.claimed ? 'Đã nhận thưởng' : 'Nhận phần thưởng'}
                                </button>
                            )}
                        </div>
                    )
                })}
            </div>
          </div>
        </div>
      )}

      {openingChest && (
        <div className="chest-celebration-overlay fade-in">
            <div className={`prize-reveal-content ${claimedPrize ? 'titan-prize-zoom' : ''}`}>
                {claimedPrize ? (
                    <div className="prize-reveal-card">
                        <div className="prize-icon-glow">
                            {claimedPrize.type === 'coin' ? <Gem size={80} color="var(--accent)" /> : <Sparkles size={80} color="#60a5fa" />}
                        </div>
                        <h2 className="prize-amount">+{claimedPrize.amount}</h2>
                        <p className="prize-type-label">{claimedPrize.type.toUpperCase()} THƯỞNG</p>
                        <p className="prize-desc-text">Chúc mừng bạn đã hoàn thành nhiệm vụ và nhận được phần quà này.</p>
                        <button className="btn btn-primary prize-close-btn" onClick={closeCelebration}>ĐÓNG</button>
                    </div>
                ) : (
                    <div className="titan-chest-shake">
                        <div className="pulse-chest">
                            <Package size={120} strokeWidth={1} />
                        </div>
                        <h3 className="celebration-sync-text">ĐANG XỬ LÝ PHẦN THƯỞNG...</h3>
                        <div className="celebration-loader-bar">
                            <div className="skeleton-shimmer full-height" />
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}

      <style jsx global>{`
        .mission-dot-industrial {
            position: absolute;
            top: -2px;
            right: -2px;
            width: 14px;
            height: 14px;
            background: var(--accent);
            border-radius: 50%;
            border: 2px solid white;
        }
        .mission-header-industrial {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
        }
        .mission-header-left {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .mission-icon-box {
            background: var(--accent);
            padding: 8px;
            border-radius: 10px;
            display: flex;
        }
        .mission-title-main {
            margin: 0;
            font-weight: 950;
            font-size: 1.25rem;
            color: white;
            letter-spacing: -0.5px;
        }
        .mission-subtitle {
            margin: 0;
            font-size: 0.7rem;
            opacity: 0.5;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 800;
        }
        .badge-titan-rank {
            background: rgba(255, 255, 255, 0.05);
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 800;
            border: 1px solid var(--glass-border);
            color: white;
        }
        .mission-list-industrial {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        .mission-item-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        .mission-item-left {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .mission-label-text {
            font-weight: 800;
            font-size: 0.9rem;
            color: white;
        }
        .mission-item.done .mission-label-text {
            color: var(--accent);
        }
        .mission-count-text {
            font-size: 0.8rem;
            font-weight: 900;
            color: rgba(255, 255, 255, 0.4);
        }
        .mission-item.done .mission-count-text {
            color: var(--accent);
        }
        .mission-progress-bg {
            height: 6px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 3px;
            overflow: hidden;
            position: relative;
        }
        .mission-progress-fill {
            height: 100%;
            width: var(--progress);
            background: #60a5fa;
            border-radius: 3px;
            transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .mission-progress-fill.is-done-fill {
            background: var(--accent);
        }
        .mission-reward-btn {
            width: 100%;
            margin-top: 15px;
            height: 44px;
            border-radius: 12px;
            font-weight: 900;
            font-size: 0.85rem;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        .prize-icon-glow {
            margin-bottom: 30px;
            filter: drop-shadow(0 0 40px var(--accent));
        }
        .prize-amount {
            font-size: 4rem;
            font-weight: 950;
            color: white;
            margin-bottom: 5px;
            letter-spacing: -3px;
        }
        .prize-type-label {
            color: var(--accent);
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 3px;
            font-size: 0.95rem;
        }
        .prize-desc-text {
            color: rgba(255, 255, 255, 0.4);
            margin-top: 25px;
            max-width: 320px;
            margin-left: auto;
            margin-right: auto;
            font-weight: 700;
            line-height: 1.6;
        }
        .prize-close-btn {
            margin-top: 40px;
            padding: 15px 60px;
            border-radius: 30px;
            font-weight: 950;
        }
        .pulse-chest {
            color: var(--accent);
            animation: titan-pulse 1.5s infinite;
        }
        .celebration-sync-text {
            margin-top: 30px;
            color: white;
            font-weight: 950;
            font-size: 1.4rem;
            letter-spacing: 1px;
        }
        .celebration-loader-bar {
            width: 120px;
            height: 4px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 2px;
            margin: 25px auto 0;
            overflow: hidden;
        }
        .full-height { height: 100%; }
      `}</style>
    </>
  );
}

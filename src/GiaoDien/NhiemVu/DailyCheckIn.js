'use client';

import { useState, useEffect } from 'react';
import { useEngagement } from '@/NguCanh/EngagementContext';
import { Gift, Lock } from 'lucide-react';

export default function DailyCheckIn() {
  const { checkIn, checkInStreak, lastCheckIn, mounted } = useEngagement();
  const [msg, setMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const [serverDate, setServerDate] = useState('');

  useEffect(() => {
    if (mounted) {
       fetch('/api/system/time')
         .then(res => res.json())
         .then(data => setServerDate(data.dateString))
         .catch(() => setServerDate(new Date().toDateString()));
    }
  }, [mounted]);

  if (!mounted) return <div className="skeleton-loader-industrial" />;

  const alreadyChecked = lastCheckIn === serverDate;
  const currentStreak = isSuccess ? checkInStreak : (alreadyChecked ? checkInStreak : checkInStreak);

  const handleCheckIn = () => {
    const result = checkIn(serverDate);
    setMsg(result.msg);
    setIsSuccess(result.success);
  };

  return (
    <section className="checkin-section-titan fade-up">
        <div className="glass-titan-checkin">
            <div className="checkin-info-industrial">
                <h3 className="checkin-title">Äioƒm danh háº±ng ngà y</h3>
                <p className="checkin-subtitle">Nháº­n VipCoins và  XP mo—i láº§n báo danh.</p>
                
                <div className="streak-container-industrial">
                    <div className="streak-bar-titan">
                        {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                            <div key={d} className={`streak-step ${d <= currentStreak ? 'active' : ''}`}>
                                {d === 7 && (
                                    <div className={`streak-gift-box ${currentStreak >= 7 ? 'is-active' : ''}`}>
                                        {currentStreak >= 7 ? <Gift size={20} /> : <Lock size={18} />}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="streak-meta">
                        <span>KhoŸi Ä‘áº§u</span>
                        <span>Pháº§n thưoŸng (Ngà y 7)</span>
                    </div>
                </div>
            </div>

            <div className="checkin-action">
                <button 
                    className={`btn-titan-checkin ${alreadyChecked ? 'checked' : 'active'}`} 
                    onClick={handleCheckIn}
                    disabled={alreadyChecked}
                >
                    {alreadyChecked ? 'Äà£ Ä‘ioƒm danh' : 'Äioƒm danh ngay'}
                </button>
                {msg && <p className={`checkin-msg-industrial ${isSuccess ? 'success' : 'error'}`}>{msg}</p>}
            </div>
        </div>
        <style jsx>{`
            .checkin-info-industrial {
                flex: 1;
                min-width: 0;
            }
            .streak-container-industrial {
                position: relative;
                margin-top: 35px;
            }
            .streak-gift-box {
                position: absolute;
                top: -35px;
                color: rgba(255, 255, 255, 0.1);
                transition: all 0.5s;
            }
            .streak-gift-box.is-active {
                color: var(--accent);
                animation: titan-bounce 2s infinite;
            }
            .checkin-msg-industrial {
                margin-top: 15px;
                font-size: 0.85rem;
                font-weight: 900;
                letter-spacing: 0.3px;
                animation: fade-in 0.3s ease;
            }
            .checkin-msg-industrial.success { color: var(--accent); }
            .checkin-msg-industrial.error { color: #ff4444; }
            
            .skeleton-loader-industrial {
                height: 180px;
                background: rgba(255, 255, 255, 0.02);
                border-radius: 20px;
                border: 1px dashed var(--glass-border);
            }

            @keyframes titan-bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-8px); }
            }
        `}</style>
    </section>
  );
}


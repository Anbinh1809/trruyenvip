'use client';

import { useState, useEffect } from 'react';
import { useEngagement } from '@/context/EngagementContext';
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

  if (!mounted) return <div className="skeleton-loader" style={{ height: '220px', borderRadius: '30px' }} />;

  const alreadyChecked = lastCheckIn === serverDate;

  const handleCheckIn = () => {
    const result = checkIn(serverDate);
    setMsg(result.msg);
    setIsSuccess(result.success);
  };

  const currentStreak = isSuccess ? checkInStreak : (alreadyChecked ? checkInStreak : checkInStreak);

  return (
    <section className="checkin-section-titan fade-up">
        <div className="glass-titan-checkin">
            <div className="checkin-text" style={{ flex: 1, minWidth: 0 }}>
                <h3 className="checkin-title">Điểm danh hằng ngày</h3>
                <p className="checkin-subtitle" style={{ fontSize: '0.85rem', marginBottom: '20px' }}>Nhận VipCoins và XP mỗi lần báo danh.</p>
                
                <div className="streak-container-nebula" style={{ position: 'relative', marginTop: '30px' }}>
                    <div className="streak-bar-titan">
                        {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                            <div key={d} className={`streak-step ${d <= currentStreak ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                {d === 7 && (
                                    <div style={{ position: 'absolute', top: '-30px', color: currentStreak >= 7 ? 'var(--accent)' : 'rgba(255,255,255,0.2)', animation: currentStreak >= 7 ? 'bounce 2s infinite' : 'none' }}>
                                        {currentStreak >= 7 ? <Gift size={20} /> : <Lock size={18} />}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                        <span>Khởi đầu</span>
                        <span>Phần thưởng (Ngày 7)</span>
                    </div>
                </div>
            </div>

            <div className="checkin-action" style={{ textAlign: 'center' }}>
                <button 
                    className={`btn-titan-checkin ${alreadyChecked ? 'checked' : 'active'}`} 
                    onClick={handleCheckIn}
                    disabled={alreadyChecked}
                    style={{ width: '100%', minWidth: '180px' }}
                >
                    {alreadyChecked ? 'Đã điểm danh' : 'Điểm danh ngay'}
                </button>
                {msg && <p style={{ marginTop: '12px', fontSize: '0.8rem', fontWeight: 800, color: isSuccess ? 'var(--accent)' : '#ff4444' }}>{msg}</p>}
            </div>
        </div>
    </section>
  );
}

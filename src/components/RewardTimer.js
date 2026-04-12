'use client';

import { useState, useEffect } from 'react';
import { useEngagement } from '@/context/EngagementContext';

/**
 * RewardTimer (Repurposed for Mission Tracking)
 * Theo dõi thời gian đọc để cộng vào nhiệm vụ "Ngộ tính cao" (15 phút).
 */
export default function RewardTimer({ chapterId }) {
  const { updateMission } = useEngagement();
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    // Mỗi 60 giây đọc truyện sẽ cộng 1 phút vào tiến trình nhiệm vụ
    const timer = setInterval(() => {
      setSeconds(prev => {
          if (prev >= 59) {
              updateMission('READ_PROGRESS', 1);
              return 0;
          }
          return prev + 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [updateMission]);

  // UI tinh giản, không gây phiền nhiễu khi đọc
  return (
    <div className="mission-progress-hint" style={{ position: 'fixed', right: '30px', bottom: '170px', fontSize: '0.65rem', opacity: 0.4, pointerEvents: 'none' }}>
        ⚛️ Đang thiền định... ({seconds}s)
    </div>
  );
}

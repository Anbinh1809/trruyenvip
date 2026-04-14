'use client';

import { useState, useEffect } from 'react';
import { useEngagement } from '@/context/EngagementContext';
import { Zap } from 'lucide-react';

/**
 * RewardTimer (Repurposed for Mission Tracking)
 * Theo dõi thời gian đọc để cộng vào nhiệm vụ "Ngộ tính cao" (15 phút).
 */
export default function RewardTimer({ chapterId }) {
  const { updateMission } = useEngagement();
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
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

  return (
    <div className="progress-hint-industrial fade-in">
        <Zap size={10} color="var(--accent)" className="pulse-slow" /> 
        <span>ĐANG TÍNH ĐIỂM NGỘ TÍNH... ({seconds}s)</span>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useEngagement } from '@/NguCanh/EngagementContext';
import { Zap } from 'lucide-react';

/**
 * RewardTimer (Repurposed for Mission Tracking)
 * Theo dõi thoi gian Ä‘oc Ä‘oƒ co™ng và o nhiệm vo¥ "Ngo™ tà­nh cao" (15 phàºt).
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
        <span>ÄANG TàNH ÄIo‚M NGo˜ TàNH... ({seconds}s)</span>
    </div>
  );
}


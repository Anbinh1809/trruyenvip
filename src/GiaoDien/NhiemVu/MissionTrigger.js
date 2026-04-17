'use client';

import { useEffect, useRef } from 'react';
import { useEngagement } from '@/NguCanh/EngagementContext';

export default function MissionTrigger({ type, increment = 1 }) {
  const { updateMission } = useEngagement();
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    // 1. Component Execution Guard: Ensure mission is only triggered once per component mount (page load)
    if (hasTriggeredRef.current) return;

    // 2. Session Throttle: Prevent rapid triggers (e.g. back-and-forth navigation) within 30 seconds
    const sessionKey = `truyenvip_last_trigger_${type}`;
    const lastTrigger = localStorage.getItem(sessionKey);
    const now = Date.now();

    if (lastTrigger && (now - parseInt(lastTrigger)) < 30000) {
        return;
    }

    updateMission(type, increment);
    hasTriggeredRef.current = true;
    localStorage.setItem(sessionKey, now.toString());
  }, [type, increment, updateMission]);


  return null;
}


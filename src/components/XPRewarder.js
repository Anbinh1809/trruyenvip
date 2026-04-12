'use client';

import { useEffect, useRef } from 'react';
import { useEngagement } from '@/context/EngagementContext';

/**
 * XPRewarder (Tối giản)
 * Thưởng một lượng linh khí nhỏ khi đọc xong chương.
 */
export default function XPRewarder({ chapterId }) {
  const { addXp } = useEngagement();
  const hasRewardedRef = useRef(false);

  useEffect(() => {
    // Execution Guard: Ensure XP is only added once per unique chapter visit in this session
    if (chapterId && !hasRewardedRef.current) {
      addXp(2, true); 
      hasRewardedRef.current = true;
    }
  }, [chapterId, addXp]);

  return null;
}

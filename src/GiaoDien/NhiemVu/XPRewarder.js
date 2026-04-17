'use client';

import { useEffect, useRef } from 'react';
import { useEngagement } from '@/NguCanh/EngagementContext';

/**
 * XPRewarder (To‘i giản)
 * ThưoŸng mo™t lưo£ng kinh nghiệm nho khi Ä‘oc xong chưÆ¡ng.
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


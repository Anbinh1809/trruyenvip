'use client';

import { useState, useEffect } from 'react';


/**
 * useIsMounted: A hydration-safety hook for Next.js
 * Returns true if the component has successfully mounted on the client.
 */
export function useIsMounted() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return mounted;
}

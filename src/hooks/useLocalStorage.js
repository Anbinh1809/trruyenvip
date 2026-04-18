'use client';

import { useState, useEffect, useCallback } from 'react';

import { useIsMounted } from './useIsMounted';

/**
 * useLocalStorage: Reactive storage hook
 * @param {string} key 
 * @param {any} initialValue 
 */
export function useLocalStorage(key, initialValue) {
  const mounted = useIsMounted();
  
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        window.dispatchEvent(new Event('storage')); // Notify other components
      }
    } catch (error) {
      console.error('[LocalStorage] Write error:', error);
    }
  }, [key, storedValue]);

  // Sync with storage events from other tabs/windows
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const item = window.localStorage.getItem(key);
        if (item) setStoredValue(JSON.parse(item));
      } catch (e) {}
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [mounted ? storedValue : initialValue, setValue, mounted];
}

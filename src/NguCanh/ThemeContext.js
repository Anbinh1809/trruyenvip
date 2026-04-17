'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useIsMounted } from '@/TroThu/Hooks/useIsMounted';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const mounted = useIsMounted();

  useEffect(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('truyenvip_theme') || 'light';
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTheme(saved);
        document.documentElement.setAttribute('data-theme', saved);
    }
  }, []);

  useEffect(() => {
    if (mounted) {
        document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('truyenvip_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };


  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

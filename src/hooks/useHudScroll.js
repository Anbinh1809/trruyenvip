'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * TITAN HUD SENSOR
 * Tracks scroll direction to automatically hide/show the reader HUD.
 */
export function useHudScroll() {
    const [isVisible, setIsVisible] = useState(true);
    const lastScrollY = useRef(0);
    const scrollThreshold = 10; // Minimum scroll diff to trigger

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const diff = Math.abs(currentScrollY - lastScrollY.current);

            if (diff < scrollThreshold) return;

            if (currentScrollY < 100) {
                // Always show at the very top
                setIsVisible(true);
            } else if (currentScrollY > lastScrollY.current) {
                // Scrolling down - Hide
                setIsVisible(false);
            } else {
                // Scrolling up - Show
                setIsVisible(true);
            }

            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return { isVisible };
}

'use client';

import { useHudScroll } from '@/hooks/useHudScroll';

/**
 * TITAN READER HUD
 * Client wrapper that manages immersive scroll behavior.
 */
export default function ReaderHud({ children }) {
    const { isVisible } = useHudScroll();

    return (
        <div className={`reader-hud-titan shadow-titan ${!isVisible ? 'hud-hidden' : ''}`}>
            {children}
        </div>
    );
}


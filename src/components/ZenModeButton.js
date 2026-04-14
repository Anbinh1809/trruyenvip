'use client';

import { useState, useEffect } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

export default function ZenModeButton() {
    const [isFull, setIsFull] = useState(false);

    const toggleZen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handleFSChange = () => {
            setIsFull(!!document.fullscreenElement);
        };

        const handleKeyDown = (e) => {
            if (e.key.toLowerCase() === 'z' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
                toggleZen();
            }
        };

        document.addEventListener('fullscreenchange', handleFSChange);
        document.addEventListener('keydown', handleKeyDown);
        
        return () => {
            document.removeEventListener('fullscreenchange', handleFSChange);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    return (
        <button 
            onClick={toggleZen}
            className={`btn-reader-nav titan-zen-btn ${isFull ? 'active' : ''}`}
            title={isFull ? "Thoát Zen" : "Chế độ Zen (Toàn màn hình) [Z]"}
        >
            {isFull ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            <span className="desktop-only border-accent-bottom">{isFull ? 'Thoát Zen' : 'Zen Mode'}</span>
        </button>
  );
}

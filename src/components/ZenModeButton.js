'use client';

import { useState, useEffect } from 'react';

export default function ZenModeButton() {
    const [isFull, setIsFull] = useState(false);

    useEffect(() => {
        const handleFSChange = () => {
            setIsFull(!!document.fullscreenElement);
            if (document.fullscreenElement) {
                document.body.classList.add('zen-mode-active');
            } else {
                document.body.classList.remove('zen-mode-active');
            }
        };

        const handleKeyDown = (e) => {
            if (e.key.toLowerCase() === 'z' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
                toggleZen();
            }
        };

        document.addEventListener('fullscreenchange', handleFSChange);
        document.addEventListener('webkitfullscreenchange', handleFSChange);
        document.addEventListener('keydown', handleKeyDown);
        
        return () => {
            document.removeEventListener('fullscreenchange', handleFSChange);
            document.removeEventListener('webkitfullscreenchange', handleFSChange);
            document.removeEventListener('keydown', handleKeyDown);
            document.body.classList.remove('zen-mode-active');
        };
    }, []);

    const toggleZen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    return (
        <button 
            onClick={toggleZen}
            className={`titan-zen-btn ${isFull ? 'active' : ''}`}
            title={isFull ? "Thoát Zen" : "Chế độ Zen (Toàn màn hình)"}
            style={{ position: 'relative', zIndex: 1001 }}
        >
            <span style={{ fontSize: '1.1rem' }}>{isFull ? '🧘' : '👁️'}</span>
            <span className="titan-zen-text">{isFull ? 'Thoát Zen' : 'Zen Mode'}</span>
        </button>
    );
}

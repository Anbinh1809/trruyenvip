'use client';

import { useState, useEffect } from 'react';

export default function LevelUpOverlay({ level, rank, onComplete }) {
  const [visible, setVisible] = useState(level > 0);

  useEffect(() => {
    if (level > 0) {
      // TITAN CELEBRATION: Inject confetti script if missing and fire
      const fireConfetti = () => {
          if (window.confetti) {
              window.confetti({
                  particleCount: 150,
                  spread: 70,
                  origin: { y: 0.6 },
                  colors: ['#ff3e3e', '#ffffff', '#ffd700'],
                  zIndex: 2000
              });
          }
      };

      if (!window.confetti) {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js';
          script.onload = fireConfetti;
          document.head.appendChild(script);
      } else {
          fireConfetti();
      }

      const timer = setTimeout(() => {
        setVisible(false);
        if (onComplete) onComplete();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [level, rank, onComplete]);

  if (!visible) return null;

  return (
    <div className="titan-level-toast" onClick={() => setVisible(false)} style={{ cursor: 'pointer', zIndex: 10000 }}>
      {/* GLOW AURA BASED ON RANK */}
      <div className={`titan-celebration-box rank-aura-${rank.replace(/\s+/g, '-').toLowerCase()}`}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div className="celebration-icon-titan">✨</div>
            <div>
                <h3 className="celebration-title-titan">ĐỘT PHÁ CẢNH GIỚI!</h3>
                <div className="rank-tag-premium">{rank}</div>
                <p className="celebration-subtitle-titan">Thăng lên cấp {level}</p>
            </div>
        </div>
      </div>
    </div>
  );
}

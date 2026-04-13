'use client';

import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

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
      <div className="titan-celebration-box">
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div className="celebration-icon-titan">
                <Sparkles size={28} color="var(--accent)" />
            </div>
            <div>
                <h3 className="celebration-title-titan">LÊN CẤP!</h3>
                <div className="rank-tag-premium">{rank}</div>
                <p className="celebration-subtitle-titan">Cấp {level}</p>
            </div>
        </div>
      </div>
    </div>
  );
}

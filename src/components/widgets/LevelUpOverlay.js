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
    <div className="titan-level-toast-industrial" onClick={() => setVisible(false)}>
      <div className="titan-celebration-box-industrial">
        <div className="celebration-layout-industrial">
            <div className="celebration-icon-titan-industrial">
                <Sparkles size={28} />
            </div>
            <div className="celebration-text-industrial">
                <h3 className="celebration-title-titan-industrial">LÊN CẤP!</h3>
                <div className="rank-tag-premium-industrial">{rank}</div>
                <p className="celebration-subtitle-titan-industrial">Cấp {level}</p>
            </div>
        </div>
      </div>
      <style>{`
        .titan-level-toast-industrial {
            position: fixed;
            bottom: 30px;
            right: 30px;
            z-index: 10000;
            cursor: pointer;
            pointer-events: auto;
        }
        .titan-celebration-box-industrial {
            background: rgba(15, 23, 42, 0.8);
            backdrop-filter: blur(20px);
            border: 1px solid var(--accent);
            border-radius: 20px;
            padding: 20px 30px;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 62, 62, 0.2);
            animation: titan-toast-slide 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .celebration-layout-industrial {
            display: flex;
            align-items: center;
            gap: 20px;
        }
        .celebration-icon-titan-industrial {
            width: 50px;
            height: 50px;
            background: rgba(255, 62, 62, 0.1);
            border: 1px solid rgba(255, 62, 62, 0.2);
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--accent);
            flex-shrink: 0;
        }
        .celebration-text-industrial {
            flex: 1;
        }
        .celebration-title-titan-industrial {
            font-size: 1.2rem;
            font-weight: 950;
            color: var(--text-primary);
            margin: 0;
            letter-spacing: 1px;
        }
        .rank-tag-premium-industrial {
            font-size: 0.75rem;
            font-weight: 850;
            color: var(--accent);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 4px;
        }
        .celebration-subtitle-titan-industrial {
            font-size: 0.85rem;
            font-weight: 750;
            color: var(--text-muted);
            margin: 4px 0 0;
        }
        @keyframes titan-toast-slide {
            from { transform: translateX(100px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

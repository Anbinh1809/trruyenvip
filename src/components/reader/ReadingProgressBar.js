'use client';

import { useState, useEffect } from 'react';

export default function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      
      const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100;
      setProgress(Math.min(100, Math.max(0, scrollPercent)));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="reading-progress-container-industrial">
      <div 
        className="reading-progress-bar-industrial" 
        style={{ '--progress': `${progress}%` }}
      ></div>
      <div className="reading-progress-shimmer-industrial"></div>
      <style jsx>{`
        .reading-progress-container-industrial {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 4px;
            z-index: 10001; /* Above Reader Nav */
            background: rgba(255, 255, 255, 0.02);
            overflow: hidden;
        }
        .reading-progress-bar-industrial {
            height: 100%;
            width: var(--progress);
            background: linear-gradient(90deg, var(--accent), #ff7b7b);
            box-shadow: 0 0 10px rgba(255, 62, 62, 0.5);
            transition: width 0.1s ease-out;
            position: relative;
            z-index: 2;
        }
        .reading-progress-shimmer-industrial {
            position: absolute;
            inset: 0;
            background: linear-gradient(90deg, 
                rgba(255,255,255,0) 0%, 
                rgba(255,255,255,0.2) 50%, 
                rgba(255,255,255,0) 100%
            );
            width: 50%;
            height: 100%;
            animation: titan-progress-shimmer 2s infinite linear;
            z-index: 3;
        }
        @keyframes titan-progress-shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}

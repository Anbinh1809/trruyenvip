'use client';

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';


export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    setIsLaunching(true);
    
    // Smooth scroll with a slight delay to let the rocket take off
    setTimeout(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
        
        // Reset state after reaching top (approx 1s)
        setTimeout(() => {
            setIsLaunching(false);
        }, 800);
    }, 150);
  };

  return (
    <div 
        className={`back-to-top-titan ${isVisible ? 'visible' : ''} ${isLaunching ? 'launch' : ''}`} 
        onClick={scrollToTop}
    >
      <div className="rocket-icon"><ArrowUp size={24} /></div>

      <div className="shimmer-effect"></div>
    </div>
  );
}

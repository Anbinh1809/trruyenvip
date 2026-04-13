/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect } from 'react';
import { Settings, Eye, Layout, Sun, Monitor, Smartphone, Type } from 'lucide-react';

export default function ReaderSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('none');
  const [brightness, setBrightness] = useState(1);
  const [isWebtoon, setIsWebtoon] = useState(true);
  const [mounted, setMounted] = useState(false);

  const handleBrightnessChange = (val) => {
    setBrightness(val);
    localStorage.setItem('truyenvip_brightness', val);
    document.documentElement.style.setProperty('--reader-brightness', val);
  };

  const handleFilterChange = (f) => {
    setFilter(f);
    localStorage.setItem('truyenvip_reader_filter', f);
    
    const root = document.documentElement;
    switch (f) {
      case 'sepia': 
        root.style.setProperty('--reader-filter', 'sepia(0.5) contrast(0.9)'); 
        root.style.setProperty('--reader-bg', '#f4ecd8');
        root.style.setProperty('--reader-text', '#5b4636');
        break;
      case 'blue-light': 
        root.style.setProperty('--reader-filter', 'sepia(0.3) brightness(0.9) hue-rotate(-10deg)'); 
        root.style.setProperty('--reader-bg', '#e8f1f2');
        root.style.setProperty('--reader-text', '#2c3e50');
        break;
      case 'dark': 
        root.style.setProperty('--reader-filter', 'invert(0.9) hue-rotate(180deg)'); 
        root.style.setProperty('--reader-bg', '#050505');
        root.style.setProperty('--reader-text', '#ffffff');
        break;
      case 'none':
        root.style.setProperty('--reader-filter', 'none');
        root.style.setProperty('--reader-bg', '#ffffff');
        root.style.setProperty('--reader-text', '#000000');
        break;
      default: 
        root.style.setProperty('--reader-filter', 'none');
        root.style.setProperty('--reader-bg', '#050505');
        root.style.setProperty('--reader-text', '#ffffff');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    const savedFilter = localStorage.getItem('truyenvip_reader_filter') || 'none';
    const savedBrightness = parseFloat(localStorage.getItem('truyenvip_brightness') || '1');
    const savedMode = localStorage.getItem('truyenvip_reader_mode') !== 'single';
    setFilter(savedFilter);
    setBrightness(savedBrightness);
    setIsWebtoon(savedMode);
    handleFilterChange(savedFilter);
    document.documentElement.style.setProperty('--reader-brightness', savedBrightness);
    return () => clearTimeout(timer);
  }, []);

  const handleModeChange = (val) => {
    setIsWebtoon(val);
    localStorage.setItem('truyenvip_reader_mode', val ? 'webtoon' : 'single');
  };

  useEffect(() => {
    handleFilterChange(filter);
  }, [filter]);

  return (
    <>
      <div className="titan-reader-hud" onClick={() => setIsOpen(!isOpen)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Settings size={22} className={isOpen ? 'rotate-90' : ''} style={{ transition: 'transform 0.3s' }} />
      </div>

      {isOpen && (
        <div className="titan-reader-panel fade-in glass glass-scrollbar" style={{ zIndex: 10005 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <Monitor size={16} color="var(--accent)" />
              <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 950, letterSpacing: '0.5px' }}>Đọc Ẩn Danh</h4>
          </div>
          
          <div className="setting-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Layout size={14} color="rgba(255,255,255,0.4)" />
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>Chế độ hiển thị</p>
            </div>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px' }}>
              <button 
                style={{ flex: 1, border: 'none', padding: '10px', borderRadius: '8px', fontSize: '0.75rem', cursor: 'pointer', background: isWebtoon ? 'var(--accent)' : 'transparent', color: isWebtoon ? 'white' : 'rgba(255,255,255,0.6)', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} 
                onClick={() => handleModeChange(true)}
              >
                <Smartphone size={14} /> Cuộn dọc
              </button>
              <button 
                style={{ flex: 1, border: 'none', padding: '10px', borderRadius: '8px', fontSize: '0.75rem', cursor: 'pointer', background: !isWebtoon ? 'var(--accent)' : 'transparent', color: !isWebtoon ? 'white' : 'rgba(255,255,255,0.6)', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} 
                onClick={() => handleModeChange(false)}
              >
                <Type size={14} /> Từng trang
              </button>
            </div>
          </div>

          <div className="setting-group" style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Sun size={14} color="rgba(255,255,255,0.4)" />
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>Nền màn hình</p>
            </div>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px' }}>
              <button 
                style={{ flex: 1, border: 'none', padding: '10px', borderRadius: '8px', fontSize: '0.75rem', cursor: 'pointer', background: filter === 'none' ? 'var(--accent)' : 'transparent', color: filter === 'none' ? 'white' : 'rgba(255,255,255,0.6)', fontWeight: 800 }} 
                onClick={() => handleFilterChange('none')}
              >
                Sáng
              </button>
              <button 
                style={{ flex: 1, border: 'none', padding: '10px', borderRadius: '8px', fontSize: '0.75rem', cursor: 'pointer', background: filter === 'dark' ? 'var(--accent)' : 'transparent', color: filter === 'dark' ? 'white' : 'rgba(255,255,255,0.6)', fontWeight: 800 }} 
                onClick={() => handleFilterChange('dark')}
              >
                Tối
              </button>
            </div>
          </div>

          <div className="setting-group" style={{ marginTop: '20px' }}>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>Chất Lượng Hình Ảnh</p>
            <div 
              style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                  background: 'rgba(255,255,255,0.05)', padding: '10px 15px', 
                  borderRadius: '12px', cursor: 'pointer' 
              }}
              onClick={() => {
                  const nextVal = localStorage.getItem('truyenvip_hifi') !== 'true';
                  localStorage.setItem('truyenvip_hifi', nextVal ? 'true' : 'false');
                  window.dispatchEvent(new Event('storage')); // Trigger update
                  setTimeout(() => window.location.reload(), 200); // Reload to apply new width to all images
              }}
            >
                <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>Chế độ 4K Sắc Nét</div>
                <div style={{ 
                    width: '36px', height: '20px', borderRadius: '10px', 
                    background: mounted && localStorage.getItem('truyenvip_hifi') === 'true' ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                    position: 'relative', transition: '0.3s'
                }}>
                    <div style={{ 
                        width: '14px', height: '14px', borderRadius: '50%', background: 'white',
                        position: 'absolute', top: '3px', 
                        left: mounted && localStorage.getItem('truyenvip_hifi') === 'true' ? '19px' : '3px',
                        transition: '0.3s'
                    }} />
                </div>
            </div>
            <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', marginTop: '5px' }}>Tốn băng thông hơn, ảnh sắc nét tuyệt đối.</p>
          </div>
        </div>
      )}
    </>
  );
}

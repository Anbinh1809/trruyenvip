/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect } from 'react';

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
    // Initial sync
    handleFilterChange(filter);
  }, [filter]);

  return (
    <>
      <div className="titan-reader-hud" onClick={() => setIsOpen(!isOpen)}>
        ⚙️
      </div>

      {isOpen && (
        <div className="titan-reader-panel fade-in">
          <h4 style={{ margin: '0 0 15px', fontSize: '0.9rem', fontWeight: 900 }}>Tu Luyện Ẩn Kỳ</h4>
          
          <div className="setting-group">
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>Chế độ hiển thị</p>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px' }}>
              <button 
                style={{ flex: 1, border: 'none', padding: '8px', borderRadius: '8px', fontSize: '0.75rem', cursor: 'pointer', background: isWebtoon ? 'var(--accent)' : 'transparent', color: isWebtoon ? 'white' : 'rgba(255,255,255,0.6)', fontWeight: 700 }} 
                onClick={() => handleModeChange(true)}
              >
                Cuộn dọc
              </button>
              <button 
                style={{ flex: 1, border: 'none', padding: '8px', borderRadius: '8px', fontSize: '0.75rem', cursor: 'pointer', background: !isWebtoon ? 'var(--accent)' : 'transparent', color: !isWebtoon ? 'white' : 'rgba(255,255,255,0.6)', fontWeight: 700 }} 
                onClick={() => handleModeChange(false)}
              >
                Từng trang
              </button>
            </div>
          </div>

          <div className="setting-group" style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Độ sáng 'Hộ Nhãn'</p>
                <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 800 }}>{Math.round(brightness * 100)}%</span>
            </div>
            <input 
                type="range" 
                min="0.1" 
                max="1.0" 
                step="0.05" 
                value={brightness} 
                onChange={(e) => handleBrightnessChange(parseFloat(e.target.value))}
                style={{ 
                    width: '100%', cursor: 'pointer', accentColor: 'var(--accent)',
                    background: 'rgba(255,255,255,0.1)', height: '4px', borderRadius: '2px',
                    appearance: 'none'
                }}
            />
          </div>

          <div className="setting-group" style={{ marginTop: '20px' }}>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>Ngũ Hành Bộ Lọc</p>
            <div className="titan-filter-grid">
              <div 
                className={`titan-filter-box f-none ${filter === 'none' ? 'active' : ''}`} 
                onClick={() => handleFilterChange('none')}
                title="Gốc"
              />
              <div 
                className={`titan-filter-box f-sepia ${filter === 'sepia' ? 'active' : ''}`} 
                onClick={() => handleFilterChange('sepia')}
                title="Giấy cũ"
              />
              <div 
                className={`titan-filter-box f-blue ${filter === 'blue-light' ? 'active' : ''}`} 
                onClick={() => handleFilterChange('blue-light')}
                title="Chống mỏi mắt"
              />
              <div 
                className={`titan-filter-box f-dark ${filter === 'dark' ? 'active' : ''}`} 
                onClick={() => handleFilterChange('dark')}
                title="Đầm toi"
              />
            </div>
          </div>

          <div className="setting-group" style={{ marginTop: '20px' }}>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>Chất Lượng 'Truyền Thần'</p>
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

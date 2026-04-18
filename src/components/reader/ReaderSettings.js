'use client';

import { useState, useEffect, useTransition } from 'react';
import { Settings, Eye, EyeOff, Layout, Palette, Monitor } from 'lucide-react';
import { useToast } from '@/components/widgets/ToastProvider';

export default function ReaderSettings() {
  const { addToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [incognito, setIncognito] = useState(false);
  const [isWebtoon, setIsWebtoon] = useState(true);
  const [filter, setFilter] = useState('none');
  const [isHiFi, setIsHiFi] = useState(false);
  const [isTurbo, setIsTurbo] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const incog = localStorage.getItem('truyenvip_incognito') === 'true';
    const mode = localStorage.getItem('truyenvip_read_mode') || 'webtoon';
    const filt = localStorage.getItem('truyenvip_filter') || 'none';
    const hifi = localStorage.getItem('truyenvip_hifi') === 'true';
    const turbo = localStorage.getItem('truyenvip_turbo') === 'true';

    startTransition(() => {
        setIncognito(incog);
        setIsWebtoon(mode === 'webtoon');
        setFilter(filt);
        setIsHiFi(hifi);
        setIsTurbo(turbo);
    });
  }, []);

  const toggleIncognito = () => {
    const newVal = !incognito;
    setIncognito(newVal);
    localStorage.setItem('truyenvip_incognito', newVal.toString());
  };

  const toggleTurbo = () => {
    const newVal = !isTurbo;
    setIsTurbo(newVal);
    localStorage.setItem('truyenvip_turbo', newVal.toString());
    if (newVal) localStorage.setItem('truyenvip_hifi', 'false'); // Disable HiFi if Turbo is on
    addToast(newVal ? 'Đã kích hoạt Turbo Boost!' : 'Đã tắt Turbo', 'success');
    setTimeout(() => window.location.reload(), 1000);
  };

  const toggleWebtoon = (val) => {
    setIsWebtoon(val);
    localStorage.setItem('truyenvip_read_mode', val ? 'webtoon' : 'page');
  };

  const updateFilter = (val) => {
    setFilter(val);
    localStorage.setItem('truyenvip_filter', val);
  };

  const toggleHiFi = () => {
    const newVal = !isHiFi;
    setIsHiFi(newVal);
    localStorage.setItem('truyenvip_hifi', newVal.toString());
    addToast(newVal ? 'Đã bật chế độ Siêu nét 4K!' : 'Đã tắt 4K', 'success');
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <>
      <button 
        className="titan-reader-hud titan-icon-btn" 
        onClick={() => setIsOpen(!isOpen)} 
        title="Cài đặt trình đọc"
        aria-label="Cài đặt trình đọc"
        aria-expanded={isOpen}
      >
        <div className={`settings-icon-wrapper ${isOpen ? 'is-active' : ''}`}>
          <Settings size={22} />
        </div>
      </button>

      {isOpen && (
        <div className="titan-reader-panel fade-in" role="dialog" aria-label="Bảng cài đặt trình đọc">
          <div className="setting-header-industrial">
              <span className="setting-icon-box" aria-hidden="true">
                {incognito ? <EyeOff size={18} /> : <Eye size={18} />}
              </span>
              <div className="setting-header-text">
                  <h4 className="setting-main-title">Đọc Ẩn Danh</h4>
                  <p className="setting-desc">Không lưu lịch sử đọc</p>
              </div>
              <button 
                onClick={toggleIncognito} 
                className={`titan-switch ${incognito ? 'active' : ''}`} 
                role="switch"
                aria-checked={incognito}
                aria-label="Chế độ ẩn danh"
              />
          </div>

          <div className="setting-group">
            <label className="setting-label">
                <Layout size={14} aria-hidden="true" /> Chế độ hiển thị
            </label>
            <div className="setting-control-row">
                <button 
                  onClick={() => toggleWebtoon(true)}
                  className={`btn-setting-toggle ${isWebtoon ? 'active' : ''}`}
                  aria-pressed={isWebtoon}
                >
                    Cuộn dọc
                </button>
                <button 
                  onClick={() => toggleWebtoon(false)}
                  className={`btn-setting-toggle ${!isWebtoon ? 'active' : ''}`}
                  aria-pressed={!isWebtoon}
                >
                    Từng trang
                </button>
            </div>
          </div>

          <div className="setting-group">
            <label className="setting-label">
                <Palette size={14} aria-hidden="true" /> Nền màn hình
            </label>
            <div className="setting-control-row">
                <button 
                  onClick={() => updateFilter('none')}
                  className={`btn-setting-toggle ${filter === 'none' ? 'active' : ''}`}
                  aria-pressed={filter === 'none'}
                >
                    Mặc định
                </button>
                <button 
                  onClick={() => updateFilter('dark')}
                  className={`btn-setting-toggle ${filter === 'dark' ? 'active' : ''}`}
                  aria-pressed={filter === 'dark'}
                >
                    Tối (OLED)
                </button>
            </div>
          </div>

          <div className="setting-group no-margin">
            <label className="setting-label">
                <Monitor size={14} aria-hidden="true" /> Hiệu năng & Chất lượng
            </label>
            
            <button 
              className={`hifi-toggle-card turbo-card ${isTurbo ? 'active' : ''}`} 
              onClick={toggleTurbo}
              role="switch"
              aria-checked={isTurbo}
              aria-label="Chế độ Tăng tốc Turbo"
            >
                <div className="hifi-info">
                    <div className="hifi-title">⚡ Chế độ Tăng tốc Turbo</div>
                    <div className="hifi-sub">Ưu tiên load ảnh ngay lập tức</div>
                </div>
                <div className={`titan-checkbox ${isTurbo ? 'checked' : ''}`} />
            </button>

            <button 
              className={`hifi-toggle-card ${isHiFi ? 'active' : ''}`} 
              onClick={toggleHiFi}
              role="switch"
              aria-checked={isHiFi}
              aria-label="Chế độ hình ảnh siêu nét 4K"
              disabled={isTurbo}
            >
                <div className="hifi-info">
                    <div className="hifi-title">💎 Chế độ Siêu nét 4K</div>
                    <div className="hifi-sub">Dành cho mạng tốc độ cao</div>
                </div>
                <div className={`titan-checkbox ${isHiFi ? 'checked' : ''}`} />
            </button>
            <p className="setting-footer-hint">Tự động tối ưu hóa dựa trên lựa chọn của bạn.</p>
          </div>
        </div>
      )}

      <style jsx global>{`
        .settings-icon-wrapper {
            transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            display: flex;
        }
        .settings-icon-wrapper.is-active {
            transform: rotate(90deg);
        }
        .setting-group.no-margin {
            margin-bottom: 0 !important;
        }
        .setting-header-industrial {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 30px;
        }
        .setting-icon-box {
            width: 40px;
            height: 40px;
            background: rgba(255, 62, 62, 0.1);
            border: 1px solid rgba(255, 62, 62, 0.2);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--accent);
        }
        .setting-main-title {
            margin: 0;
            font-size: 0.95rem;
            font-weight: 950;
            color: white;
            letter-spacing: -0.5px;
        }
        .setting-desc {
            margin: 0;
            font-size: 0.7rem;
            color: rgba(255, 255, 255, 0.4);
            font-weight: 750;
        }
        .titan-switch {
            margin-left: auto;
            width: 44px;
            height: 24px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            position: relative;
            cursor: pointer;
            transition: all 0.3s;
            border: none;
        }
        .titan-switch::after {
            content: '';
            position: absolute;
            top: 2px;
            left: 2px;
            width: 20px;
            height: 20px;
            background: white;
            border-radius: 50%;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .titan-switch.active {
            background: var(--accent);
        }
        .titan-switch.active::after {
            left: calc(100% - 22px);
        }
        .hifi-toggle-card {
            padding: 15px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid var(--glass-border);
            border-radius: 14px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            transition: all 0.3s;
        }
        .hifi-toggle-card:hover {
            background: rgba(255, 255, 255, 0.06);
            border-color: rgba(255, 255, 255, 0.15);
        }
        .hifi-toggle-card.active {
            border-color: var(--accent);
            background: rgba(255, 62, 62, 0.04);
        }
        .hifi-title {
            font-size: 0.85rem;
            font-weight: 900;
            color: white;
        }
        .hifi-sub {
            font-size: 0.65rem;
            color: rgba(255, 255, 255, 0.3);
            font-weight: 750;
            margin-top: 2px;
        }
        .titan-checkbox {
            width: 22px;
            height: 22px;
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 6px;
            position: relative;
            transition: all 0.3s;
        }
        .titan-checkbox.checked {
            background: var(--accent);
            border-color: var(--accent);
        }
        .titan-checkbox.checked::after {
            content: '✓';
            color: white;
            font-size: 14px;
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .setting-footer-hint {
            font-size: 0.65rem;
            color: rgba(255, 255, 255, 0.2);
            margin-top: 15px;
            font-style: italic;
            font-weight: 700;
        }
      `}</style>
    </>
  );
}

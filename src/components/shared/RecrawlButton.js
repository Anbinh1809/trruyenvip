'use client';

import { useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { useToast } from '@/components/widgets/ToastProvider';

export default function RecrawlButton({ chapterId }) {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleRecrawl = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/crawler/jit-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId })
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        if (addToast) addToast('Đang cào lại dữ liệu, vui lòng đợi...', 'success');
        window.location.reload();
      } else {
        if (addToast) addToast(data.error || 'Yêu cầu thất bại. Vui lòng thử lại sau.', 'error');
      }
    } catch (e) {
        if (addToast) addToast('Lỗi kết nối máy chủ.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="empty-state-titan glass-titan">
      <div className="empty-icon-box-industrial">
          <Search size={40} />
      </div>
      <h2 className="empty-title">Chương này chưa có nội dung</h2>
      <p className="empty-sub">
        Dữ liệu có thể chưa được đồng bộ từ nguồn gốc. Hãy bấm nút dưới đây để hệ thống ưu tiên &quot;quét&quot; lại chương này ngay lập tức.
      </p>
      
      <button 
        className={`btn btn-primary recrawl-btn-industrial ${loading ? 'loading' : ''}`}
        onClick={handleRecrawl}
        disabled={loading}
      >
        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        {loading ? 'ĐANG ĐỒNG BỘ...' : 'CÀO DỮ LIỆU NGAY'}
      </button>

      <style>{`
        .empty-icon-box-industrial {
            display: flex;
            justify-content: center;
            margin-bottom: 25px;
            opacity: 0.15;
            color: var(--text-primary);
        }
        .recrawl-btn-industrial {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            padding: 14px 40px;
            border-radius: 30px;
            margin: 0 auto;
            font-weight: 950;
            letter-spacing: 1px;
            font-size: 0.85rem;
            min-width: 240px;
        }
      `}</style>
    </div>
  );
}

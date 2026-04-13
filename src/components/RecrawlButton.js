'use client';

import { useState } from 'react';
import { useToast } from './ToastProvider';
import { ImageOff, RefreshCw } from 'lucide-react';

export default function RecrawlButton({ chapterId }) {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleRecrawl = async () => {
    setLoading(true);
    addToast('Đang yêu cầu hệ thống tải lại nội dung...', 'info');

    try {
      const res = await fetch('/api/admin/crawler/chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId })
      });
      const data = await res.json();
      
      if (data.success) {
        addToast(`Thành công! Đã tìm thấy ${data.count} ảnh.`, 'success');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        addToast('Lỗi hệ thống: ' + (data.error || 'Nguồn không phản hồi'), 'error');
      }
    } catch (e) {
      addToast('Không thể kết nối với máy chủ.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="empty-state-titan" style={{ margin: '40px 20px', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '25px', opacity: 0.5 }}>
        <ImageOff size={80} />
      </div>
      <h2 style={{ marginBottom: '10px', fontWeight: 800 }}>Chương này chưa có nội dung</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', maxWidth: '500px', margin: '0 auto 30px' }}>
        Hệ thống chưa tìm thấy nội dung ảnh cho chương này. Vui lòng nhấn nút bên dưới để yêu cầu tải lại ngay lập tức.
      </p>
      <button 
        onClick={handleRecrawl}
        disabled={loading}
        className="btn btn-primary btn-large" 
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', borderRadius: '20px', margin: '0 auto' }}
      >
        {loading ? <><RefreshCw className="spin" size={18} /> Đang tải...</> : 'Yêu cầu tải lại ngay'}
      </button>
    </div>
  );
}

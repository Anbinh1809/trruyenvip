'use client';

import { useState } from 'react';
import { useToast } from './ToastProvider';

export default function RecrawlButton({ chapterId }) {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleRecrawl = async () => {
    // Note: In a real app, you might want a custom modal for confirm, 
    // but for now, alert-replacement via toast is better than nothing.
    // If they click, we proceed.
    setLoading(true);
    addToast('Khởi động cào lại ảnh cho chương này...', 'info');

    try {
      const res = await fetch('/api/admin/crawler/chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId })
      });
      const data = await res.json();
      
      if (data.success) {
        addToast(`Đột phá thành công! Đã tìm thấy ${data.count} ảnh.`, 'success');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        addToast('Pháp bảo trắc trở: ' + (data.error || 'Nguồn không phản hồi'), 'error');
      }
    } catch (e) {
      addToast('Mất kết nối với tầng thủ quán.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="empty-state-titan" style={{ margin: '40px 20px' }}>
      <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📸</div>
      <h2 style={{ marginBottom: '10px', fontWeight: 800 }}>Chương này chưa có ảnh</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', maxWidth: '500px', margin: '0 auto 30px' }}>
        Hệ thống chưa tìm thấy nội dung ảnh cho chương này. Vui lòng nhấn nút bên dưới để yêu cầu máy chủ cào lại ngay lập tức.
      </p>
      <button 
        onClick={handleRecrawl}
        disabled={loading}
        className="btn btn-primary btn-large" 
        style={{ borderRadius: '20px' }}
      >
        {loading ? 'Đang cào lại...' : 'Yêu cầu cào lại ngay'}
      </button>
    </div>
  );
}

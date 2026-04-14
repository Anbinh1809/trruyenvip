'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useEngagement } from '@/context/EngagementContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ToastProvider';
import { MessageSquare } from 'lucide-react';
import CommentItem from './Comments/CommentItem';
import './Comments/Comments.css';

export default function CommentSection({ chapterId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [userName, setUserName] = useState('');
  const { xp, addXp, updateMission } = useEngagement();
  const { addToast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUserName(user.username);
    } else {
        const savedName = typeof window !== 'undefined' ? localStorage.getItem('truyenvip_username') : null;
        if (savedName) setUserName(savedName);
    }
  }, [isAuthenticated, user]);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/comments?chapterId=${chapterId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (e) {
      console.error('Fetch comments error', e);
    }
    setLoading(false);
  }, [chapterId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (chapterId) fetchComments();
  }, [chapterId, fetchComments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !userName.trim()) return;

    const content = newComment;
    setNewComment('');

    const tempId = 'temp-' + crypto.randomUUID();
    const optimisticComment = {
        id: tempId,
        user_name: userName,
        user_uuid: user?.uuid || 'guest',
        user_xp: xp || 0,
        user_role: user?.role || 'user',
        content: content,
        created_at: new Date().toISOString(),
        likes: 0,
        isOptimistic: true
    };

    setComments(prev => [optimisticComment, ...prev]);
    addXp(10);
    updateMission('COMMENT', 1);

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId, content: content })
      });

      if (res.ok) {
        if (!isAuthenticated) localStorage.setItem('truyenvip_username', userName);
        fetchComments();
      } else {
          setComments(prev => prev.filter(c => c.id !== tempId));
          if (addToast) addToast('Không thể gửi bình luận. Vui lòng thử lại.', 'error');
      }
    } catch (e) {
      console.error('Comment error', e);
      setComments(prev => prev.filter(c => c.id !== tempId));
    }
  };

  const handleLike = async (id) => {
    let liked = [];
    try {
        liked = JSON.parse(localStorage.getItem('truyenvip_liked_comments') || '[]');
    } catch (e) {
        liked = [];
    }
    if (liked.includes(id)) return;

    try {
      const res = await fetch('/api/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'like' })
    });
      if (res.ok) {
        liked.push(id);
        localStorage.setItem('truyenvip_liked_comments', JSON.stringify(liked));
        fetchComments();
      }
    } catch (e) {
      console.error('Like error', e);
    }
  };

  const rootComments = (comments || []).filter(c => !c.parent_id);

  return (
    <section className="comment-section-container container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800 }}>
            <MessageSquare size={20} color="var(--accent)" /> Bình luận ({comments?.length || 0})
        </h3>
        {isAuthenticated && (
           <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
             Đang bình luận bằng: <strong style={{ color: 'var(--accent)' }}>{user.username}</strong>
           </div>
        )}
      </div>
      
      {!isAuthenticated ? (
         <div className="glass-card" style={{ padding: '30px', textAlign: 'center', marginBottom: '40px', borderRadius: 'var(--border-radius)' }}>
            <p style={{ marginBottom: '20px', fontWeight: 600 }}>Vui lòng đăng nhập để tham gia thảo luận cùng cộng đồng.</p>
            <Link href="/auth/login" className="btn btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>Đăng nhập ngay</Link>
         </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ marginBottom: '40px' }}>
            <textarea 
                placeholder="Nhập nội dung bình luận..." 
                value={newComment} 
                onChange={(e) => setNewComment(e.target.value)}
                className="comment-textarea"
                style={{ minHeight: '100px' }}
                required
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '12px 40px' }}>Gửi bình luận</button>
        </form>
      )}

      <div className="comment-list">
        {loading ? (
          <div className="shimmer-group" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="shimmer" style={{ width: '100%', height: '80px', borderRadius: 'var(--border-radius)', background: 'rgba(255,255,255,0.05)' }}></div>
            <div className="shimmer" style={{ width: '100%', height: '80px', borderRadius: 'var(--border-radius)', background: 'rgba(255,255,255,0.05)' }}></div>
          </div>
        ) : rootComments.length > 0 ? (
          rootComments.map((comment) => (
            <CommentItem 
                key={comment.id} 
                comment={comment} 
                chapterId={chapterId} 
                userName={userName} 
                fetchComments={fetchComments} 
                comments={comments} 
                handleLike={handleLike} 
            />
          ))
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px', fontWeight: 600 }}>Chưa có bình luận nào. Hãy là người đầu tiên!</p>
        )}
      </div>
    </section>
  );
}

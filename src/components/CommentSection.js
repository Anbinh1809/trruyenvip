'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useEngagement } from '@/context/EngagementContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ToastProvider';

const CommentItem = ({ comment, isReply = false, chapterId, userName, fetchComments, comments, handleLike }) => {
    const [replying, setReplying] = useState(false);
    const [replyText, setReplyText] = useState('');
    
    const { addXp, updateMission, getRankInfo } = useEngagement();
    const { addToast } = useToast();
    const { user, isAuthenticated } = useAuth();

    const rankInfo = getRankInfo(comment.user_xp || 0);
    const isAdmin = comment.user_role === 'admin';

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        if (!replyText.trim() || !userName.trim()) return;

        try {
            const res = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chapterId,
                    content: replyText,
                    parentId: comment.id
                })
            });
            if (res.ok) {
                setReplyText('');
                setReplying(false);
                fetchComments();
                addXp(5);
                updateMission('COMMENT', 1);
            }
        } catch (e) {
            console.error('Reply error', e);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Bạn có chắc chắn muốn xóa bình luận này?')) return;

        try {
            const res = await fetch(`/api/comments?id=${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchComments();
             } else {
                if (addToast) addToast('Không thể xóa bình luận. Vui lòng thử lại.', 'error');
             }
        } catch (e) {
            console.error('Delete error', e);
        }
    };

    const canDelete = isAuthenticated && (user?.uuid === comment.user_uuid || user?.role === 'admin');

    return (
        <div className="comment-group" style={{ marginBottom: isReply ? '10px' : '20px' }}>
            <div className={`comment-item ${isReply ? 'reply' : ''}`} style={{ 
                padding: '20px', 
                background: isAdmin ? 'rgba(255,215,0,0.03)' : (isReply ? 'rgba(255,255,255,0.02)' : 'var(--bg-primary)'), 
                borderRadius: '15px', 
                border: isAdmin ? '1px solid rgba(255,215,0,0.3)' : '1px solid var(--glass-border)',
                marginLeft: isReply ? '40px' : '0',
                boxShadow: isAdmin ? '0 0 25px rgba(255, 215, 0, 0.15)' : 'none',
                opacity: comment.isOptimistic ? 0.7 : 1

            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, color: isAdmin ? '#ffd700' : 'var(--accent)' }}>
                          {isAdmin && '🏰 '}{comment.user_name}
                        </span>
                        {comment.user_xp !== null && (
                            <span className="badge" style={{ 
                                fontSize: '0.65rem', 
                                background: isAdmin ? '#ffd700' : 'var(--bg-tertiary)', 
                                color: isAdmin ? '#000' : 'var(--text-primary)',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontWeight: 800,
                                textTransform: 'uppercase'
                            }}>
                                {isAdmin ? 'ADMIN' : rankInfo.title}
                            </span>
                        )}
                        {isReply && <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>đã trả lời</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(comment.created_at).toLocaleString('vi-VN')}</span>
                        {canDelete && (
                            <button 
                                onClick={() => handleDelete(comment.id)} 
                                style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '1rem', opacity: 0.7 }}
                                title="Xóa bình luận"
                            >
                                🗑️
                            </button>
                        )}
                    </div>
                </div>
                <p style={{ fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '15px' }}>{comment.content}</p>
                
                <div style={{ display: 'flex', gap: '20px' }}>
                    <button 
                        onClick={() => handleLike(comment.id)} 
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                        ❤️ {comment.likes || 0}
                    </button>
                    {!isReply && isAuthenticated && (
                        <button 
                            onClick={() => setReplying(!replying)} 
                            style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 700 }}
                        >
                            💬 Trả lời
                        </button>
                    )}
                </div>

                {replying && (
                    <form onSubmit={handleReplySubmit} style={{ marginTop: '20px' }}>
                        <textarea 
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Viết câu trả lời..."
                            style={{ width: '100%', minHeight: '60px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: '10px', color: 'white', marginBottom: '10px', outline: 'none' }}
                        />
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button type="submit" className="btn btn-primary" style={{ padding: '6px 20px', fontSize: '0.8rem' }}>Gửi</button>
                            <button type="button" onClick={() => setReplying(false)} className="btn btn-outline" style={{ padding: '6px 20px', fontSize: '0.8rem' }}>Hủy</button>
                        </div>
                    </form>
                )}
            </div>
            
            {!isReply && (comments || []).filter(c => c.parent_id === comment.id).map(reply => (
                <CommentItem key={reply.id} comment={reply} isReply={true} chapterId={chapterId} userName={userName} fetchComments={fetchComments} comments={comments} handleLike={handleLike} />
            ))}
        </div>
    );
};

export default function CommentSection({ chapterId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [userName, setUserName] = useState('');
  const { xp, addXp, updateMission } = useEngagement();
  const { addToast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
        if (isAuthenticated && user) {
            setUserName(user.username);
        } else {
            const savedName = typeof window !== 'undefined' ? localStorage.getItem('truyenvip_username') : null;
            if (savedName) setUserName(savedName);
        }
    }, 0);
    return () => clearTimeout(timer);
  }, [isAuthenticated, user]);

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
        body: JSON.stringify({
          chapterId,
          content: content
        })
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
    if (chapterId) fetchComments();
  }, [chapterId, fetchComments]);

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
    <section className="comment-section container" style={{ marginTop: '60px', padding: '40px', background: 'var(--bg-secondary)', borderRadius: '30px', border: '1px solid var(--glass-border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h3 style={{ fontWeight: 800 }}>💬 Bình luận ({comments?.length || 0})</h3>
        {isAuthenticated && (
           <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
             Đang bình luận bằng: <strong style={{ color: 'var(--accent)' }}>{user.username}</strong>
           </div>
        )}
      </div>
      
      {!isAuthenticated ? (
         <div className="glass-card" style={{ padding: '30px', textAlign: 'center', marginBottom: '40px', borderRadius: '20px' }}>
            <p style={{ marginBottom: '20px', fontWeight: 600 }}>Vui lòng đăng nhập để tham gia thảo luận cùng cộng đồng.</p>
            <Link href="/auth/login" className="btn btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>Đăng nhập ngay</Link>
         </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ marginBottom: '40px' }}>
            <textarea 
                placeholder="Nhập nội dung bình luận..." 
                value={newComment} 
                onChange={(e) => setNewComment(e.target.value)}
                style={{ width: '100%', minHeight: '100px', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--glass-border)', padding: '15px 20px', borderRadius: '15px', color: 'white', marginBottom: '15px', resize: 'vertical', outline: 'none' }}
                required
            ></textarea>
            <button type="submit" className="btn btn-primary" style={{ padding: '12px 40px' }}>Gửi bình luận (+10 XP)</button>
        </form>
      )}

      <div className="comment-list">
        {loading ? (
          <div className="shimmer-group" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="shimmer" style={{ width: '100%', height: '80px', borderRadius: '15px', background: 'rgba(255,255,255,0.05)' }}></div>
            <div className="shimmer" style={{ width: '100%', height: '80px', borderRadius: '15px', background: 'rgba(255,255,255,0.05)' }}></div>
          </div>
        ) : rootComments.length > 0 ? (
          rootComments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} chapterId={chapterId} userName={userName} fetchComments={fetchComments} comments={comments} handleLike={handleLike} />
          ))
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px', fontWeight: 600 }}>Chưa có bình luận nào. Hãy là người đầu tiên!</p>
        )}
      </div>
    </section>
  );
}

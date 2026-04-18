'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { useIsMounted } from '@/hooks/useIsMounted';
import Link from 'next/link';
import { useEngagement } from '@/contexts/EngagementContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/widgets/ToastProvider';
import { MessageSquare, Send } from 'lucide-react';
import CommentItem from './CommentItem';
import './Comments.css';

export default function CommentSection({ chapterId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('');
  const { xp, addXp, updateMission } = useEngagement();
  const { addToast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const mounted = useIsMounted();

  useEffect(() => {
    startTransition(() => {
        if (isAuthenticated && user) {
            setUserName(user.username);
        } else {
            const savedName = typeof window !== 'undefined' ? localStorage.getItem('truyenvip_username') : null;
            if (savedName) setUserName(savedName);
        }
    });
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
    if (chapterId) {
        startTransition(() => {
            fetchComments();
        });
    }
  }, [chapterId, fetchComments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting || !newComment.trim() || !userName.trim()) return;

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
    setSubmitting(true);

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId, content: content })
      });

      if (res.ok) {
        if (!isAuthenticated) localStorage.setItem('truyenvip_username', userName);
        addXp(10);
        updateMission('COMMENT', 1);
        fetchComments();
      } else {
          setComments(prev => prev.filter(c => c.id !== tempId));
          if (addToast) addToast('Không thể gửi bình luận. Vui lòng thử lại.', 'error');
      }
    } catch (e) {
      console.error('Comment error', e);
      setComments(prev => prev.filter(c => c.id !== tempId));
    } finally {
      setSubmitting(false);
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
      <div className="comment-header-industrial">
        <h3 className="comment-count-title">
            <MessageSquare size={24} color="var(--accent)" /> 
            Bình luận <span className="text-secondary-titan">({comments?.length || 0})</span>
        </h3>
        {isAuthenticated && (
           <div className="active-user-hint">
             Äang bà¬nh luáº­n báº±ng: <span className="active-user-name">{user.username}</span>
           </div>
        )}
      </div>
      
      {!isAuthenticated ? (
         <div className="user-tag-industrial">
            <p className="login-prompt-text">Vui lòng đăng nhập để tham gia thảo luận cùng cộng đồng.</p>
            <Link href="/auth/login" className="btn btn-primary login-btn-wide">ÄÄƒng nháº­p ngay</Link>
         </div>
      ) : (
        <form onSubmit={handleSubmit} className="comment-form-industrial">
            <textarea 
                placeholder="Chia sẻ suy nghĩ của báº¡n vo chưÆ¡ng nà y..." 
                value={newComment} 
                onChange={(e) => setNewComment(e.target.value)}
                className="comment-textarea-industrial"
                required
            />
            <div className="form-actions-industrial">
               <button type="submit" className="btn btn-primary submit-btn-titan" disabled={submitting}>
                    <Send size={18} /> {submitting ? 'ÄANG GỬI...' : 'GỬI BÌNH LUẬN'}
               </button>
            </div>
        </form>
      )}

      <div className="comment-list-industrial">
        {loading ? (
          <div className="shimmer-list-industrial">
            <div className="shimmer-item-titan" />
            <div className="shimmer-item-titan" />
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
          <div className="empty-comments-industrial">
              <p>Chưa có bình luận nào. Hãy là  ngưoi đầu tiên!</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .text-secondary-titan {
            opacity: 0.4;
            font-weight: 800;
        }
        .active-user-hint {
            font-size: 0.85rem; 
            color: rgba(255, 255, 255, 0.4);
            font-weight: 700;
        }
        .active-user-name {
            color: var(--accent);
            font-weight: 900;
        }
        .login-prompt-text {
            margin-bottom: 25px; 
            font-weight: 700;
            color: rgba(255, 255, 255, 0.6);
        }
        .login-btn-wide {
            display: inline-flex; 
            padding: 14px 40px;
            font-weight: 950;
        }
        .form-actions-industrial {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 50px;
        }
        .submit-btn-titan {
            padding: 14px 45px;
            display: flex;
            align-items: center;
            gap: 12px;
            font-weight: 950;
            letter-spacing: 0.5px;
        }
        .shimmer-list-industrial {
            display: flex;
            flex-direction: column;
            gap: 25px;
        }
        .shimmer-item-titan {
            width: 100%;
            height: 120px;
            border-radius: 20px;
            background: rgba(255, 255, 255, 0.02);
            animation: pulse-industrial 2s infinite;
        }
        .empty-comments-industrial {
            text-align: center;
            color: rgba(255, 255, 255, 0.3);
            padding: 60px;
            font-weight: 800;
            background: rgba(255, 255, 255, 0.01);
            border-radius: 20px;
            border: 1px dashed var(--glass-border);
        }
        @keyframes pulse-industrial {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 0.8; }
        }
      `}</style>
    </section>
  );
}


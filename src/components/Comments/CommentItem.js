'use client';

import { useState } from 'react';
import { useEngagement } from '@/context/EngagementContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ToastProvider';
import { ShieldCheck, Trash2, Heart, MessageSquare } from 'lucide-react';
import './Comments.css';

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
        <div className={`comment-group ${isReply ? 'reply-group' : ''}`}>
            <div className={`comment-item ${isReply ? 'reply' : ''} ${isAdmin ? 'admin-comment' : ''} ${comment.isOptimistic ? 'optimistic' : ''}`}>
                <div className="comment-header">
                    <div className="user-info">
                        <span className={`author-name ${isAdmin ? 'admin' : ''}`}>
                          {isAdmin && <ShieldCheck size={16} />}{comment.user_name}
                        </span>
                        {comment.user_xp !== null && (
                            <span className={`rank-badge ${isAdmin ? 'admin' : ''}`}>
                                {isAdmin ? 'ADMIN' : rankInfo.title}
                            </span>
                        )}
                        {isReply && <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>đã trả lời</span>}
                    </div>
                    <div className="user-info">
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(comment.created_at).toLocaleString('vi-VN')}</span>
                        {canDelete && (
                            <button 
                                onClick={() => handleDelete(comment.id)} 
                                className="action-btn delete"
                                title="Xóa bình luận"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                </div>
                
                <p className="comment-content">{comment.content}</p>
                
                <div className="comment-actions">
                    <button 
                        onClick={() => handleLike(comment.id)} 
                        className="action-btn"
                    >
                        <Heart size={14} /> {comment.likes || 0}
                    </button>
                    {!isReply && isAuthenticated && (
                        <button 
                            onClick={() => setReplying(!replying)} 
                            className="action-btn"
                            style={{ color: 'var(--accent)' }}
                        >
                            <MessageSquare size={14} /> Trả lời
                        </button>
                    )}
                </div>

                {replying && (
                    <form onSubmit={handleReplySubmit} className="reply-form">
                        <textarea 
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Viết câu trả lời..."
                            className="comment-textarea"
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

export default CommentItem;

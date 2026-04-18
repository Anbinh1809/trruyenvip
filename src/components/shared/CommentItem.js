'use client';

import { useState } from 'react';
import { useEngagement } from '@/contexts/EngagementContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/widgets/ToastProvider';
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
        if (!confirm('B?n c� ch?c ch?n mu?n x�a b�nh lu?n n�y?')) return;

        try {
            const res = await fetch(`/api/comments?id=${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchComments();
             } else {
                if (addToast) addToast('Kh�ng th? x�a b�nh lu?n. Vui l�ng thử lại.', 'error');
             }
        } catch (e) {
            console.error('Delete error', e);
        }
    };

    const handleReport = async (id) => {
        const reason = prompt('L� do b�o c�o nội dung n�y (v� d?: Nội dung độc hại, Spam...):');
        if (!reason || reason.length < 5) return;

        try {
            const res = await fetch('/api/comments/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ commentId: id, reason })
            });
            const data = await res.json();
            if (res.ok) {
                if (addToast) addToast(data.message, 'success');
            } else {
                if (addToast) addToast(data.error || 'L?i g?i b�o c�o', 'error');
            }
        } catch (e) {
            console.error('Report error', e);
        }
    };

    const canDelete = isAuthenticated && (user?.uuid === comment.user_uuid || user?.role === 'admin');
    const isLiked = comment.has_liked;

    return (
        <div className={`comment-group-wrapper ${isReply ? 'is-reply' : ''}`}>
            <div className={`comment-item ${isAdmin ? 'is-admin' : ''} ${comment.isOptimistic ? 'is-optimistic' : ''}`}>
                <div className="comment-header-row">
                    <div className="author-meta-industrial">
                        <span className={`author-name-industrial ${isAdmin ? 'is-admin' : ''}`}>
                          {isAdmin && <ShieldCheck size={16} className="admin-icon" />}
                          {comment.user_name}
                        </span>
                        <span className={`rank-badge-industrial ${isAdmin ? 'is-admin' : ''}`}>
                            {isAdmin ? 'ADMIN' : rankInfo.title}
                        </span>
                        {isReply && <span className="reply-indicator">d� tr? lo�i</span>}
                    </div>
                    <div className="comment-meta-right">
                        <span className="comment-timestamp">{new Date(comment.created_at).toLocaleString('vi-VN')}</span>
                        {canDelete && (
                            <button 
                                onClick={() => handleDelete(comment.id)} 
                                className="action-btn-industrial delete-btn"
                                title="X�a b�nh luận"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                        {isAuthenticated && user?.uuid !== comment.user_uuid && (
                            <button 
                                onClick={() => handleReport(comment.id)} 
                                className="action-btn-industrial report-btn"
                                title="B�o c�o vi phạm"
                            >
                                <MessageSquare size={14} /> 
                            </button>
                        )}
                    </div>
                </div>
                
                <p className="comment-body-industrial">{comment.content}</p>
                
                <div className="comment-actions-industrial">
                    <button 
                        onClick={() => handleLike(comment.id)} 
                        className={`action-btn-industrial ${isLiked ? 'is-active' : ''}`}
                    >
                        <Heart size={14} fill={isLiked ? "currentColor" : "none"} /> 
                        <span>{comment.likes || 0}</span>
                    </button>
                    {!isReply && isAuthenticated && (
                        <button 
                            onClick={() => setReplying(!replying)} 
                            className={`action-btn-industrial ${replying ? 'is-active' : ''}`}
                        >
                            <MessageSquare size={14} /> 
                            <span>Tr? lo�i</span>
                        </button>
                    )}
                </div>

                {replying && (
                    <form onSubmit={handleReplySubmit} className="reply-form-industrial">
                        <textarea 
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Viết c�u tr? lo�i..."
                            className="comment-textarea-industrial mini"
                            required
                        />
                        <div className="reply-actions-row">
                            <button type="submit" className="btn btn-primary btn-sm-titan">G?i</button>
                            <button type="button" onClick={() => setReplying(false)} className="btn btn-outline btn-sm-titan">H?y</button>
                        </div>
                    </form>
                )}
            </div>
            
            {!isReply && (comments || []).filter(c => c.parent_id === comment.id).map(reply => (
                <CommentItem key={reply.id} comment={reply} isReply={true} chapterId={chapterId} userName={userName} fetchComments={fetchComments} comments={comments} handleLike={handleLike} />
            ))}

            <style jsx>{`
                .comment-group-wrapper {
                    margin-bottom: 25px;
                }
                .comment-group-wrapper.is-reply {
                    margin-bottom: 15px;
                }
                .comment-header-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 15px;
                }
                .admin-icon {
                    color: var(--accent);
                    margin-right: 5px;
                }
                .rank-badge-industrial {
                    font-size: 0.65rem;
                    background: rgba(255, 255, 255, 0.05);
                    padding: 3px 8px;
                    border-radius: 4px;
                    font-weight: 950;
                    letter-spacing: 0.5px;
                }
                .rank-badge-industrial.is-admin {
                    background: var(--accent);
                    color: white;
                }
                .reply-indicator {
                    font-size: 0.7rem; 
                    opacity: 0.3;
                    font-weight: 800;
                    text-transform: uppercase;
                }
                .comment-meta-right {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                .delete-btn:hover {
                    color: #ff4444 !important;
                }
                .reply-form-industrial {
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                }
                .comment-textarea-industrial.mini {
                    min-height: 80px;
                    padding: 15px;
                    font-size: 0.9rem;
                }
                .reply-actions-row {
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                }
                .btn-sm-titan {
                    padding: 8px 25px;
                    font-size: 0.8rem;
                    font-weight: 850;
                    border-radius: 8px;
                }
                .is-optimistic {
                    opacity: 0.6;
                    pointer-events: none;
                }
            `}</style>
        </div>
    );
};

export default CommentItem;


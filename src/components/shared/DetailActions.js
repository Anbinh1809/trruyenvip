'use client';

import { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { BookOpen, Share2, Play, Heart } from 'lucide-react';
import FavoriteButton from './FavoriteButton';
import { getSignedProxyUrl } from '@/core/security/crypto';
import { useHistory } from '@/contexts/HistoryContext';
import { useToast } from '@/components/widgets/ToastProvider';

export default function DetailActions({ mangaId, firstChapterId, mangaTitle, mangaCover }) {
    const { addToast } = useToast();
    const [preloaded, setPreloaded] = useState(false);
    const hoverTimer = useRef(null);
    const { history, mounted } = useHistory();

    // TITAN CHRONICLE: Determine continue reading target
    const mangaHistory = useMemo(() => {
        if (!mounted) return null;
        return history.find(h => h.mangaId === mangaId);
    }, [history, mangaId, mounted]);

    const handleHover = (chapterId) => {
        if (preloaded || !chapterId) return;
        
        hoverTimer.current = setTimeout(async () => {
            try {
                const res = await fetch(`/api/reader/chapter-images?id=${encodeURIComponent(chapterId)}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.images?.length > 0) {
                        const isHiFi = localStorage.getItem('truyenvip_hifi') === 'true';
                        const w = isHiFi ? 1800 : (window.innerWidth < 768 ? 800 : 1200);
                        const q = isHiFi ? 95 : 78;

                        data.images.slice(0, 2).forEach(img => {
                            const link = document.createElement('link');
                            link.rel = 'prefetch';
                            link.as = 'image';
                            link.href = getSignedProxyUrl(img.image_url, w, q);
                            document.head.appendChild(link);
                        });
                        setPreloaded(true);
                    }
                }
            } catch (e) {}
        }, 200);
    };

    const handleHoverExit = () => {
        if (hoverTimer.current) {
            clearTimeout(hoverTimer.current);
            hoverTimer.current = null;
        }
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: mangaTitle,
                text: `Đọc truyện ${mangaTitle} cực hay tại TruyenVip!`,
                url: window.location.href,
            }).catch(() => {});
        } else {
            const url = window.location.href;
            navigator.clipboard.writeText(url).then(() => {
                addToast('Đã sao chép liên kết vào bộ nhớ tạm!', 'success');
            }).catch(() => {
                addToast('Không thể sao chép liên kết.', 'error');
            });
        }
    };

    return (
        <div className="detail-actions-traditional">
            <div className="action-row-main">
                {mangaHistory ? (
                    <Link 
                        href={`/manga/${mangaId}/chapter/${mangaHistory.chapterId}`} 
                        className="btn-mirror btn-green shadow-titan"
                        onMouseEnter={() => handleHover(mangaHistory.chapterId)}
                        onMouseLeave={handleHoverExit}
                    >
                        <Play size={18} fill="currentColor" /> Đọc tiếp chương {mangaHistory.chapterNumber}
                    </Link>
                ) : (
                    <Link 
                        href={firstChapterId ? `/manga/${mangaId}/chapter/${firstChapterId}` : '#'} 
                        className={`btn-mirror btn-green shadow-titan ${!firstChapterId ? 'disabled-mirror' : ''}`}
                        onMouseEnter={() => handleHover(firstChapterId)}
                        onMouseLeave={handleHoverExit}
                        onClick={(e) => !firstChapterId && e.preventDefault()}
                    >
                        <BookOpen size={18} /> Đọc từ đầu
                    </Link>
                )}
                
                <FavoriteButton manga={{ id: mangaId, title: mangaTitle, cover: mangaCover }} />
            </div>

            <button className="btn-mirror btn-purple shadow-titan" style={{ width: '100%', marginTop: '15px' }} onClick={handleShare}>
                <Share2 size={18} /> Chia sẻ truyện
            </button>

            <style jsx>{`
                .detail-actions-traditional {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    margin-top: 20px;
                }
                .action-row-main {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                }
                .btn-mirror {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    padding: 12px 20px;
                    border-radius: 6px;
                    font-size: 0.95rem;
                    font-weight: 800;
                    color: var(--text-primary);
                    text-decoration: none;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                    text-transform: none;
                }
                .btn-green {
                    background-color: var(--accent);
                    box-shadow: 0 4px 15px rgba(255, 62, 62, 0.2);
                }
                .btn-green:hover {
                    filter: brightness(1.1);
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(255, 62, 62, 0.3);
                }
                .btn-purple {
                    background-color: var(--bg-secondary);
                    color: var(--text-primary);
                    border: 1px solid var(--glass-border);
                }
                .btn-purple:hover {
                    background-color: var(--nebula-glass);
                    transform: translateY(-2px);
                }
                .disabled-mirror {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                @media (max-width: 480px) {
                    .action-row-main {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
}

'use client';

import { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { BookOpen, Share2, Play } from 'lucide-react';
import FavoriteButton from './FavoriteButton';
import { getSignedProxyUrl } from '@/lib/crypto';
import { useHistory } from '@/context/HistoryContext';

export default function DetailActions({ mangaId, firstChapterId, mangaTitle, mangaCover }) {
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
            navigator.clipboard.writeText(window.location.href);
            alert('Đã sao chép liên kết vào bộ nhớ tạm!');
        }
    };

    return (
        <div className="detail-actions-titan">
            {mangaHistory ? (
                <Link 
                    href={`/manga/${mangaId}/chapter/${mangaHistory.chapterId}`} 
                    className="btn btn-primary read-btn-titan shadow-titan continue-btn-industrial"
                    onMouseEnter={() => handleHover(mangaHistory.chapterId)}
                    onMouseLeave={handleHoverExit}
                >
                    <Play size={20} fill="currentColor" /> ĐỌC TIẾP CHƯƠNG {mangaHistory.chapterNumber}
                </Link>
            ) : (
                <Link 
                    href={firstChapterId ? `/manga/${mangaId}/chapter/${firstChapterId}` : '#'} 
                    className={`btn btn-primary read-btn-titan shadow-titan ${!firstChapterId ? 'disabled-industrial op-50' : ''}`}
                    onMouseEnter={() => handleHover(firstChapterId)}
                    onMouseLeave={handleHoverExit}
                    onClick={(e) => !firstChapterId && e.preventDefault()}
                >
                    <BookOpen size={20} /> {firstChapterId ? 'ĐỌC TỪ ĐẦU' : 'CHƯA CÓ CHƯƠNG'}
                </Link>
            )}
            
            <FavoriteButton manga={{ id: mangaId, title: mangaTitle, cover: mangaCover }} />
            
            <button className="btn btn-glass share-btn-titan shadow-titan" onClick={handleShare}>
                <Share2 size={20} /> CHIA SẺ
            </button>

            <style jsx>{`
                .continue-btn-industrial {
                    background: linear-gradient(135deg, var(--accent) 0%, #ff4d4d 100%);
                    animation: pulse-titan 2s infinite;
                }
                @keyframes pulse-titan {
                    0% { box-shadow: 0 0 0 0 rgba(var(--accent-rgb), 0.4); }
                    70% { box-shadow: 0 0 0 15px rgba(var(--accent-rgb), 0); }
                    100% { box-shadow: 0 0 0 0 rgba(var(--accent-rgb), 0); }
                }
            `}</style>
        </div>
    );
}


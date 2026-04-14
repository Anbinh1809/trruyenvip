'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { BookOpen, Share2 } from 'lucide-react';
import FavoriteButton from './FavoriteButton';
import { getSignedProxyUrl } from '@/lib/crypto';

export default function DetailActions({ mangaId, firstChapterId, mangaTitle, mangaCover }) {
    const [preloaded, setPreloaded] = useState(false);
    const hoverTimer = useRef(null);

    const handleHover = () => {
        if (preloaded || !firstChapterId) return;
        
        // TITAN INTENT: 200ms threshold to confirm user interest
        hoverTimer.current = setTimeout(async () => {
            try {
                const res = await fetch(`/api/reader/chapter-images?id=${encodeURIComponent(firstChapterId)}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.images?.length > 0) {
                        // Pre-fetch the first 2 images silently
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
            // Fallback: Copy to clipboard
            navigator.clipboard.writeText(window.location.href);
            alert('Đã sao chép liên kết vào bộ nhớ tạm!');
        }
    };

    return (
        <div className="detail-actions-titan">
            <Link 
                href={firstChapterId ? `/manga/${mangaId}/chapter/${firstChapterId}` : '#'} 
                className={`btn btn-primary read-btn-titan shadow-titan ${!firstChapterId ? 'disabled-industrial op-50' : ''}`}
                onMouseEnter={handleHover}
                onMouseLeave={handleHoverExit}
                onClick={(e) => !firstChapterId && e.preventDefault()}
            >
                <BookOpen size={20} /> {firstChapterId ? 'ĐỌC TỪ ĐẦU' : 'CHƯA CÓ CHƯƠNG'}
            </Link>
            
            <FavoriteButton manga={{ id: mangaId, title: mangaTitle, cover: mangaCover }} />
            
            <button className="btn btn-glass share-btn-titan shadow-titan" onClick={handleShare}>
                <Share2 size={20} /> CHIA SẺ
            </button>
        </div>
    );
}

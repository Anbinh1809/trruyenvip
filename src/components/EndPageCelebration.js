'use client';

import Link from 'next/link';
import { Home, Bookmark, ArrowRight } from 'lucide-react';

export default function EndPageCelebration() {
    return (
        <div className="celebration-industrial glass-titan fade-in">
            <h2 className="empty-title">CHÚC MỪNG BẠN ĐÃ ĐỌC XONG!</h2>
            <span className="celebration-label">Hành trình tuyệt vời, mời bạn xem thêm các tác phẩm khác</span>
            
            <div className="celebration-actions">
                <Link href="/" className="btn btn-primary btn-large-titan">
                    <Home size={20} /> QUAY VỀ TRANG CHỦ
                </Link>
                <Link href="/favorites" className="btn btn-glass btn-large-titan">
                    <Bookmark size={20} /> VÀO KHO TRUYỆN CÁ NHÂN
                </Link>
                <Link href="/genres" className="btn btn-outline-clear-industrial btn-large-titan">
                    TÌM THỂ LOẠI MỚI <ArrowRight size={18} />
                </Link>
            </div>
            
            <style jsx>{`
                .btn-glass {
                    background: rgba(255, 255, 255, 0.08);
                    backdrop-filter: blur(10px);
                    color: white;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                .btn-glass:hover {
                    background: rgba(255, 255, 255, 0.12);
                    border-color: rgba(255, 255, 255, 0.2);
                }
                .btn-outline-clear-industrial {
                    background: transparent;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: rgba(255, 255, 255, 0.6);
                }
                .btn-outline-clear-industrial:hover {
                    background: rgba(255, 255, 255, 0.05);
                    border-color: var(--accent);
                    color: white;
                }
            `}</style>
        </div>
    );
}

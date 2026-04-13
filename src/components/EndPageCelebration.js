'use client';

import { useEngagement } from '@/context/EngagementContext';
import Link from 'next/link';
import { Scroll, Search, Library } from 'lucide-react';

export default function EndPageCelebration({ mangaId, mangaTitle }) {
    const { rankTitle } = useEngagement();

    return (
        <div className="end-celebration-titan fade-in">
            <div className="celebration-glass-box">
                <div className="celebration-icon-large">
                    <Scroll size={80} strokeWidth={1} />
                </div>
                <h2 className="celebration-headline">CHÚC MỪNG BẠN!</h2>
                <div className="rank-badge-finish">{rankTitle}</div>
                <p className="celebration-message">
                    Bạn đã đọc đến chương cuối cùng của bộ <strong>{mangaTitle}</strong>. 
                    Tốc độ thật đáng khâm phục!
                </p>
                
                <div className="celebration-divider" />
                
                <div className="next-steps-titan">
                    <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>Mời bạn tham khảo thêm các tác phẩm khác:</p>
                    <div className="action-grid-finish">
                        <Link href="/" className="btn btn-accent btn-large" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <Search size={18} />
                            Tìm Tác Phẩm Mới
                        </Link>
                        <Link href="/bookmarks" className="btn btn-glass btn-large" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <Library size={18} />
                            Xem Tủ Truyện
                        </Link>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .end-celebration-titan {
                    padding: 80px 20px;
                    display: flex;
                    justify-content: center;
                    background: linear-gradient(to bottom, transparent, rgba(255, 62, 62, 0.05));
                }
                .celebration-glass-box {
                    max-width: 600px;
                    width: 100%;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 4px;
                    padding: 50px 35px;
                    text-align: center;
                }
                .celebration-glass-box::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    right: 0;
                    width: 150px;
                    height: 150px;
                    background: radial-gradient(circle, rgba(255, 62, 62, 0.1) 0%, transparent 70%);
                    z-index: -1;
                }
                .celebration-icon-large {
                    color: var(--accent);
                    margin-bottom: 25px;
                    display: flex;
                    justify-content: center;
                    opacity: 0.8;
                }
                .celebration-headline {
                    font-size: 2.2rem;
                    font-weight: 950;
                    letter-spacing: 2px;
                    color: white;
                    margin-bottom: 15px;
                }
                .rank-badge-finish {
                    display: inline-block;
                    padding: 4px 16px;
                    background: var(--accent);
                    color: white;
                    border-radius: 4px;
                    font-weight: 800;
                    font-size: 0.8rem;
                    margin-bottom: 25px;
                }
                .celebration-message {
                    font-size: 1.1rem;
                    line-height: 1.8;
                    color: rgba(255,255,255,0.7);
                    margin-bottom: 30px;
                }
                .celebration-divider {
                    height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
                    margin: 40px 0;
                }
                .action-grid-finish {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                }
                .btn-large {
                    padding: 14px 20px;
                    border-radius: 4px;
                    font-weight: 800;
                    font-size: 0.9rem;
                    transition: var(--transition);
                }
                .btn-accent:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 15px 30px rgba(255, 62, 62, 0.4);
                }
                @media (max-width: 600px) {
                    .action-grid-finish {
                        grid-template-columns: 1fr;
                    }
                    .celebration-glass-box {
                        padding: 40px 20px;
                    }
                    .celebration-headline {
                        font-size: 1.8rem;
                    }
                }
            `}</style>
        </div>
    );
}

'use client';

import { useEngagement } from '@/context/EngagementContext';
import Link from 'next/link';

export default function EndPageCelebration({ mangaId, mangaTitle }) {
    const { rankTitle } = useEngagement();

    return (
        <div className="end-celebration-titan fade-in">
            <div className="celebration-glass-box">
                <div className="celebration-icon-large">📜</div>
                <h2 className="celebration-headline">CỐNG HỈ ĐẠO HỮU!</h2>
                <div className="rank-badge-finish">{rankTitle}</div>
                <p className="celebration-message">
                    Đạo hữu đã tu luyện đến chương cuối cùng của bộ <strong>{mangaTitle}</strong>. 
                    Tâm đắc thật đáng khâm phục!
                </p>
                
                <div className="celebration-divider" />
                
                <div className="next-steps-titan">
                    <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '15px' }}>Duyên nợ chưa dứt, mời đạo hữu tiếp tục tu luyện:</p>
                    <div className="action-grid-finish">
                        <Link href="/" className="btn btn-accent btn-large">
                            Tìm Kiếm Cơ Duyên Mới
                        </Link>
                        <Link href="/bookmarks" className="btn btn-glass btn-large">
                            Lướt Xem Tàng Kinh Các
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
                    backdrop-filter: blur(20px);
                    border-radius: 30px;
                    padding: 50px;
                    text-align: center;
                    box-shadow: 0 40px 100px rgba(0,0,0,0.5);
                }
                .celebration-icon-large {
                    font-size: 4rem;
                    margin-bottom: 20px;
                    filter: drop-shadow(0 0 20px var(--accent));
                }
                .celebration-headline {
                    font-size: 2rem;
                    font-weight: 950;
                    letter-spacing: 4px;
                    color: var(--accent);
                    margin-bottom: 15px;
                }
                .rank-badge-finish {
                    display: inline-block;
                    padding: 5px 20px;
                    background: var(--accent);
                    color: white;
                    border-radius: 20px;
                    font-weight: 900;
                    font-size: 0.8rem;
                    margin-bottom: 25px;
                    box-shadow: 0 5px 15px rgba(255, 62, 62, 0.3);
                }
                .celebration-message {
                    font-size: 1.1rem;
                    line-height: 1.6;
                    color: rgba(255,255,255,0.8);
                    margin-bottom: 30px;
                }
                .celebration-divider {
                    height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
                    margin: 40px 0;
                }
                .action-grid-finish {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                }
                @media (max-width: 600px) {
                    .action-grid-finish {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
}

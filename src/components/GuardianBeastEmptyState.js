'use client';

import Link from 'next/link';

export default function GuardianBeastEmptyState({ 
    keyword = '', 
    title = 'LINH THÚ TRẤN ẢI', 
    message = '',
    buttonText = 'Quay Lại Thiên Giới',
    buttonHref = '/'
}) {
    const defaultMessage = keyword 
        ? `"Đạo hữu dừng bước! Linh thú canh giữ tàng thư báo rằng từ khóa <strong style="color: var(--accent)">${keyword}</strong> chưa từng xuất hiện trong cõi này. Hãy thử tìm một cơ duyên khác."`
        : `"Đạo hữu dừng bước! Linh thú canh giữ tàng thư báo rằng cõi này hiện chưa có bí tịch nào được thu thập. Hãy quay lại sau."`;

    return (
        <div className="empty-state-titan fade-in">
            <div className="guardian-beast-container">
                <img 
                    src="/guardian_beast_empty_state_1776007472770.png" 
                    alt="Linh Thú Trấn Ải" 
                    className="guardian-beast-img"
                />
                <div className="guardian-glow-nexus" />
            </div>
            
            <h3 className="guardian-title-titan">
                {title}
            </h3>
            <p className="guardian-message-titan" dangerouslySetInnerHTML={{ __html: message || defaultMessage }} />
            
            <Link href={buttonHref} className="btn btn-accent btn-large guardian-btn-titan">
                {buttonText}
            </Link>

            <style jsx>{`
                .empty-state-titan {
                    padding: 100px 20px;
                    text-align: center;
                }
                .guardian-beast-container {
                    position: relative;
                    width: 320px;
                    height: 320px;
                    margin: 0 auto 40px;
                }
                .guardian-beast-img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    filter: drop-shadow(0 0 30px rgba(255, 62, 62, 0.2));
                    position: relative;
                    z-index: 2;
                }
                .guardian-glow-nexus {
                    position: absolute;
                    top: 50%; left: 50%;
                    transform: translate(-50%, -50%);
                    width: 200px; height: 200px;
                    background: var(--accent);
                    filter: blur(100px);
                    opacity: 0.2;
                    z-index: 1;
                }
                .guardian-title-titan {
                    font-size: 2.2rem;
                    font-weight: 950;
                    margin-bottom: 15px;
                    letter-spacing: -1px;
                    color: var(--text-primary);
                }
                .guardian-message-titan {
                    color: rgba(255,255,255,0.4);
                    max-width: 550px;
                    margin-inline: auto;
                    font-weight: 600;
                    font-size: 1.1rem;
                    line-height: 1.6;
                }
                .guardian-btn-titan {
                    margin-top: 40px;
                    padding: 18px 50px;
                    border-radius: 16px;
                }
            `}</style>
        </div>
    );
}

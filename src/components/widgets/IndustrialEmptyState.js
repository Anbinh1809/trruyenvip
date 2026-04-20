'use client';

import NextLink from 'next/link';
import { Ghost } from 'lucide-react';

export default function IndustrialEmptyState({ 
    keyword = '', 
    title = 'KHÔNG CÓ KẾT QUẢ', 
    message = '',
    buttonText = 'QUAY LẠI TRANG CHỦ',
    buttonHref = '/'
}) {
    // XSS Fix: Avoid dangerouslySetInnerHTML, use standard React rendering
    const renderMessage = () => {
        if (message) {
            // If explicit message is passed, assume it's safe text (not HTML)
            return <p className="empty-desc-industrial">{message}</p>;
        }
        if (keyword) {
            return (
                <p className="empty-desc-industrial">
                    Từ khóa <strong className="text-accent-titan">{keyword}</strong> không có trong cơ sở dữ liệu. Vui lòng thử từ khóa khác.
                </p>
            );
        }
        return <p className="empty-desc-industrial">Hiện tại chưa có dữ liệu nào được cập nhật. Vui lòng quay lại sau.</p>;
    };

    return (
        <div className="empty-state-titan fade-in industrial-p-80">
            <div className="empty-icon-titan">
                <Ghost size={64} strokeWidth={1.5} />
            </div>
            
            <h3 className="empty-title-industrial">
                {title}
            </h3>
            {renderMessage()}
            
            <NextLink href={buttonHref} className="btn btn-primary empty-btn-industrial">
                {buttonText}
            </NextLink>

            <style>{`
                .industrial-p-80 {
                    padding: 100px 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                .empty-icon-titan {
                    color: var(--glass-border);
                    margin-bottom: 30px;
                    animation: float 4s ease-in-out infinite;
                }
                .empty-title-industrial {
                    font-size: 1.8rem; 
                    font-weight: 950; 
                    margin-bottom: 15px; 
                    color: var(--text-primary);
                    letter-spacing: -1px;
                }
                .empty-desc-industrial {
                    color: var(--text-muted); 
                    max-width: 520px; 
                    margin: 0 auto; 
                    font-weight: 700; 
                    font-size: 1rem; 
                    line-height: 1.7;
                }
                .empty-btn-industrial {
                    margin-top: 40px; 
                    padding: 14px 50px;
                    letter-spacing: 1px;
                    font-weight: 950;
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-15px); }
                }
            `}</style>
            <style>{`
                .text-accent-titan {
                    color: var(--accent);
                    font-weight: 950;
                }
            `}</style>
        </div>
    );
}

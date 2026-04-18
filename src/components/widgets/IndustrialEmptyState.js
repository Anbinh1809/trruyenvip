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
    const defaultMessage = keyword 
        ? `Từ khóa <strong class="text-accent-titan">${keyword}</strong> không có trong cơ sở dữ liệu. Vui lòng thử từ khóa khác.`
        : `Hiện tại chưa có dữ liệu nào được cập nhật. Vui lòng quay lại sau.`;

    return (
        <div className="empty-state-titan fade-in industrial-p-80">
            <div className="empty-icon-titan">
                <Ghost size={64} strokeWidth={1.5} />
            </div>
            
            <h3 className="empty-title-industrial">
                {title}
            </h3>
            <p className="empty-desc-industrial" dangerouslySetInnerHTML={{ __html: message || defaultMessage }} />
            
            <NextLink href={buttonHref} className="btn btn-primary empty-btn-industrial">
                {buttonText}
            </NextLink>

            <style jsx>{`
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
            <style jsx global>{`
                .text-accent-titan {
                    color: var(--accent);
                    font-weight: 950;
                }
            `}</style>
        </div>
    );
}

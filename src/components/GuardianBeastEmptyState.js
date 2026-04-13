'use client';

import Link from 'next/link';
import { Ghost } from 'lucide-react';

export default function GuardianBeastEmptyState({ 
    keyword = '', 
    title = 'KHÔNG CÓ KẾT QUẢ', 
    message = '',
    buttonText = 'Quay Lại Trang Chủ',
    buttonHref = '/'
}) {
    const defaultMessage = keyword 
        ? `Từ khóa <strong style="color: var(--accent)">${keyword}</strong> không có trong cơ sở dữ liệu. Vui lòng thử từ khóa khác.`
        : `Hiện tại chưa có dữ liệu nào được cập nhật. Vui lòng quay lại sau.`;

    return (
        <div className="empty-state-titan fade-in" style={{ padding: '80px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Ghost size={48} color="rgba(255,255,255,0.15)" style={{ marginBottom: '25px' }} />
            
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '12px', color: 'var(--text-primary)' }}>
                {title}
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.4)', maxWidth: '500px', margin: '0 auto', fontWeight: 500, fontSize: '0.95rem', lineHeight: '1.7' }} dangerouslySetInnerHTML={{ __html: message || defaultMessage }} />
            
            <Link href={buttonHref} className="btn btn-primary" style={{ marginTop: '30px', padding: '12px 35px' }}>
                {buttonText}
            </Link>
        </div>
    );
}

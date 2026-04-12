'use client';

import { useState } from 'react';
import { useToast } from '@/components/ToastProvider';

export default function SocialShare({ title }) {
    const { addToast } = useToast();
    const [url, setUrl] = useState('');

    useState(() => {
        if (typeof window !== 'undefined') {
            setUrl(window.location.href);
        }
    }, []);

    const handleCopy = () => {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(url);
            if (addToast) addToast('✅ Đã sao chép liên kết vào bộ nhớ tạm!', 'success');
        }
    };

    const sharePlatforms = [
        { 
            name: 'Facebook', 
            icon: '🔵', 
            link: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
            color: '#1877F2' 
        },
        { 
            name: 'Zalo', 
            icon: '🔹', 
            link: `https://zalo.me/share?url=${encodeURIComponent(url)}`,
            color: '#0068FF' 
        },
        { 
            name: 'Telegram', 
            icon: '✈️', 
            link: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
            color: '#0088CC' 
        }
    ];

    return (
        <div className="social-share-container fade-in" style={{ marginTop: '25px' }}>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05rem' }}>
                📢 Chia sẻ với bạn bè
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {sharePlatforms.map(p => (
                    <a 
                        key={p.name}
                        href={p.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="titan-share-btn"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 15px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}
                    >
                        <span style={{ fontSize: '1.2rem' }}>{p.icon}</span>
                        {p.name}
                    </a>
                ))}
                <button 
                    onClick={handleCopy}
                    className="titan-share-btn"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 15px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                >
                    <span style={{ fontSize: '1.1rem' }}>📋</span> Sao chép link
                </button>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ToastProvider';
import { Facebook, MessageCircle, Send, Megaphone, Copy } from 'lucide-react';

export default function SocialShare({ title }) {
    const { addToast } = useToast();
    const [url, setUrl] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setUrl(window.location.href);
        }
    }, []);

    const handleCopy = () => {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(url);
            if (addToast) addToast('Đã sao chép liên kết!', 'success');
        }
    };

    const sharePlatforms = [
        { 
            name: 'Facebook', 
            icon: <Facebook size={18} />, 
            link: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
            color: '#1877F2' 
        },
        { 
            name: 'Zalo', 
            icon: <MessageCircle size={18} />, 
            link: `https://zalo.me/share?url=${encodeURIComponent(url)}`,
            color: '#0068FF' 
        },
        { 
            name: 'Telegram', 
            icon: <Send size={18} />, 
            link: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
            color: '#0088CC' 
        }
    ];

    return (
        <div className="social-share-container fade-in" style={{ marginTop: '25px' }}>
            <p style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05rem' }}>
                <Megaphone size={14} /> Chia sẻ với bạn bè
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {sharePlatforms.map(p => (
                    <a 
                        key={p.name}
                        href={p.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="titan-share-btn"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700 }}
                    >
                        {p.icon}
                        {p.name}
                    </a>
                ))}
                <button 
                    onClick={handleCopy}
                    className="titan-share-btn"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
                >
                    <Copy size={18} /> Sao chép link
                </button>
            </div>
        </div>
    );
}

'use client';

import { Share2, Link, Check } from 'lucide-react';
import { useState } from 'react';

/**
 * ShareButton Component
 * @param {string} title - The title of the content
 * @param {string} text - Desciptive text for sharing
 * @param {string} url - The canonical URL to share
 */
export default function ShareButton({ title, text, url, className = "" }) {
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        const shareData = {
            title: title || 'TruyenVip',
            text: text || 'Đọc truyện hay tại TruyenVip!',
            url: url || (typeof window !== 'undefined' ? window.location.href : '')
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Share cancelled or failed', err);
            }
        } else {
            // Fallback: Copy to clipboard
            try {
                await navigator.clipboard.writeText(shareData.url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error('Failed to copy', err);
            }
        }
    };

    return (
        <button 
            onClick={handleShare}
            className={`btn-share-titan ${className}`}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: 'var(--border-radius)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'var(--transition)'
            }}
        >
            {copied ? (
                <>
                    <Check size={16} color="#10b981" /> <span>Đã sao chép!</span>
                </>
            ) : (
                <>
                    <Share2 size={16} /> <span>Chia sẻ</span>
                </>
            )}
        </button>
    );
}

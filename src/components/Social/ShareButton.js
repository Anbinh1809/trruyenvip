'use client';

import { Share2, Check } from 'lucide-react';
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
                // Silently handle cancellation
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
            className={`btn-share-industrial ${className} ${copied ? 'is-copied' : ''}`}
        >
            {copied ? (
                <>
                    <Check size={16} className="text-emerald" /> <span>Đã sao chép!</span>
                </>
            ) : (
                <>
                    <Share2 size={16} /> <span>Chia sẻ</span>
                </>
            )}
            <style jsx>{`
                .btn-share-industrial {
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 24px;
                    border-radius: 12px;
                    background: rgba(255, 255, 255, 0.04);
                    border: 1px solid var(--glass-border);
                    color: white;
                    font-size: 0.85rem;
                    font-weight: 850;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .btn-share-industrial:hover {
                    background: rgba(255, 255, 255, 0.08);
                    border-color: rgba(255, 255, 255, 0.15);
                    transform: translateY(-2px);
                }
                .btn-share-industrial.is-copied {
                    border-color: #10b981;
                    background: rgba(16, 185, 129, 0.05);
                }
                .text-emerald {
                    color: #10b981;
                }
            `}</style>
        </button>
    );
}

'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function DetailCover({ src, alt }) {
    const [imgSrc, setImgSrc] = useState(src);
    const [isLoaded, setIsLoaded] = useState(false);

    return (
        <div className={`detail-cover-container glass-titan ${!isLoaded ? 'skeleton-shimmer' : 'is-loaded'}`} style={{ 
            position: 'relative', 
            overflow: 'hidden',
            borderRadius: '12px',
            boxShadow: isLoaded ? '0 20px 40px rgba(0,0,0,0.6)' : 'none',
            border: '1px solid var(--glass-border)',
            transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
            <Image 
                src={imgSrc} 
                alt={alt} 
                fill 
                sizes="(max-width: 768px) 200px, 320px"
                priority
                fetchPriority="high"
                className="detail-cover-img"
                style={{ 
                    opacity: isLoaded ? 1 : 0, 
                    transform: isLoaded ? 'scale(1)' : 'scale(1.05)',
                    transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)' 
                }}
                onLoad={() => setIsLoaded(true)}
                onError={() => {
                    if (imgSrc !== '/placeholder-manga.jpg') {
                        setImgSrc('/placeholder-manga.jpg');
                    }
                }}
            />
        </div>
    );
}

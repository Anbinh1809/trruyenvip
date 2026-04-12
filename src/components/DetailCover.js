'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function DetailCover({ src, alt }) {
    const [imgSrc, setImgSrc] = useState(src);
    const [isLoaded, setIsLoaded] = useState(false);

    return (
        <div className={`detail-cover-container glass ${!isLoaded ? 'skeleton' : ''}`} style={{ position: 'relative', overflow: 'hidden' }}>
            <Image 
                src={imgSrc} 
                alt={alt} 
                fill 
                sizes="(max-width: 768px) 200px, 320px"
                priority
                fetchPriority="high"
                className="detail-cover-img"
                style={{ opacity: isLoaded ? 1 : 0, transition: 'opacity 0.3s' }}
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

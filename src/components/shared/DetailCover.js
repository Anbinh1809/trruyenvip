'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function DetailCover({ src, alt }) {
    const [imgSrc, setImgSrc] = useState(src);
    const [isLoaded, setIsLoaded] = useState(false);

    return (
        <div className={`detail-cover-container-industrial glass-titan ${!isLoaded ? 'skeleton-shimmer' : 'is-loaded-industrial'}`}>
            <Image 
                src={imgSrc} 
                alt={alt} 
                fill 
                unoptimized
                sizes="(max-width: 768px) 200px, 350px"
                priority
                fetchPriority="high"
                className={`detail-cover-img-tag ${isLoaded ? 'opacity-full' : 'opacity-zero'}`}
                onLoad={() => setIsLoaded(true)}
                onError={() => {
                    if (imgSrc !== '/placeholder-manga.svg') {
                        setImgSrc('/placeholder-manga.svg');
                    }
                }}
            />
            <style jsx>{`
                .detail-cover-container-industrial {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    border-radius: 20px;
                    overflow: hidden;
                    border: 1px solid var(--glass-border);
                    transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .is-loaded-industrial {
                    border-color: rgba(255, 255, 255, 0.1);
                    box-shadow: 0 40px 80px rgba(0, 0, 0, 0.4);
                }
                .detail-cover-container-industrial:hover {
                    transform: translateY(-10px) scale(1.02);
                    border-color: var(--accent);
                    box-shadow: 0 50px 100px rgba(255, 62, 62, 0.15);
                }
                .detail-cover-img-tag {
                    object-fit: cover;
                    transition: opacity 0.8s ease-out;
                }
                .opacity-zero { opacity: 0; }
                .opacity-full { opacity: 1; }
            `}</style>
        </div>
    );
}

'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function MobileGenreNav({ genres }) {
    const searchParams = useSearchParams();
    const currentType = searchParams.get('type');
    const scrollerRef = useRef(null);

    useEffect(() => {
        const activeItem = scrollerRef.current?.querySelector('.active');
        if (activeItem) {
            activeItem.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
    }, [currentType]);

    return (
        <div className="titan-mobile-genre-hud fade-up">
            <div className="titan-genre-scroller" ref={scrollerRef}>
                <Link 
                    href="/genres"
                    className={`titan-genre-tag-mobile ${!currentType ? 'active' : ''}`}
                >
                    📚 Tất cả
                </Link>
                {genres.map(g => (
                    <Link 
                        key={g.slug}
                        href={`/genres?type=${g.slug}`}
                        className={`titan-genre-tag-mobile ${currentType === g.slug ? 'active' : ''}`}
                    >
                        ▶ {g.name}
                    </Link>
                ))}
            </div>
        </div>
    );
}

'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { Library, Sparkles, Sword, Ghost, Heart, Star, Zap, User } from 'lucide-react';

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

    // Icon mapping for premium look
    const getGenreIcon = (slug) => {
        const icons = {
            'action': <Sword size={14} />,
            'horror': <Ghost size={14} />,
            'romance': <Heart size={14} />,
            'fantasy': <Zap size={14} />,
            'shoujo': <Star size={14} />,
            'shounen': <User size={14} />,
            'default': <Sparkles size={14} />
        };
        return icons[slug] || icons['default'];
    };

    return (
        <div className="titan-mobile-genre-hud fade-up">
            <div className="titan-genre-scroller glass-scrollbar" ref={scrollerRef}>
                <Link 
                    href="/genres"
                    className={`titan-genre-tag-mobile ${!currentType ? 'active' : ''}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <Library size={14} /> Tất cả
                </Link>
                {genres.map(g => (
                    <Link 
                        key={g.slug}
                        href={`/genres?type=${g.slug}`}
                        className={`titan-genre-tag-mobile ${currentType === g.slug ? 'active' : ''}`}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        {getGenreIcon(g.slug)} {g.name}
                    </Link>
                ))}
            </div>
        </div>
    );
}

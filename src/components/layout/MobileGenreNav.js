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
                >
                    <Library size={14} /> Tất cả
                </Link>
                {genres.map(g => (
                    <Link 
                        key={g.slug}
                        href={`/genres?type=${g.slug}`}
                        className={`titan-genre-tag-mobile ${currentType === g.slug ? 'active' : ''}`}
                    >
                        {getGenreIcon(g.slug)} {g.name}
                    </Link>
                ))}
            </div>
            <style>{`
                .titan-mobile-genre-hud {
                    position: sticky;
                    top: var(--header-height);
                    z-index: 1000;
                    background: rgba(2, 6, 23, 0.9);
                    backdrop-filter: blur(20px);
                    border-bottom: 1px solid var(--glass-border);
                    padding: 8px 0;
                }
                .titan-genre-scroller {
                    display: flex;
                    gap: 10px;
                    padding: 4px 20px;
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                }
                .titan-genre-tag-mobile {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    background: var(--nebula-glass);
                    border: 1px solid var(--glass-border);
                    border-radius: 30px;
                    color: var(--text-muted);
                    font-size: 0.8rem;
                    font-weight: 800;
                    white-space: nowrap;
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    text-decoration: none;
                }
                .titan-genre-tag-mobile.active {
                    background: var(--accent);
                    border-color: var(--accent);
                    color: var(--text-primary);
                    box-shadow: 0 4px 15px rgba(255, 62, 62, 0.2);
                }
            `}</style>
        </div>
    );
}

'use client';

import { useRouter } from 'next/navigation';

export default function ChapterSelector({ mangaId, chapters, currentId }) {
    const router = useRouter();

    const handleChange = (e) => {
        const id = e.target.value;
        if (id) {
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
            router.push(`/manga/${mangaId}/chapter/${id}`);
        }
    };

    return (
        <div className="chapter-selector-titan">
            <select 
                value={currentId} 
                onChange={handleChange}
                className="select-titan-industrial"
            >
                {chapters.map((chap) => (
                    <option key={chap.id} value={chap.id}>
                        {chap.title || `Chương ${chap.chapter_number}`}
                    </option>
                ))}
            </select>
            <style jsx>{`
                .select-titan-industrial {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid var(--glass-border);
                    color: white;
                    padding: 8px 15px;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    font-weight: 800;
                    cursor: pointer;
                    outline: none;
                    transition: all 0.3s;
                    max-width: 150px;
                }
                .select-titan-industrial:hover {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: var(--accent);
                }
                @media (max-width: 768px) {
                    .select-titan-industrial { max-width: 140px; font-size: 0.75rem; padding: 6px 10px; }
                }
            `}</style>
        </div>
    );
}

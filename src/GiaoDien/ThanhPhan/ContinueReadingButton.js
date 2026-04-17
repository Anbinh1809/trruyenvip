'use client';

import { useHistory } from '@/NguCanh/HistoryContext';
import Link from 'next/link';
import { useMemo } from 'react';
import { Play, SkipForward, FastForward } from 'lucide-react';

export default function ContinueReadingButton({ mangaId, chapters }) {
  const { history, mounted } = useHistory();

  const lastRead = useMemo(() => {
    if (!mounted) return null;
    return history.find(h => h.mangaId === mangaId);
  }, [history, mangaId, mounted]);

  if (!mounted || !chapters || chapters.length === 0) return null;

  if (lastRead) {
      return (
        <Link 
            href={`/manga/${mangaId}/chapter/${lastRead.chapterId}`} 
            className="btn btn-primary cont-reading-btn-industrial"
        >
            <Play size={20} fill="currentColor" /> ÄoŒC TIáº¾P (Ch. {lastRead.chapterNumber || '?'})
            <style jsx>{`
                .cont-reading-btn-industrial {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    padding: 16px 40px;
                    font-weight: 950;
                    font-size: 1.1rem;
                    letter-spacing: 0.5px;
                    width: 100%;
                }
            `}</style>
        </Link>
      );
  }

  return (
      <div className="reading-init-industrial">
          <Link href={`/manga/${mangaId}/chapter/${chapters[chapters.length - 1].id}`} className="btn btn-glass init-btn init-first">
             <SkipForward size={18} /> ÄoŒC Toª Äáº¦U
          </Link>
          <Link href={`/manga/${mangaId}/chapter/${chapters[0].id}`} className="btn btn-primary init-btn init-latest">
             <FastForward size={18} fill="currentColor" /> CHÆ¯Æ NG MỚI NHáº¤T
          </Link>
          <style jsx>{`
            .reading-init-industrial {
                display: flex; 
                gap: 20px; 
                width: 100%;
            }
            .init-btn {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                padding: 16px 20px;
                font-weight: 950;
                font-size: 1rem;
                letter-spacing: 0.5px;
            }
            @media (max-width: 768px) {
                .reading-init-industrial {
                    flex-direction: column;
                }
            }
          `}</style>
      </div>
  );
}


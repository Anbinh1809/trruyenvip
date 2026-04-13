'use client';

import { useHistory } from '@/context/HistoryContext';
import Link from 'next/link';
import { useMemo } from 'react';

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
            className="btn btn-primary btn-large"
            style={{ 
                background: 'var(--accent)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
            }}
        >
            Đọc tiếp (Ch. {lastRead.chapterNumber || '?'})
        </Link>
      );
  }

  return (
      <div style={{ display: 'flex', gap: '15px', width: '100%' }}>
          <Link href={`/manga/${mangaId}/chapter/${chapters[chapters.length - 1].id}`} className="btn btn-outline" style={{ flex: 1 }}>
              Đọc chương đầu
          </Link>
          <Link href={`/manga/${mangaId}/chapter/${chapters[0].id}`} className="btn btn-primary" style={{ flex: 1 }}>
              Chương mới nhất
          </Link>
      </div>
  );
}

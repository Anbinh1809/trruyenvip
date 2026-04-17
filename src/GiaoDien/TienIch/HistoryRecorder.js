'use client';

import { useEffect } from 'react';
import { useHistory } from '@/NguCanh/HistoryContext';

export default function HistoryRecorder({ manga, chapter }) {
  const { addToHistory } = useHistory();

  useEffect(() => {
    if (manga && chapter) {
      addToHistory(manga, chapter);
    }
  }, [addToHistory, chapter, manga]);

  return null;
}


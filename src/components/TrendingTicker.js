'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TrendingTicker() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    async function fetchTrending() {
        try {
            const res = await fetch('/api/manga/trending');
            if (res.ok) {
                const data = await res.json();
                setItems(data.slice(0, 5)); // Top 5
            }
        } catch (e) {
            console.error('[Ticker] Failed to fetch trending', e);
        }
    }
    fetchTrending();
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="trending-ticker-titan">
      <div className="trending-ticker-content">
        {items.map((item, idx) => (
          <Link key={item.id} href={`/manga/${item.normalized_title || item.id}`} className="trending-ticker-item">
            <span className="hot-indicator">HOT #{idx + 1}</span>
            {item.title}
          </Link>
        ))}
        {/* Mirror items for seamless loop */}
        {items.map((item, idx) => (
          <Link key={`${item.id}-mirror`} href={`/manga/${item.normalized_title || item.id}`} className="trending-ticker-item">
            <span className="hot-indicator">HOT #{idx + 1}</span>
            {item.title}
          </Link>
        ))}
      </div>
    </div>
  );
}

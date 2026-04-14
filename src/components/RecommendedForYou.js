'use client';

import { useHistory } from '@/context/HistoryContext';
import { useState, useEffect } from 'react';
import MangaCard from './MangaCard';
import { Sparkles, Library } from 'lucide-react';
import { query, MANGA_CARD_FIELDS } from '@/lib/db';

export default function RecommendedForYou() {
  const { history, mounted } = useHistory();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mounted) return;

    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const genreIds = new Set();
        history.forEach(item => {
          if (item.genres) {
            item.genres.forEach(g => genreIds.add(g.id));
          }
        });

        let data;
        if (genreIds.size > 0) {
            const res = await fetch(`/api/recommendations?genres=${Array.from(genreIds).join(',')}`);
            data = await res.json();
        } else {
            const res = await fetch('/api/manga/trending?limit=10');
            data = await res.json();
        }
        setRecommendations(data || []);
      } catch (err) {
        console.error('Failed to fetch recommendations', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [history, mounted]);

  if (!mounted) return null;

  return (
    <section className="section-titan fade-in">
      <div className="section-header-titan">
        <h2 className="title-titan section-title-industrial">
            {history.length > 0 ? (
                <>
                    <Sparkles size={28} color="var(--accent)" /> Gợi ý cho bạn
                </>
            ) : (
                <>
                    <Library size={28} color="var(--accent)" /> Truyện mới cập nhật
                </>
            )}
        </h2>
      </div>

      {loading ? (
        <div className="shimmer-grid-titan">
            {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="skeleton-industrial skeleton-card-titan" />
            ))}
        </div>
      ) : (
        <div className="manga-grid-titan">
            {recommendations.map(manga => (
                <MangaCard key={manga.id} manga={manga} />
            ))}
        </div>
      )}

      <style jsx>{`
        .shimmer-grid-titan {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 25px;
        }
        .skeleton-card-titan {
            aspect-ratio: 4/5.4;
            border-radius: 12px;
        }
        @media (max-width: 768px) {
            .shimmer-grid-titan {
                grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                gap: 15px;
            }
        }
      `}</style>
    </section>
  );
}

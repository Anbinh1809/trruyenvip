'use client';

import { useHistory } from '@/context/HistoryContext';
import { useState, useEffect, useCallback } from 'react';
import MangaCard from './MangaCard';
import { Sparkles } from 'lucide-react';

export default function RecommendedForYou() {
  const { history, mounted } = useHistory();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    try {
      const lastMangaId = history?.[0]?.mangaId || '';
      const res = await fetch(`/api/recommendations?mangaId=${lastMangaId}`);
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data);
      }
    } catch (e) {
      console.error('Fetch recommendations error', e);
    }
    setLoading(false);
  }, [history]);

  useEffect(() => {
    if (mounted) {
      const timer = setTimeout(() => fetchRecommendations(), 0);
      return () => clearTimeout(timer);
    }
  }, [mounted, fetchRecommendations]);
  
  // SKELETON STATE: Stable Hydration Guardian
  if (!mounted || (loading && recommendations.length === 0)) {
    return (
      <section className="section-titan">
        <div className="section-header-titan">
          <div className="header-label">
            <span className="badge-red">GỢI Ý</span>
            <h2 className="title-titan" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles size={20} color="var(--accent)" /> Dành riêng cho bạn
            </h2>
          </div>
        </div>
        <div className="shimmer-grid-titan">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-premium-card" />)}
        </div>
      </section>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <section className="section-titan fade-in">
      <div className="section-header-titan">
        <div className="header-label">
          <span className="badge-red">GỢI Ý</span>
          <h2 className="title-titan" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={24} color="var(--accent)" /> Dành riêng cho bạn
          </h2>
          <p className="subtitle-titan">Dựa trên sở thích đọc truyện của bạn</p>
        </div>
      </div>
      
      {loading ? (
        <div className="shimmer-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '30px' }}>
            {[1,2,3,4].map(i => <div key={i} className="shimmer" style={{ height: '350px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)' }} />)}
        </div>
      ) : (
        <div className="manga-grid-titan">
          {recommendations.map((manga) => (
            <MangaCard key={manga.id} manga={manga} />
          ))}
        </div>
      )}
    </section>
  );
}

'use client';

import Header from '@/GiaoDien/BoCuc/Header';
import { useHistory } from '@/NguCanh/HistoryContext';
import Link from 'next/link';
import Image from 'next/image';
import EmptyState from '@/GiaoDien/ThanhPhan/EmptyState';
import { Trash2, BookOpen, Clock } from 'lucide-react';

export default function HistoryPage() {
  const { history, clearHistory } = useHistory();

    return (
        <main className="main-wrapper titan-bg history-page">
            <Header />
            
            <div className="container history-container fade-in">
                <header className="history-header-industrial fade-up">
                    <div className="header-left-industrial">
                        <div className="library-badge-titan">TRUYộN Äàƒ XEM</div>
                        <h1 className="history-title-industrial">LoŠCH So¬ ÄoŒC</h1>
                        <p className="history-subtitle">Các bản ghi hoáº¡t Ä‘o™ng Ä‘oc truyện của báº¡n trên hệ thống.</p>
                    </div>
                    {history.length > 0 && (
                        <button className="btn btn-outline clear-btn-industrial" onClick={clearHistory}>
                            <Trash2 size={18} /> XOà LoŠCH So¬
                        </button>
                    )}
                </header>

                {history.length > 0 ? (
                    <div className="history-grid-industrial">
                        {history.map((item, idx) => (
                            <div key={item.mangaId} className="history-node-titan fade-in shadow-titan" style={{ '--delay': `${idx * 0.05}s` }}>
                                <Link href={`/manga/${item.mangaId}`} className="history-cover-box">
                                    <Image 
                                        src={item.mangaCover} 
                                        alt={item.mangaTitle} 
                                        fill
                                        sizes="(max-width: 768px) 50vw, 300px"
                                        className="history-cover-img"
                                    />
                                    <div className="history-chapter-tag shadow-titan">
                                        <Clock size={12} /> {new Date(item.timestamp).toLocaleDateString('vi-VN')}
                                    </div>
                                </Link>
                                <div className="history-info-industrial">
                                    <h3 className="history-item-title">{item.mangaTitle}</h3>
                                    <div className="history-last-read">Dừng láº¡i oŸ: {item.chapterTitle}</div>
                                    <Link 
                                        href={`/manga/${item.mangaId}/chapter/${item.chapterId}`} 
                                        className="btn btn-primary history-action-industrial"
                                    >
                                        ÄoŒC TIáº¾P <BookOpen size={16} />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState 
                        title="Hà€NH TRàŒNH CHÆ¯A Báº®T Äáº¦U"
                        subtitle="Lo‹ch sử Ä‘oc của báº¡n hiện Ä‘ang tro‘ng. Hà£y khám phá những tác pháº©m tinh hoa ngay bà¢y gio!"
                        actionText="KHàM PHà NGAY"
                        actionUrl="/"
                    />
                )}
            </div>
            <style jsx>{`
                .header-left-industrial { flex: 1; }
                .history-node-titan { animation: fadeUp 0.8s both var(--delay); }
                @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </main>
    );
}


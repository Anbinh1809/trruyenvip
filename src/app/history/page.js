'use client';

import Header from '@/components/layout/Header';
import { useHistory } from '@/contexts/HistoryContext';
import Link from 'next/link';
import Image from 'next/image';
import EmptyState from '@/components/shared/EmptyState';
import { Trash2, BookOpen, Clock } from 'lucide-react';

export default function HistoryPage() {
  const { history, clearHistory } = useHistory();

    return (
        <main className="main-wrapper titan-bg history-page">
            <Header />
            
            <div className="container history-container fade-in">
                <header className="history-header-industrial fade-up">
                    <div className="header-left-industrial">
                        <div className="library-badge-titan">TRUYỆN ĐÃ XEM</div>
                        <h1 className="history-title-industrial">LỊCH SỬ ĐỌC</h1>
                        <p className="history-subtitle">Các bản ghi hoạt động đọc truyện của bạn trên hệ thống.</p>
                    </div>
                    {history.length > 0 && (
                        <button className="btn btn-outline clear-btn-industrial" onClick={clearHistory}>
                            <Trash2 size={18} /> XOÁ LỊCH SỬ
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
                                        unoptimized
                                    />
                                    <div className="history-chapter-tag shadow-titan">
                                        <Clock size={12} /> {new Date(item.timestamp).toLocaleDateString('vi-VN')}
                                    </div>
                                </Link>
                                <div className="history-info-industrial">
                                    <h3 className="history-item-title">{item.mangaTitle}</h3>
                                    <div className="history-last-read">Dừng lại ở: {item.chapterTitle}</div>
                                    <Link 
                                        href={`/manga/${item.mangaId}/chapter/${item.chapterId}`} 
                                        className="btn btn-primary history-action-industrial"
                                    >
                                        ĐỌC TIẾP <BookOpen size={16} />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState 
                        title="HÀNH TRÌNH CHƯA BẮT ĐẦU"
                        subtitle="Lịch sử đọc của bạn hiện đang trống. Hãy khám phá những tác phẩm tinh hoa ngay bây giờ!"
                        actionText="KHÁM PHÁ NGAY"
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

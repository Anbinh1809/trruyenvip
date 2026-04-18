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
                        <div className="library-badge-titan">TRUY?N Đ� XEM</div>
                        <h1 className="history-title-industrial">Lo�CH So� Đo�C</h1>
                        <p className="history-subtitle">C�c b?n ghi hoạt đo�ng đo�c truy?n của bạn tr�n h? th?ng.</p>
                    </div>
                    {history.length > 0 && (
                        <button className="btn btn-outline clear-btn-industrial" onClick={clearHistory}>
                            <Trash2 size={18} /> XO� Lo�CH So�
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
                                    <div className="history-last-read">D?ng lại o�: {item.chapterTitle}</div>
                                    <Link 
                                        href={`/manga/${item.mangaId}/chapter/${item.chapterId}`} 
                                        className="btn btn-primary history-action-industrial"
                                    >
                                        Đo�C TIẾP <BookOpen size={16} />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState 
                        title="H�NH TR�NH CHƯA BẮT ĐẦU"
                        subtitle="Lo�ch s? đo�c của bạn hi?n đang tro�ng. H�y kh�m ph� nh?ng t�c phẩm tinh hoa ngay b�y gio�!"
                        actionText="KH�M PH� NGAY"
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


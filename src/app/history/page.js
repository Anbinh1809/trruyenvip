'use client';

import Header from '@/components/Header';
import { useHistory } from '@/context/HistoryContext';
import Link from 'next/link';
import Image from 'next/image';
import EmptyState from '@/components/EmptyState';

export default function HistoryPage() {
  const { history, clearHistory } = useHistory();

    return (
        <main className="history-page titan-bg" style={{ minHeight: '100vh', paddingBottom: '100px', color: 'white' }}>
            <Header />
            
            <div className="container" style={{ paddingTop: '120px' }}>
                <header style={{ marginBottom: '50px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                        <h1 style={{ fontSize: '3.5rem', fontWeight: 950, marginBottom: '10px', letterSpacing: '-2px' }}>Lịch sử đọc truyện</h1>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600, fontSize: '1.1rem' }}>Danh sách các bộ truyện bạn đã đọc gần đây</p>
                    </div>
                    {history.length > 0 && (
                        <button className="btn btn-view-all" onClick={clearHistory} style={{ padding: '12px 25px' }}>
                            Xoá lịch sử
                        </button>
                    )}
                </header>

                {history.length > 0 ? (
                    <div className="history-grid-titan">
                        {history.map((item) => (
                            <div key={item.mangaId} className="action-node-titan fade-in" style={{ padding: 0, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <Link href={`/manga/${item.mangaId}`} style={{ display: 'block', position: 'relative', width: '100%', aspectRatio: '2/3' }}>
                                    <Image 
                                        src={item.mangaCover} 
                                        alt={item.mangaTitle} 
                                        fill
                                        sizes="(max-width: 768px) 50vw, 300px"
                                        style={{ objectFit: 'cover' }}
                                    />
                                    <div style={{ position: 'absolute', bottom: '15px', left: '15px' }}>
                                        <div style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', padding: '6px 14px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 900, color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
                                            {new Date(item.timestamp).toLocaleDateString('vi-VN')}
                                        </div>
                                    </div>
                                </Link>
                                <div style={{ padding: '25px' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 850, color: 'white', marginBottom: '10px', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.mangaTitle}</h3>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '20px', opacity: 0.9 }}>Dừng lại ở: {item.chapterTitle}</div>
                                    <Link 
                                        href={`/manga/${item.mangaId}/chapter/${item.chapterId}`} 
                                        className="btn btn-primary"
                                        style={{ display: 'block', textAlign: 'center', fontSize: '0.85rem', fontWeight: 850, padding: '15px', borderRadius: '15px' }}
                                    >
                                        Đọc tiếp
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState 
                        title="Hành trình chưa bắt đầu"
                        subtitle="Lịch sử đọc của đạo hữu hiện đang trống. Hãy khai phá những bộ tịch tuyệt phẩm ngay bây giờ!"
                        actionText="Khám phá ngay"
                        actionUrl="/"
                    />
                )}
            </div>
        </main>
    );
}

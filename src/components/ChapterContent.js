'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import RecrawlButton from './RecrawlButton';
import { Link as LinkIcon, AlertCircle, RefreshCw } from 'lucide-react';

export default function ChapterContent({ chapterId, initialImages = [] }) {
    const [images, setImages] = useState(initialImages);
    const [isSyncing, setIsSyncing] = useState(initialImages.length === 0);
    const [error, setError] = useState(null);
    const pollInterval = useRef(null);
    const prevChapterId = useRef(chapterId);

    const stopPolling = useCallback(() => {
        if (pollInterval.current) {
            clearInterval(pollInterval.current);
            pollInterval.current = null;
        }
    }, []);

    const startPolling = useCallback(() => {
        stopPolling();
        let retries = 0;
        const MAX_RETRIES = 40;

        pollInterval.current = setInterval(async () => {
            if (chapterId !== prevChapterId.current) {
                stopPolling();
                return;
            }

            retries++;
            if (retries > MAX_RETRIES) {
                stopPolling();
                setIsSyncing(false);
                setError('Hệ thống cào đang bận hoặc nguồn không phản hồi. Vui lòng bấm Thử lại.');
                return;
            }

            try {
                const res = await fetch(`/api/reader/chapter-images?id=${encodeURIComponent(chapterId)}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.images && data.images.length > 0) {
                        const optimizedWidth = window.innerWidth < 768 ? 800 : 1200;
                        setImages(data.images.map(img => 
                            `/api/proxy?url=${encodeURIComponent(img.image_url)}&w=${optimizedWidth}`
                        ));
                        setIsSyncing(false);
                        stopPolling();
                    }
                }
            } catch (e) {
                // Continue polling
            }
        }, 800); // Tightened from 1500ms to 800ms
    }, [chapterId, stopPolling]);

    const startSync = useCallback(async () => {
        setIsSyncing(true);
        setError(null);
        try {
            const res = await fetch('/api/crawler/jit-sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chapterId })
            });

            const data = await res.json().catch(() => ({}));

            if (res.ok) {
                // Sync completed synchronously on Vercel — fetch images immediately
                if (data.imageCount > 0) {
                    const imgRes = await fetch(`/api/reader/chapter-images?id=${encodeURIComponent(chapterId)}`);
                    if (imgRes.ok) {
                        const imgData = await imgRes.json();
                        if (imgData.images?.length > 0) {
                            const optimizedWidth = window.innerWidth < 768 ? 800 : 1200;
                            setImages(imgData.images.map(img =>
                                `/api/proxy?url=${encodeURIComponent(img.image_url)}&w=${optimizedWidth}`
                            ));
                            setIsSyncing(false);
                            return;
                        }
                    }
                }
                // Fallback: start polling in case sync is still writing
                startPolling();
            } else if (res.status === 429) {
                setError(data.error || 'Thao tác quá nhanh, vui lòng đợi một chút.');
                setIsSyncing(false);
            } else if (res.status === 404) {
                setError('Chương này không tồn tại trong hệ thống. Vui lòng quay lại mục lục.');
                setIsSyncing(false);
            } else {
                setError(data.error || 'Hệ thống đang bảo trì hoặc nguồn không phản hồi. Vui lòng quay lại sau.');
                setIsSyncing(false);
            }
        } catch (e) {
            setError('Lỗi kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.');
            setIsSyncing(false);
        }
    }, [chapterId, startPolling]);

    useEffect(() => {
        const chapterChanged = prevChapterId.current !== chapterId;
        if (chapterChanged) {
            setImages(initialImages);
            setIsSyncing(initialImages.length === 0);
            setError(null);
            prevChapterId.current = chapterId;
        }

        if (images.length === 0 && initialImages.length === 0) {
            startSync();
        }
        
        return () => stopPolling();
    }, [chapterId, startSync, stopPolling, images.length, initialImages]);

    if (error) {
        return (
            <div className="error-container" style={{ padding: '80px 20px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>{error}</p>
                <button className="btn btn-primary" onClick={startSync}>Thử lại</button>
            </div>
        );
    }

    if (isSyncing && images.length === 0) {
        return (
            <div className="syncing-container" style={{ padding: '120px 20px', textAlign: 'center' }}>
                <div className="loader-ring" style={{ width: '80px', height: '80px', margin: '0 auto 30px' }}></div>
                <h3 style={{ fontWeight: 800, fontSize: '1.4rem', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <LinkIcon size={24} color="var(--accent)" /> Đang cào dữ liệu...
                </h3>
                <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>
                    Chương này chưa được lưu sẵn. Hệ thống đang đồng bộ dữ liệu trực tiếp từ nguồn cho ông, vui lòng đợi vài giây!
                </p>
                <div className="shimmer-group" style={{ marginTop: '50px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="shimmer" style={{ width: '100%', height: '400px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)' }}></div>
                    <div className="shimmer" style={{ width: '100%', height: '400px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)' }}></div>
                </div>
            </div>
        );
    }

    return (
        <div className="reader-img-container fade-in">
            {images.map((img, idx) => (
                <ReaderImage key={`${chapterId}_${idx}`} src={img} idx={idx} />
            ))}
            {images.length === 0 && !isSyncing && (
                <div style={{ padding: '80px 0', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)' }}>Mục tiêu tổng thể quán hiện không tìm thấy. Có thể pháp bảo bị trục trặc hoặc nguồn đã bị xóa.</p>
                    <RecrawlButton chapterId={chapterId} />
                </div>
            )}
        </div>
    );
}

function ReaderImage({ src, idx }) {
    const [error, setError] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [shouldLoad, setShouldLoad] = useState(idx < 3); // Load first 3 immediately
    const [retryCount, setRetryCount] = useState(0);
    const [imgWidth, setImgWidth] = useState(1200);
    const containerRef = useRef(null);

    useEffect(() => {
        // High-Fidelity Check: Adjust width for 4K mode
        if (localStorage.getItem('truyenvip_hifi') === 'true') {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setImgWidth(2000);
        }

        if (shouldLoad) return;

        // ERGONOMIC VIEWPORT GUARD
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setShouldLoad(true);
                    observer.disconnect();
                }
            });
        }, { rootMargin: '600px' }); // Increased rootMargin for better prefetching

        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [shouldLoad]);

    const handleRetry = () => {
        setError(false);
        setRetryCount(prev => prev + 1);
    };

    if (error) {
        return (
            <div className="reader-img-wrapper" style={{ minHeight: '300px', border: '1px dashed rgba(255,62,62,0.2)', gap: '15px', flexDirection: 'column' }}>
                <AlertCircle size={32} color="var(--accent)" />
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Trang {idx + 1} mất kết nối.</p>
                <button onClick={handleRetry} className="btn btn-glass btn-small" style={{ padding: '8px 20px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <RefreshCw size={14} /> Thử lại
                </button>
            </div>
        );
    }

    return (
        <div className="reader-img-wrapper" ref={containerRef}>
            {(!loaded || !shouldLoad) && (
                <div className="reader-image-placeholder">
                    <span className="reader-page-num">TRANG {idx + 1}</span>
                </div>
            )}
            {shouldLoad && (
                <img 
                    src={`${src}${src.includes('?') ? '&' : '?'}v=${retryCount}&w=${imgWidth}`} 
                    alt={`page ${idx + 1}`} 
                    className={`reader-img-titan ${loaded ? 'reader-img-loaded' : ''}`}
                    loading={idx < 3 ? "eager" : "lazy"} 
                    decoding="async"
                    fetchPriority={idx === 0 ? "high" : "auto"}
                    onLoad={() => setLoaded(true)}
                    onError={() => setError(true)}
                />
            )}
        </div>
    );
}

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
                        const isHiFi = localStorage.getItem('truyenvip_hifi') === 'true';
                        const w = isHiFi ? 1800 : (window.innerWidth < 768 ? 800 : 1200);
                        const q = isHiFi ? 95 : 78;

                        setImages(data.images.map(img => 
                            `/api/proxy?url=${encodeURIComponent(img.image_url)}&w=${w}&q=${q}`
                        ));
                        setIsSyncing(false);
                        stopPolling();
                    }
                }
            } catch (e) {
                // Continue polling
            }
        }, 800);
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
                if (data.imageCount > 0) {
                    const imgRes = await fetch(`/api/reader/chapter-images?id=${encodeURIComponent(chapterId)}`);
                    if (imgRes.ok) {
                        const imgData = await imgRes.json();
                        if (imgData.images?.length > 0) {
                            const isHiFi = localStorage.getItem('truyenvip_hifi') === 'true';
                            const w = isHiFi ? 1800 : (window.innerWidth < 768 ? 800 : 1200);
                            const q = isHiFi ? 95 : 78;

                            setImages(imgData.images.map(img =>
                                `/api/proxy?url=${encodeURIComponent(img.image_url)}&w=${w}&q=${q}`
                            ));
                            setIsSyncing(false);
                            return;
                        }
                    }
                }
                startPolling();
            } else {
                setError(data.error || 'Hệ thống đang bảo trì hoặc nguồn không phản hồi.');
                setIsSyncing(false);
            }
        } catch (e) {
            setError('Lỗi kết nối máy chủ. Vui lòng thử lại.');
            setIsSyncing(false);
        }
    }, [chapterId, startPolling]);

    useEffect(() => {
        if (prevChapterId.current !== chapterId) {
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
            <div className="industrial-error-nebula fade-in">
                <div className="error-icon-box">
                    <AlertCircle size={48} />
                </div>
                <p className="error-text-industrial">{error}</p>
                <button className="btn btn-primary err-retry-btn" onClick={startSync}>Thử lại ngay</button>
                <style jsx>{`
                    .error-icon-box {
                        color: var(--accent);
                        margin-bottom: 25px;
                    }
                    .err-retry-btn {
                        padding: 14px 45px;
                        font-weight: 950;
                        letter-spacing: 1px;
                    }
                `}</style>
            </div>
        );
    }

    if (isSyncing && images.length === 0) {
        return (
            <div className="syncing-overlay-industrial fade-in">
                <div className="loader-titan-ring" />
                <h3 className="sync-title-industrial">
                    <LinkIcon size={24} color="var(--accent)" /> ĐANG ĐỒNG BỘ DỮ LIỆU...
                </h3>
                <p className="sync-sub-industrial">
                    Hệ thống đang trích xuất nội dung trực tiếp từ nguồn chính cho bạn. Quá trình này thường mất khoảng 3-8 giây.
                </p>
                <div className="shimmer-group-industrial">
                    <div className="skeleton-industrial skeleton-reader-page" />
                    <div className="skeleton-industrial skeleton-reader-page" />
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
                <div className="empty-reader-state industrial-p-80">
                    <p className="empty-desc-industrial">Chương này hiện không tìm thấy dữ liệu ảnh.</p>
                    <div className="mt-30">
                        <RecrawlButton chapterId={chapterId} />
                    </div>
                </div>
            )}
            <style jsx>{`
                .mt-30 { margin-top: 30px; }
            `}</style>
        </div>
    );
}

function ReaderImage({ src, idx }) {
    const [error, setError] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [shouldLoad, setShouldLoad] = useState(idx < 3); 
    const [retryCount, setRetryCount] = useState(0);
    const containerRef = useRef(null);

    useEffect(() => {
        if (shouldLoad) return;
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setShouldLoad(true);
                observer.disconnect();
            }
        }, { rootMargin: '1200px' });

        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [shouldLoad]);

    if (error) {
        return (
            <div className="reader-img-error-card industrial-error-nebula min-h-300">
                <AlertCircle size={32} color="var(--accent)" />
                <p className="mt-20">Trang {idx + 1} mất kết nối.</p>
                <button onClick={() => { setError(false); setRetryCount(c => c + 1); }} className="btn btn-outline btn-small mt-20">
                    <RefreshCw size={14} /> Thử lại
                </button>
                <style jsx>{`
                    .min-h-300 { min-height: 300px; padding: 40px; }
                    .mt-20 { margin-top: 20px; font-weight: 800; }
                `}</style>
            </div>
        );
    }

    return (
        <div className="reader-img-wrapper" ref={containerRef}>
            {(!loaded || !shouldLoad) && (
                <div className="reader-image-placeholder skeleton-industrial">
                    <span className="reader-page-num">TRANG {idx + 1}</span>
                </div>
            )}
            {shouldLoad && (
                <img 
                    src={`${src}${src.includes('?') ? '&' : '?'}v=${retryCount}`} 
                    alt={`page ${idx + 1}`} 
                    className={`reader-img-titan ${loaded ? 'reader-img-loaded' : ''}`}
                    onLoad={() => setLoaded(true)}
                    onError={() => setError(true)}
                />
            )}
        </div>
    );
}

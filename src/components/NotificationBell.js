'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Loader2, ExternalLink } from 'lucide-react';
import NextLink from 'next/link';

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    const fetchUnreadCount = async () => {
        try {
            const res = await fetch('/api/notifications/unread-count');
            const data = await res.json();
            setUnreadCount(data.count);
        } catch (e) {}
    };

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/notifications');
            const data = await res.json();
            setNotifications(data);
        } catch (e) {}
        setLoading(false);
    };

    const markAllAsRead = async () => {
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                body: JSON.stringify({ all: true })
            });
            setUnreadCount(0);
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        } catch (e) {}
    };

    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 60000); // Check unread every minute
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (isOpen) fetchNotifications();
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="notification-bell-titan" ref={dropdownRef}>
            <button className="titan-icon-btn position-relative" onClick={() => setIsOpen(!isOpen)}>
                <Bell size={20} fill={unreadCount > 0 ? "currentColor" : "none"} />
                {unreadCount > 0 && <span className="bell-badge-titan">{unreadCount}</span>}
            </button>

            {isOpen && (
                <div className="notification-dropdown-titan shadow-lg fade-in">
                    <div className="dropdown-header-titan">
                        <h3>Thông báo</h3>
                        {unreadCount > 0 && (
                            <button onClick={markAllAsRead} className="mark-read-btn">
                                <Check size={14} /> Đánh dấu đã đọc
                            </button>
                        )}
                    </div>

                    <div className="notification-list-titan custom-scrollbar">
                        {loading && (
                            <div className="loading-state-titan">
                                <Loader2 className="spin" size={24} />
                            </div>
                        )}

                        {!loading && notifications.length === 0 && (
                            <div className="empty-state-titan">Bạn chưa có thông báo mới</div>
                        )}

                        {notifications.map((n) => (
                            <NextLink 
                                key={n.id} 
                                href={n.link || '#'} 
                                className={`notification-item-titan ${!n.is_read ? 'unread' : ''}`}
                                onClick={() => setIsOpen(false)}
                            >
                                {n.cover && <img src={n.cover} alt="" className="noti-thumb" />}
                                <div className="noti-content">
                                    <p className="noti-title">{n.title}</p>
                                    <p className="noti-msg">{n.message}</p>
                                    <span className="noti-time">
                                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </NextLink>
                        ))}
                    </div>
                </div>
            )}

            <style jsx>{`
                .notification-bell-titan { position: relative; }
                .bell-badge-titan {
                    position: absolute;
                    top: -2px;
                    right: -2px;
                    background: var(--accent);
                    color: white;
                    font-size: 0.6rem;
                    font-weight: 900;
                    padding: 2px 4px;
                    border-radius: 6px;
                    min-width: 16px;
                    text-align: center;
                    border: 2px solid var(--bg-primary);
                }
                .notification-dropdown-titan {
                    position: absolute;
                    top: calc(100% + 15px);
                    right: -10px;
                    width: 320px;
                    background: rgba(2, 6, 23, 0.98);
                    backdrop-filter: blur(25px);
                    border: 1px solid var(--glass-border);
                    border-radius: 16px;
                    z-index: 10000;
                    overflow: hidden;
                }
                .dropdown-header-titan {
                    padding: 15px;
                    border-bottom: 1px solid var(--glass-border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .dropdown-header-titan h3 {
                    margin: 0;
                    font-size: 0.95rem;
                    font-weight: 950;
                    letter-spacing: -0.5px;
                }
                .mark-read-btn {
                    background: transparent;
                    border: none;
                    color: var(--accent);
                    font-size: 0.75rem;
                    font-weight: 800;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                .notification-list-titan {
                    max-height: 400px;
                    overflow-y: auto;
                }
                .notification-item-titan {
                    display: flex;
                    gap: 12px;
                    padding: 15px;
                    text-decoration: none;
                    transition: all 0.3s;
                    border-bottom: 1px solid rgba(255,255,255,0.03);
                }
                .notification-item-titan:hover { background: rgba(255,255,255,0.05); }
                .notification-item-titan.unread { background: rgba(255, 62, 62, 0.03); }
                .noti-thumb {
                    width: 40px;
                    height: 55px;
                    border-radius: 6px;
                    object-fit: cover;
                }
                .noti-title {
                    font-size: 0.85rem;
                    font-weight: 900;
                    color: white;
                    margin: 0 0 2px 0;
                }
                .noti-msg {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                    margin: 0 0 4px 0;
                }
                .noti-time {
                    font-size: 0.65rem;
                    color: var(--text-muted);
                    font-weight: 800;
                }
                .loading-state-titan, .empty-state-titan {
                    padding: 40px;
                    text-align: center;
                    font-size: 0.8rem;
                    font-weight: 800;
                    color: var(--text-muted);
                }
            `}</style>
        </div>
    );
}

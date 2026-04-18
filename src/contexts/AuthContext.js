'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const checkAuth = useCallback(async () => {
        try {
            const res = await fetch('/api/auth/me', { cache: 'no-store' });
            const data = res.ok ? await res.json() : {};
            const isAuth = !!(data.auth || data.authenticated);
            setUser(isAuth ? data.user : null);
            setIsAuthenticated(isAuth);
        } catch {
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { checkAuth(); }, [checkAuth]);

    const handleAuth = useCallback(async (endpoint, body) => {
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                setUser(data.user);
                setIsAuthenticated(true);
                return { success: true };
            }
            return { success: false, error: data.error || 'Lỗi thao tác' };
        } catch {
            return { success: false, error: 'Kết nối máy chủ thất bại' };
        }
    }, []);

    const login = useCallback((username, password) => handleAuth('/api/auth/login', { username, password }), [handleAuth]);
    const register = useCallback((userData) => handleAuth('/api/auth/register', userData), [handleAuth]);

    const logout = useCallback(async () => {
        try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
        ['truyenvip_user_uuid', 'truyenvip_xp', 'truyenvip_coins'].forEach(k => localStorage.removeItem(k));
        setUser(null);
        setIsAuthenticated(false);
        window.location.href = '/';
    }, []);

    const value = useMemo(() => ({ 
        user, loading, isAuthenticated, login, register, logout, checkAuth, refreshUser: checkAuth 
    }), [user, loading, isAuthenticated, login, register, logout, checkAuth]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        // Fallback cho SSR / gọi ngoài Provider (Tránh lỗi Hydration)
        return { 
            isAuthenticated: false, loading: false, user: null,
            login: async () => ({ success: false }), register: async () => ({ success: false }),
            logout: async () => {}, checkAuth: async () => {}
        };
    }
    return context;
};

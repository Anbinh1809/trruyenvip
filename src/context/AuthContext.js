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
            if (res.ok) {
                const data = await res.json();
                if (data.auth || data.authenticated) {
                    // Identity verified; silent for production
                    setUser(data.user);
                    setIsAuthenticated(true);
                } else {
                    setUser(null);
                    setIsAuthenticated(false);
                }
            } else {
                setUser(null);
                setIsAuthenticated(false);
            }
        } catch (e) {
            console.error('[Auth] Verification failed:', e.message);
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const login = useCallback(async (username, password) => {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
                setIsAuthenticated(true);
                return { success: true };
            }
            const errData = await res.json().catch(() => ({ error: 'Lỗi đăng nhập' }));
            return { success: false, error: errData.error };
        } catch (e) {
            console.error('Login error', e);
            return { success: false, error: 'Kết nối máy chủ thất bại' };
        }
    }, []);

    const register = useCallback(async (userData) => {
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
                setIsAuthenticated(true);
                return { success: true };
            }
            const errData = await res.json().catch(() => ({ error: 'Lỗi đăng ký' }));
            return { success: false, error: errData.error };
        } catch (e) {
            console.error('Registration error', e);
            return { success: false, error: 'Kết nối máy chủ thất bại' };
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (e) {
            console.error('Logout failed', e);
        }
        
        localStorage.removeItem('truyenvip_user_uuid');
        localStorage.removeItem('truyenvip_xp');
        localStorage.removeItem('truyenvip_coins');
        
        setUser(null);
        setIsAuthenticated(false);
        window.location.href = '/';
    }, []);

    const value = useMemo(() => ({ 
        user, loading, isAuthenticated, login, register, logout, checkAuth, refreshUser: checkAuth 
    }), [user, loading, isAuthenticated, login, register, logout, checkAuth]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);

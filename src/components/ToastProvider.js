'use client';

import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter(t => t.id !== id));
    }, 5000); // 5s for readability
  }, []);

  const value = useMemo(() => ({ addToast }), [addToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container-titan">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`toast-titan ${toast.type} fade-up`}
          >
            <div className="toast-icon">
              {toast.type === 'success' ? '✅' : (toast.type === 'error' ? '❌' : 'ℹ️')}
            </div>
            <div className="toast-content">
              {toast.message}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// HARDENED HOOK: Prevents build-time crashes if used outside provider
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        // Return a dummy addToast to prevent destructuring errors during SSR/Build
        return { addToast: () => console.warn('[Toast] addToast called outside provider') };
    }
    return context;
};

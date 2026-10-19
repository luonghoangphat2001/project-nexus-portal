import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { formatApiError } from '../utils/errorHandler';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const { language, t } = useLanguage();
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type = 'info', title = '', message = '', duration = 4500 }) => {
      const id = Date.now() + Math.random().toString(36).substring(2, 9);

      // If message is an Error object or contains error details, format via errorHandler
      let displayMessage = message;
      if (typeof message === 'object' && message !== null) {
        displayMessage = formatApiError(message, language);
      } else if (type === 'error' && typeof message === 'string') {
        displayMessage = formatApiError(message, language);
      }

      const newToast = {
        id,
        type,
        title,
        message: displayMessage,
      };

      setToasts((prev) => [...prev.slice(-4), newToast]); // Keep at most 5 toasts visible

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [language, removeToast]
  );

  const toast = {
    error: (msgOrErr, title) =>
      showToast({
        type: 'error',
        title: title || (language === 'vi' ? 'Đã xảy ra lỗi' : 'Error'),
        message: msgOrErr,
      }),
    success: (msg, title) =>
      showToast({
        type: 'success',
        title: title || (language === 'vi' ? 'Thành công' : 'Success'),
        message: msg,
      }),
    warning: (msg, title) =>
      showToast({
        type: 'warning',
        title: title || (language === 'vi' ? 'Cảnh báo' : 'Warning'),
        message: msg,
      }),
    info: (msg, title) =>
      showToast({
        type: 'info',
        title: title || (language === 'vi' ? 'Thông báo' : 'Information'),
        message: msg,
      }),
  };

  // Optional: Global listener for unhandled API errors
  useEffect(() => {
    let lastErrorMsg = '';
    let lastErrorTime = 0;

    const handleApiError = (event) => {
      const error = event.detail;
      // Skip 401 error toasts if navigating away to login
      if (error?.status === 401 && window.location.pathname !== '/login') {
        return;
      }

      const formatted = formatApiError(error, language);
      const now = Date.now();
      // Debounce identical error messages within 1.5 seconds
      if (formatted === lastErrorMsg && now - lastErrorTime < 1500) {
        return;
      }
      lastErrorMsg = formatted;
      lastErrorTime = now;

      toast.error(formatted);
    };

    window.addEventListener('nexus:api_error', handleApiError);
    return () => {
      window.removeEventListener('nexus:api_error', handleApiError);
    };
  }, [language]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast, toast }}>
      {children}
      {/* Toast Notification Container */}
      <div
        className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((item) => (
          <ToastCard
            key={item.id}
            toast={item}
            onClose={() => removeToast(item.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastCard = ({ toast, onClose }) => {
  const { type, title, message } = toast;

  const config = {
    error: {
      bg: 'bg-rose-50/95 border-rose-200 text-rose-900',
      icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />,
      titleColor: 'text-rose-900',
      msgColor: 'text-rose-700',
    },
    success: {
      bg: 'bg-emerald-50/95 border-emerald-200 text-emerald-900',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
      titleColor: 'text-emerald-900',
      msgColor: 'text-emerald-700',
    },
    warning: {
      bg: 'bg-amber-50/95 border-amber-200 text-amber-900',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
      titleColor: 'text-amber-900',
      msgColor: 'text-amber-700',
    },
    info: {
      bg: 'bg-blue-50/95 border-blue-200 text-blue-900',
      icon: <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />,
      titleColor: 'text-blue-900',
      msgColor: 'text-blue-700',
    },
  }[type] || {
    bg: 'bg-slate-50/95 border-slate-200 text-slate-900',
    icon: <Info className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />,
    titleColor: 'text-slate-900',
    msgColor: 'text-slate-700',
  };

  return (
    <div
      className={`pointer-events-auto border rounded-2xl p-4 shadow-lg backdrop-blur-sm transition-all duration-200 transform translate-y-0 opacity-100 flex items-start space-x-3 ${config.bg}`}
      role="alert"
    >
      {config.icon}
      <div className="flex-1 min-w-0 pr-1">
        {title && <h4 className={`text-sm font-bold ${config.titleColor}`}>{title}</h4>}
        <p className={`text-xs mt-0.5 leading-relaxed break-words ${config.msgColor}`}>
          {message}
        </p>
      </div>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-black/5 transition-colors cursor-pointer shrink-0"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;

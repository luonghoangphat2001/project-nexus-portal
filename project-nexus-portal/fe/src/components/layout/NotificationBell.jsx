import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, ChevronRight } from 'lucide-react';
import { notificationService, localizeNotification } from '../../services/notificationService';
import { subscribeNotifications } from '../../services/notificationStream';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { formatDateTime } from '../../utils/dateUtils';

export function NotificationBell() {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const unreadRef = useRef(null);
  const dropdownRef = useRef(null);

  const refresh = useCallback(async () => {
    try {
      const data = await notificationService.getAll();
      if (Array.isArray(data)) {
        setItems(data);
        const unreadItems = data.filter(item => !item.read);
        const newCount = unreadItems.length;

        // If not initial load and new notifications arrived, show real-time toast
        if (unreadRef.current !== null && newCount > unreadRef.current && unreadItems.length > 0) {
          const latest = unreadItems[0];
          const title = localizeNotification(latest.title, language);
          const content = localizeNotification(latest.content, language);
          toast.info(content, title);
        }
        unreadRef.current = newCount;
        setUnread(newCount);
      }
    } catch {
      /* Handled by API interceptor */
    }
  }, [language, toast]);

  useEffect(() => {
    refresh();
    const stop = subscribeNotifications(refresh, () => {});
    return () => {
      stop();
    };
  }, [refresh]);

  // Handle clicking outside & Escape key to close popup
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(prev => !prev);
  };

  const handleItemClick = async (item) => {
    if (!item.read) {
      try {
        await notificationService.markRead(item.id);
        setItems(prev => prev.map(i => (i.id === item.id ? { ...i, read: true } : i)));
        setUnread(prev => Math.max(0, prev - 1));
        if (unreadRef.current !== null) {
          unreadRef.current = Math.max(0, unreadRef.current - 1);
        }
      } catch {
        /* Ignore error */
      }
    }
    setIsOpen(false);
    navigate('/notifications');
  };

  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation();
    const unreadList = items.filter(i => !i.read);
    if (unreadList.length === 0) return;

    try {
      await Promise.all(unreadList.map(i => notificationService.markRead(i.id)));
      setItems(prev => prev.map(i => ({ ...i, read: true })));
      setUnread(0);
      unreadRef.current = 0;
      toast.success(t('notifications.markReadSuccess', 'Đã đánh dấu thông báo là đã đọc.'));
    } catch {
      toast.error(t('common.error', 'Đã xảy ra lỗi'));
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    navigate('/notifications');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label={`Notifications, ${unread} unread`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors relative cursor-pointer ${
          isOpen
            ? 'bg-blue-50 text-blue-600 ring-2 ring-blue-100'
            : 'text-slate-500 hover:text-blue-600 hover:bg-slate-100'
        }`}
        title={t('notifications.title', 'Thông báo')}
      >
        <Bell className="w-4.5 h-4.5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-400 text-slate-900 font-bold text-[10px] flex items-center justify-center shadow-xs border-2 border-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Popup Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200/90 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-800">
                {t('notifications.title', 'Thông báo')}
              </h3>
              {unread > 0 && (
                <span className="text-[11px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  {unread}
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                title={t('notifications.markAllAsRead', 'Đánh dấu tất cả đã đọc')}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>{t('notifications.markAllAsRead', 'Đã đọc tất cả')}</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 divide-opacity-80">
            {items.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-2">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {t('notifications.noNotifications', 'Không có thông báo nào')}
                </p>
              </div>
            ) : (
              items.slice(0, 8).map((item) => {
                const localizedTitle = localizeNotification(item.title, language);
                const localizedContent = localizeNotification(item.content, language);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`p-3.5 text-left transition-colors cursor-pointer flex items-start gap-3 hover:bg-slate-50/90 ${
                      !item.read ? 'bg-blue-50/35' : ''
                    }`}
                  >
                    <div className="mt-1 shrink-0">
                      {!item.read ? (
                        <span className="w-2 h-2 rounded-full bg-blue-600 block shadow-xs" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-transparent block" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <p
                        className={`text-xs leading-snug line-clamp-1 ${
                          !item.read ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'
                        }`}
                      >
                        {localizedTitle}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {localizedContent}
                      </p>
                      <div className="flex items-center justify-between pt-0.5 text-[11px] text-slate-400">
                        <span>{item.createdAt ? formatDateTime(item.createdAt) : ''}</span>
                        {item.authorName && (
                          <span className="font-medium text-slate-500 truncate max-w-[120px]">
                            {item.authorName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-slate-100 bg-slate-50/50 text-center">
            <button
              type="button"
              onClick={handleViewAll}
              className="w-full py-1.5 px-3 rounded-xl text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50/70 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{t('notifications.viewAll', 'Xem tất cả thông báo')}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

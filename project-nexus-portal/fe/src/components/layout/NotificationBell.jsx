import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { notificationService, localizeNotification } from '../../services/notificationService';
import { subscribeNotifications } from '../../services/notificationStream';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../i18n/LanguageContext';

export function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const { toast } = useToast();
  const { language } = useTranslation();
  const unreadRef = useRef(null);

  useEffect(() => {
    let active = true;
    let version = 0;
    async function refresh() {
      const current = ++version;
      try {
        const items = await notificationService.getAll();
        if (active && current === version) {
          const unreadItems = items.filter(item => !item.read);
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
      } catch { /* Existing API interceptor handles expired sessions. */ }
    }
    refresh();
    const stop = subscribeNotifications(refresh, () => {});
    return () => { active = false; stop(); };
  }, [language, toast]);
  return (
    <Link
      to="/notifications"
      aria-label={`Notifications, ${unread} unread`}
      className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors relative cursor-pointer"
      title="Notifications"
    >
      <Bell className="w-4.5 h-4.5" />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-400 text-slate-900 font-bold text-[10px] flex items-center justify-center shadow-xs border-2 border-white">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </Link>
  );
}

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import { subscribeNotifications } from '../../services/notificationStream';

export function NotificationBell() {
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    let active = true;
    let version = 0;
    async function refresh() {
      const current = ++version;
      try {
        const items = await notificationService.getAll();
        if (active && current === version) setUnread(items.filter(item => !item.read).length);
      } catch { /* Existing API interceptor handles expired sessions. */ }
    }
    refresh();
    const stop = subscribeNotifications(refresh, () => {});
    return () => { active = false; stop(); };
  }, []);
  return <Link to="/notifications" aria-label={`Notifications, ${unread} unread`}
    className="text-slate-400 hover:text-[#b66dff] transition-colors relative">
    <Bell className="w-4 h-4" />
    {unread > 0 && <span className="absolute -top-2 -right-2 rounded-full bg-[#fed713] px-1 text-[9px] text-slate-800">{unread > 99 ? '99+' : unread}</span>}
  </Link>;
}

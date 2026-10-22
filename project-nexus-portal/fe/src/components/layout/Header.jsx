import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NotificationBell } from './NotificationBell';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { LogOut, User as UserIcon, PanelLeft, Clock } from 'lucide-react';

export const Header = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [vietnamTime, setVietnamTime] = useState(() => {
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date());
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setVietnamTime(
        new Intl.DateTimeFormat('vi-VN', {
          timeZone: 'Asia/Ho_Chi_Minh',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(new Date())
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Sidebar Toggle Button */}
      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          title={t('header.toggleMenu')}
          aria-label={t('header.toggleMenu')}
        >
          <PanelLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Right: Vietnam Clock, Language Switcher, Notifications & User Dropdown */}
      <div className="flex items-center space-x-2 sm:space-x-3.5">
        {/* Live Vietnam Time (GMT+7) */}
        <div
          className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-mono text-slate-600 shadow-2xs select-none"
          title="Giờ Việt Nam (Asia/Ho_Chi_Minh - UTC+7)"
        >
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span>{vietnamTime}</span>
          <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1 py-0.5 rounded border border-blue-200/60">VN (UTC+7)</span>
        </div>

        {/* Language Switcher */}
        <LanguageSwitcher variant="circle" />

        {/* Notifications Icon */}
        <NotificationBell />

        <div className="h-4 w-px bg-slate-200"></div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2 p-1 rounded-xl hover:bg-slate-50 transition-colors text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-100"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            aria-label="User menu"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-xs shadow-xs">
              {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-slate-800">
                {user?.fullName || user?.username || 'User'}
              </p>
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs text-slate-400">{t('header.signedInAs')}</p>
                <p className="text-sm font-semibold text-slate-800 truncate">{user?.email || 'user@nexus.com'}</p>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/profile');
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  <span>{t('header.profileAndSettings')}</span>
                </button>
              </div>

              <div className="pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>{t('header.signOut')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

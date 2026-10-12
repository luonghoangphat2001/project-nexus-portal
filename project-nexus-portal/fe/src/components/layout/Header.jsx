import React, { useState } from 'react';
import { NotificationBell } from './NotificationBell';
import { useAuth } from '../../context/AuthContext';
import { Bell, Search, LogOut, User as UserIcon, Shield, Menu, Mail, Maximize } from 'lucide-react';

export const Header = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-[#ebedf2] px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center space-x-4">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search (Purple Admin Search style) */}
        <div className="hidden sm:flex items-center relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search projects, topics, users..."
            className="bg-transparent border-0 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-0 w-64 md:w-80"
          />
        </div>
      </div>

      <div className="flex items-center space-x-3 sm:space-x-5">
        {/* Messages Icon */}
        <button className="text-slate-400 hover:text-[#b66dff] transition-colors relative">
          <Mail className="w-4 h-4" />
          <span className="w-1.5 h-1.5 bg-[#fe7c96] rounded-full absolute -top-0.5 -right-0.5"></span>
        </button>

        {/* Notifications Icon */}
        <NotificationBell />

        <div className="h-4 w-px bg-slate-200"></div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2.5 p-1 rounded-lg hover:bg-slate-50 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#da8cff] to-[#9a55ff] flex items-center justify-center font-bold text-white text-xs shadow-xs">
              {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </div>
            <div className="hidden md:block">
              <p className="text-xs font-semibold text-[#343a40]">
                {user?.fullName || user?.username || 'David Greymaax'}
              </p>
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white border border-[#ebedf2] rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-[11px] text-slate-400">Signed in as</p>
                <p className="text-xs font-semibold text-slate-800 truncate">{user?.email || 'user@nexus.com'}</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    window.location.href = '/profile';
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 flex items-center space-x-2 transition-colors"
                >
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Profile & Settings</span>
                </button>
              </div>

              <div className="pt-1 border-t border-slate-100">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-[#fe7c96] hover:bg-rose-50 flex items-center space-x-2 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 text-[#fe7c96]" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  FileText,
  Users2,
  BookmarkCheck,
  Compass,
  Layers,
  Server,
  ShieldAlert,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ isOpen }) => {
  const { user, hasRole } = useAuth();

  const isStudent = hasRole('ROLE_USER');
  const isAdmin = hasRole('ROLE_ADMIN');
  const isPrincipal = hasRole('ROLE_PRINCIPAL');
  const isTeacher = hasRole('ROLE_TEACHER');

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Registration Periods', path: '/periods', icon: BookmarkCheck },
    { name: 'Academic Structure', path: '/academic', icon: Layers },
    { name: 'Notifications', path: '/notifications', icon: FileText },
    { name: 'Project Progress', path: '/progress', icon: LayoutDashboard },
    { name: 'Capstone Topics', path: '/topics', icon: FileText },
    ...(isStudent
      ? [
          { name: 'My Team', path: '/teams', icon: Users2 },
          { name: 'Matchmaking Board', path: '/matchmaking', icon: Compass },
        ]
      : []),
    { name: 'Topic Registrations', path: '/registrations', icon: BookmarkCheck },
    { name: 'User Profile', path: '/profile', icon: UserCheck },
    ...(isAdmin || isPrincipal || isTeacher
      ? [
          {
            name: isAdmin ? 'User Management' : 'Academic Staff',
            path: '/users',
            icon: Users,
          },
          { name: 'Roles & Permissions', path: '/roles', icon: ShieldCheck },
        ]
      : []),
    ...(isAdmin || isPrincipal
      ? [
          { name: 'System Administration', path: '/admin/system', icon: Server },
        ]
      : []),
    ...(isAdmin
      ? [
          { name: 'Security & Audit Logs', path: '/admin/security', icon: ShieldAlert },
        ]
      : []),
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-[#ebedf2] transition-all duration-300 flex flex-col ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-[#ebedf2]">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
            <Layers className="w-4 h-4" />
          </div>
          {isOpen && (
            <div className="flex items-baseline space-x-1.5">
              <span className="font-bold text-lg text-indigo-600 tracking-tight">Nexus</span>
              <span className="text-xs font-semibold text-slate-700">Portal</span>
            </div>
          )}
        </div>
      </div>

      {/* Profile Card */}
      {isOpen && (
        <div className="px-5 py-4 border-b border-[#f3f3f3] flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-slate-800 truncate leading-tight">
              {user?.fullName || user?.username || 'Nexus User'}
            </p>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {user?.roles?.[0]?.replace('ROLE_', '') || 'User'}
            </p>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                } ${!isOpen ? 'justify-center' : 'space-x-3'}`
              }
              title={!isOpen ? item.name : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {isOpen && <span className="truncate">{item.name}</span>}
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
};

export default Sidebar;

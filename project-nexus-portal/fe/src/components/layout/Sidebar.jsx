import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarRange,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  Users2,
  Compass,
  Activity,
  FileText,
  Award,
  CheckSquare,
  BarChart3,
  Users,
  ShieldCheck,
  Server,
  ShieldAlert,
  Layers,
  ChevronDown,
  ChevronsUpDown,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n/LanguageContext';

export const Sidebar = ({ isOpen = true, mobileOpen = false, onCloseMobile }) => {
  const { user, hasRole } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  const isAdmin = hasRole('ROLE_ADMIN');
  const isPrincipal = hasRole('ROLE_PRINCIPAL');
  const isTeacher = hasRole('ROLE_TEACHER');
  const isCouncil = hasRole('ROLE_COUNCIL');
  const isStudent = hasRole('ROLE_USER') && !isAdmin && !isPrincipal && !isTeacher;

  const navGroups = [
    {
      id: 'overview',
      title: t('navGroups.overview'),
      icon: LayoutDashboard,
      items: [
        ...(isAdmin
          ? [{ name: t('nav.dashboard'), path: '/dashboard', icon: LayoutDashboard }]
          : []),
      ],
    },
    {
      id: 'academic',
      title: t('navGroups.academic'),
      icon: GraduationCap,
      items: [
        ...(isAdmin || isPrincipal
          ? [
              { name: t('nav.periods'), path: '/periods', icon: CalendarRange },
              { name: t('nav.academic'), path: '/academic', icon: GraduationCap },
            ]
          : []),
      ],
    },
    {
      id: 'thesis',
      title: t('navGroups.thesis'),
      icon: BookOpen,
      items: [
        { name: t('nav.topics'), path: '/topics', icon: BookOpen },
        {
          name: isAdmin || isPrincipal
            ? t('nav.topicManagement', 'Quản lý đề tài')
            : isTeacher
            ? t('nav.registrationsReview', 'Xét duyệt & Hướng dẫn')
            : t('nav.registrations', 'Đăng ký đề tài'),
          path: '/registrations',
          icon: ClipboardCheck,
        },
        ...(isStudent
          ? [
              { name: t('nav.teams'), path: '/teams', icon: Users2 },
              { name: t('nav.matchmaking'), path: '/matchmaking', icon: Compass },
            ]
          : []),
        { name: t('nav.progress'), path: '/progress', icon: Activity },
        { name: t('nav.reports'), path: '/reports', icon: FileText },
      ],
    },
    {
      id: 'evaluation',
      title: t('navGroups.evaluation'),
      icon: Award,
      items: [
        { name: t('nav.councils'), path: '/councils', icon: Award },
        ...(isAdmin || isPrincipal || isTeacher || isCouncil
          ? [{ name: t('nav.assessments'), path: '/assessments', icon: CheckSquare }]
          : []),
        ...(isAdmin || isPrincipal || isStudent
          ? [{ name: t('nav.results'), path: '/results', icon: BarChart3 }]
          : []),
      ],
    },
    {
      id: 'system',
      title: t('navGroups.system'),
      icon: ShieldCheck,
      items: [
        ...(isAdmin || isPrincipal || isTeacher
          ? [
              {
                name: isAdmin ? t('nav.users') : t('nav.academicStaff'),
                path: '/users',
                icon: Users,
              },
              { name: t('nav.roles'), path: '/roles', icon: ShieldCheck },
            ]
          : []),
        ...(isAdmin || isPrincipal
          ? [{ name: t('nav.systemAdmin'), path: '/admin/system', icon: Server }]
          : []),
        ...(isAdmin
          ? [{ name: t('nav.security'), path: '/admin/security', icon: ShieldAlert }]
          : []),
      ],
    },
  ].filter((group) => group.items.length > 0);

  // Accordion state
  const [openGroups, setOpenGroups] = useState(() => {
    const initialState = {};
    navGroups.forEach((g) => {
      initialState[g.id] = true;
    });
    return initialState;
  });

  // Auto-expand active group
  useEffect(() => {
    navGroups.forEach((group) => {
      const hasActive = group.items.some(
        (item) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
      );
      if (hasActive) {
        setOpenGroups((prev) => ({ ...prev, [group.id]: true }));
      }
    });
  }, [location.pathname]);

  const toggleGroup = (groupId) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const primaryRole = user?.roles?.[0];
  const roleDisplay =
    (primaryRole && t(`enums.role.${primaryRole}`)) ||
    (primaryRole && t(`roles.${primaryRole}`)) ||
    (primaryRole && primaryRole.replace('ROLE_', '')) ||
    t('roles.user');

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-slate-200/80 transition-all duration-300 flex flex-col w-64 md:translate-x-0 ${
        mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      } ${isOpen ? 'md:w-64' : 'md:w-20'}`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          {(isOpen || mobileOpen) && (
            <div className="flex items-baseline space-x-1 overflow-hidden">
              <span className="font-extrabold text-lg text-blue-600 tracking-tight">NEXUS</span>
              <span className="text-xs font-bold text-slate-800 tracking-wider">PORTAL</span>
            </div>
          )}
        </div>
        {/* Mobile close button */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 md:hidden cursor-pointer"
          title={t('common.close')}
          aria-label={t('common.close')}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Menu List */}
      <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1.5 scrollbar-thin">
        {navGroups.map((group) => {
          const isGroupOpen = !!openGroups[group.id];
          const hasActiveItem = group.items.some(
            (item) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
          );
          const GroupIcon = group.icon;

          if (!isOpen && !mobileOpen) {
            // Collapsed Mode (Only on Desktop when !isOpen)
            return (
              <div key={group.id} className="space-y-1 py-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => onCloseMobile?.()}
                      className={({ isActive }) =>
                        `flex items-center justify-center p-2.5 rounded-xl text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                        }`
                      }
                      title={item.name}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                    </NavLink>
                  );
                })}
              </div>
            );
          }

          // Expanded Mode
          return (
            <div key={group.id} className="space-y-1">
              {/* Group Trigger Button */}
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  hasActiveItem && isGroupOpen
                    ? 'text-slate-800 bg-slate-50 font-semibold'
                    : hasActiveItem && !isGroupOpen
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <GroupIcon className={`w-4 h-4 shrink-0 ${hasActiveItem && !isGroupOpen ? 'text-white' : 'text-slate-500'}`} />
                  <span className="truncate">{group.title}</span>
                </div>

                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${
                    hasActiveItem && !isGroupOpen ? 'text-white' : 'text-slate-400'
                  } ${isGroupOpen ? 'rotate-0' : '-rotate-90'}`}
                />
              </button>

              {/* Collapsible Submenu */}
              {isGroupOpen && (
                <div className="space-y-0.5 pl-4 pt-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => onCloseMobile?.()}
                        className={({ isActive }) =>
                          `flex items-center space-x-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                            isActive
                              ? 'bg-blue-50 text-blue-600 font-semibold'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                          }`
                        }
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0 opacity-70" />
                        <span className="truncate">{item.name}</span>
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer User Account Box */}
      <div className="p-3 border-t border-slate-100 shrink-0 bg-white">
        <Link
          to="/profile"
          onClick={() => onCloseMobile?.()}
          className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all text-left group cursor-pointer"
          title={t('header.profileAndSettings')}
        >
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
              {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </div>
            {(isOpen || mobileOpen) && (
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {user?.username || 'user'}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {roleDisplay}
                </p>
              </div>
            )}
          </div>
          {(isOpen || mobileOpen) && (
            <ChevronsUpDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 shrink-0" />
          )}
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;

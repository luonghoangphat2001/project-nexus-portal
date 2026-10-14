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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n/LanguageContext';

export const Sidebar = ({ isOpen }) => {
  const { user, hasRole } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  const isStudent = hasRole('ROLE_USER');
  const isAdmin = hasRole('ROLE_ADMIN');
  const isPrincipal = hasRole('ROLE_PRINCIPAL');
  const isTeacher = hasRole('ROLE_TEACHER');
  const isCouncil = hasRole('ROLE_COUNCIL');

  const navGroups = [
    {
      id: 'overview',
      title: t('navGroups.overview'),
      items: [
        { name: t('nav.dashboard'), path: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      id: 'academic',
      title: t('navGroups.academic'),
      items: [
        { name: t('nav.periods'), path: '/periods', icon: CalendarRange },
        { name: t('nav.academic'), path: '/academic', icon: GraduationCap },
      ],
    },
    {
      id: 'thesis',
      title: t('navGroups.thesis'),
      items: [
        { name: t('nav.topics'), path: '/topics', icon: BookOpen },
        { name: t('nav.registrations'), path: '/registrations', icon: ClipboardCheck },
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

  // Accordion state: by default all accessible groups are expanded
  const [openGroups, setOpenGroups] = useState(() => {
    const initialState = {};
    navGroups.forEach((g) => {
      initialState[g.id] = true;
    });
    return initialState;
  });

  // Auto-expand group when user navigates to a child route
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
    (primaryRole && t(`roles.${primaryRole}`)) ||
    (primaryRole && primaryRole.replace('ROLE_', '')) ||
    t('roles.user');

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-[#ebedf2] transition-all duration-300 flex flex-col ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-[#ebedf2] shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          {isOpen && (
            <div className="flex items-baseline space-x-1.5 overflow-hidden">
              <span className="font-bold text-lg text-indigo-600 tracking-tight">Nexus</span>
              <span className="text-xs font-semibold text-slate-700">Portal</span>
            </div>
          )}
        </div>
      </div>

      {/* Profile Card / Clickable Avatar */}
      {isOpen ? (
        <div className="p-3 border-b border-[#ebedf2] shrink-0">
          <Link
            to="/profile"
            className="p-2.5 rounded-xl border border-slate-100 flex items-center space-x-3 hover:bg-slate-50/90 hover:border-indigo-100 transition-all group"
            title={t('header.profileAndSettings')}
          >
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-xs group-hover:shadow-md transition-shadow">
                {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate leading-tight group-hover:text-indigo-600 transition-colors">
                {user?.fullName || user?.username || 'Nexus User'}
              </p>
              <p className="text-[11px] font-medium text-slate-400 truncate mt-0.5">
                {roleDisplay}
              </p>
            </div>
          </Link>
        </div>
      ) : (
        <div className="py-3 flex justify-center border-b border-[#ebedf2] shrink-0">
          <Link
            to="/profile"
            className="relative p-1 rounded-xl hover:bg-slate-50 transition-colors group"
            title={`${user?.fullName || 'User'} (${roleDisplay}) - ${t('header.profileAndSettings')}`}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-xs group-hover:scale-105 transition-transform">
              {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </div>
            <span className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
          </Link>
        </div>
      )}

      {/* Navigation Groups */}
      <div className="flex-1 py-3 px-3 overflow-y-auto space-y-2">
        {navGroups.map((group, groupIndex) => {
          const isGroupOpen = !!openGroups[group.id];
          const hasActiveItem = group.items.some(
            (item) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
          );

          if (!isOpen) {
            // Collapsed Sidebar View
            return (
              <div key={group.id} className="space-y-1">
                {groupIndex > 0 && <div className="my-2 mx-2 border-t border-slate-100" />}
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center justify-center p-2.5 rounded-xl text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-600 font-bold shadow-xs'
                            : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
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

          // Expanded Sidebar View with Dropdown / Accordion
          return (
            <div key={group.id} className="space-y-1">
              {/* Group Header Button */}
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors select-none group ${
                  hasActiveItem && !isGroupOpen
                    ? 'text-indigo-600 bg-indigo-50/60'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="truncate">{group.title}</span>
                <div className="flex items-center space-x-1.5">
                  {/* Subtle active indicator dot if group is closed but contains the active route */}
                  {!isGroupOpen && hasActiveItem && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                  )}
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${
                      isGroupOpen ? 'rotate-0' : '-rotate-90'
                    }`}
                  />
                </div>
              </button>

              {/* Group Items (Collapsible) */}
              {isGroupOpen && (
                <div className="space-y-0.5 pl-1 transition-all duration-200">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                          `flex items-center px-3 py-2 rounded-xl text-xs font-medium transition-all space-x-3 ${
                            isActive
                              ? 'bg-indigo-50 text-indigo-600 font-bold shadow-xs'
                              : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                          }`
                        }
                      >
                        <Icon className="w-4 h-4 shrink-0" />
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
    </aside>
  );
};

export default Sidebar;

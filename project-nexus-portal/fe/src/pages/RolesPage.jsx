import React, { useEffect, useState } from 'react';
import { roleService } from '../services/roleService';
import { useTranslation } from '../i18n/LanguageContext';
import {
  ShieldCheck,
  Check,
  X,
  Users,
  Award,
  BookOpen,
  Settings,
  ShieldAlert,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { StatusBadge } from '../components/common/CommonUi';

export const RolesPage = () => {
  const { t } = useTranslation();
  const [rolesData, setRolesData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await roleService.getAllRoles();
      if (res && res.data) {
        setRolesData(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.error('Error fetching roles', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const rolesConfig = [
    {
      name: 'ROLE_ADMIN',
      displayName: t('enums.role.ROLE_ADMIN'),
      description: t('rolesPage.roleAdminDesc'),
      permissions: [
        'Full management of user accounts and role assignments',
        'Academic master data administration (Faculties, Departments, Majors, Cohorts)',
        'System runtime configuration and server performance monitoring',
        'Inspect and export security audit trail logs',
        'Lock/unlock user accounts and perform password resets',
      ],
      icon: <ShieldAlert className="w-5 h-5 text-rose-600" />,
    },
    {
      name: 'ROLE_PRINCIPAL',
      displayName: t('enums.role.ROLE_PRINCIPAL'),
      description: t('rolesPage.rolePrincipalDesc'),
      permissions: [
        'Review and approve departmental capstone topics',
        'Schedule and manage topic registration periods',
        'Monitor capstone student team progress within department',
        'Access departmental faculty instructor lists',
        'Generate academic summary and statistical reports',
      ],
      icon: <Award className="w-5 h-5 text-amber-600" />,
    },
    {
      name: 'ROLE_TEACHER',
      displayName: t('enums.role.ROLE_TEACHER'),
      description: t('rolesPage.roleTeacherDesc'),
      permissions: [
        'Propose and update research topics and requirements',
        'Assign secondary co-advisors to supervised topics',
        'Approve or decline student team topic applications',
        'Monitor milestone deliverables and guide capstone teams',
      ],
      icon: <BookOpen className="w-5 h-5 text-blue-600" />,
    },
    {
      name: 'ROLE_COUNCIL',
      displayName: t('enums.role.ROLE_COUNCIL'),
      description: t('rolesPage.roleCouncilDesc'),
      permissions: [
        'Access and inspect assigned capstone project deliverables',
        'Evaluate defense presentations and project validity',
        'Submit official defense review scores and assessment criteria',
      ],
      icon: <Sparkles className="w-5 h-5 text-[#b66dff]" />,
    },
    {
      name: 'ROLE_USER',
      displayName: t('enums.role.ROLE_USER'),
      description: t('rolesPage.roleUserDesc'),
      permissions: [
        'Browse, filter, and compare up to 3 capstone topics',
        'Form and manage student teams (1 to 3 members)',
        'Send team invitations and join requests',
        'Apply for capstone topics during active registration periods',
        'Publish and discover teammate requests on matchmaking board',
      ],
      icon: <Users className="w-5 h-5 text-emerald-600" />,
    },
  ];

  // Permissions Matrix
  const matrixFeatures = [
    { title: t('rolesPage.features.rbac'), admin: true, principal: false, teacher: false, council: false, student: false },
    { title: t('rolesPage.features.academic'), admin: true, principal: true, teacher: false, council: false, student: false },
    { title: t('rolesPage.features.security'), admin: true, principal: false, teacher: false, council: false, student: false },
    { title: t('rolesPage.features.periods'), admin: true, principal: true, teacher: false, council: false, student: false },
    { title: t('rolesPage.features.topics'), admin: true, principal: true, teacher: true, council: false, student: false },
    { title: t('rolesPage.features.councils'), admin: true, principal: true, teacher: false, council: true, student: false },
    { title: t('rolesPage.features.teams'), admin: false, principal: false, teacher: false, council: false, student: true },
    { title: t('rolesPage.features.matchmaking'), admin: false, principal: false, teacher: false, council: false, student: true },
  ];

  const getUserCount = (roleName) => {
    const found = rolesData.find((r) => r.name === roleName);
    return found ? found.userCount : 0;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-[#b66dff]" />
            {t('rolesPage.title')}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {t('rolesPage.subtitle')}
          </p>
        </div>

        <button
          onClick={fetchRoles}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {t('rolesPage.refresh')}
        </button>
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rolesConfig.map((role) => {
          const userCount = getUserCount(role.name);
          return (
            <div
              key={role.name}
              className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {role.icon}
                    <StatusBadge value={role.name} type="role" />
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1 font-mono">
                    <Users className="w-3.5 h-3.5 text-[#b66dff]" />
                    {userCount} {t('rolesPage.usersCount')}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-800 mb-1">{role.displayName}</h3>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">{role.description}</p>

                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {t('rolesPage.grantedPrivileges')}
                  </p>
                  <ul className="space-y-1.5">
                    {role.permissions.map((perm, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{perm}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Permissions Matrix */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Settings className="w-5 h-5 text-[#b66dff]" />
          <h2 className="text-lg font-bold text-slate-800">{t('rolesPage.matrixTitle')}</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                <th className="py-3 px-4">{t('rolesPage.colFeature')}</th>
                <th className="py-3 px-4 text-center">{t('rolesPage.colAdmin')}</th>
                <th className="py-3 px-4 text-center">{t('rolesPage.colPrincipal')}</th>
                <th className="py-3 px-4 text-center">{t('rolesPage.colTeacher')}</th>
                <th className="py-3 px-4 text-center">{t('rolesPage.colCouncil')}</th>
                <th className="py-3 px-4 text-center">{t('rolesPage.colStudent')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {matrixFeatures.map((f, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-semibold text-slate-700">{f.title}</td>
                  <td className="py-3 px-4 text-center">
                    {f.admin ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {f.principal ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {f.teacher ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {f.council ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {f.student ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RolesPage;

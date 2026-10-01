import React, { useEffect, useState } from 'react';
import { roleService } from '../services/roleService';
import {
  ShieldCheck,
  Lock,
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

export const RolesPage = () => {
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
      displayName: 'System Administrator',
      description: 'Full authority to configure system parameters, oversee user directories, inspect security audit logs, and manage organizational structures.',
      permissions: [
        'Full management of user accounts and role assignments',
        'Academic master data administration (Faculties, Departments, Majors, Cohorts)',
        'System runtime configuration and server performance monitoring',
        'Inspect and export security audit trail logs',
        'Lock/unlock user accounts and perform password resets',
      ],
      badgeStyle: 'bg-red-100 text-red-800 border-red-200',
      icon: <ShieldAlert className="w-5 h-5 text-red-600" />,
    },
    {
      name: 'ROLE_PRINCIPAL',
      displayName: 'Dean / Department Head',
      description: 'Approves capstone graduation topics, manages registration periods, oversees department faculty instructors, and reviews academic milestones.',
      permissions: [
        'Review and approve departmental capstone topics',
        'Schedule and manage topic registration periods',
        'Monitor capstone student team progress within department',
        'Access departmental faculty instructor lists',
        'Generate academic summary and statistical reports',
      ],
      badgeStyle: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: <Award className="w-5 h-5 text-amber-600" />,
    },
    {
      name: 'ROLE_TEACHER',
      displayName: 'Lecturer & Thesis Advisor',
      description: 'Proposes capstone topics, appoints co-advisors, reviews student group registration applications, and mentors thesis teams.',
      permissions: [
        'Propose and update research topics and requirements',
        'Assign secondary co-advisors to supervised topics',
        'Approve or decline student team topic applications',
        'Monitor milestone deliverables and guide capstone teams',
      ],
      badgeStyle: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: <BookOpen className="w-5 h-5 text-blue-600" />,
    },
    {
      name: 'ROLE_COUNCIL',
      displayName: 'Evaluation Council',
      description: 'Reviews thesis submissions, scores deliverables, conducts defense examinations, and submits final capstone defense remarks.',
      permissions: [
        'Access and inspect assigned capstone project deliverables',
        'Evaluate defense presentations and project validity',
        'Submit official defense review scores and assessment criteria',
      ],
      badgeStyle: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: <Sparkles className="w-5 h-5 text-purple-600" />,
    },
    {
      name: 'ROLE_USER',
      displayName: 'Student / Candidate',
      description: 'Searches and compares capstone topics, creates student teams (1-3 members), applies for registrations, and posts on matchmaking boards.',
      permissions: [
        'Browse, filter, and compare up to 3 capstone topics',
        'Form and manage student teams (1 to 3 members)',
        'Send team invitations and join requests',
        'Apply for capstone topics during active registration periods',
        'Publish and discover teammate requests on matchmaking board',
      ],
      badgeStyle: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      icon: <Users className="w-5 h-5 text-emerald-600" />,
    },
  ];

  // Permissions Matrix
  const matrixFeatures = [
    { title: 'User Directory & Access Control (RBAC)', admin: true, principal: false, teacher: false, council: false, student: false },
    { title: 'Academic Master Data (Faculties & Depts)', admin: true, principal: true, teacher: false, council: false, student: false },
    { title: 'System Parameters & Security Audit Logs', admin: true, principal: false, teacher: false, council: false, student: false },
    { title: 'Registration Periods & Topic Approval', admin: true, principal: true, teacher: false, council: false, student: false },
    { title: 'Capstone Topic Proposing & Advising', admin: true, principal: true, teacher: true, council: false, student: false },
    { title: 'Council Evaluation & Thesis Defense Scoring', admin: true, principal: true, teacher: false, council: true, student: false },
    { title: 'Team Formation & Topic Application', admin: false, principal: false, teacher: false, council: false, student: true },
    { title: 'Matchmaking Board & Teammate Search', admin: false, principal: false, teacher: false, council: false, student: true },
  ];

  const getUserCount = (roleName) => {
    const found = rolesData.find((r) => r.name === roleName);
    return found ? found.userCount : 0;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-indigo-600" />
            Roles & Permissions Matrix (RBAC)
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            System privileges, data access boundaries, and assigned user counts across system roles
          </p>
        </div>

        <button
          onClick={fetchRoles}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rolesConfig.map((role) => {
          const userCount = getUserCount(role.name);
          return (
            <div
              key={role.name}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {role.icon}
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${role.badgeStyle}`}>
                      {role.name}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-indigo-500" />
                    {userCount} users
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-800 mb-1">{role.displayName}</h3>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">{role.description}</p>

                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Granted Privileges:</p>
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
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Settings className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-800">Permissions Matrix</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-bold text-slate-500 uppercase">
                <th className="py-3 px-4">System Feature</th>
                <th className="py-3 px-4 text-center">Admin</th>
                <th className="py-3 px-4 text-center">Dean / Dept Head</th>
                <th className="py-3 px-4 text-center">Teacher</th>
                <th className="py-3 px-4 text-center">Council</th>
                <th className="py-3 px-4 text-center">Student</th>
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

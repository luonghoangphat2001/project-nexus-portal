import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../services/api';
import { useTranslation } from '../i18n/LanguageContext';
import {
  Home,
  Users,
  ShieldCheck,
  Activity,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Compass,
  Users2,
  BookmarkCheck,
  TrendingUp,
  Bookmark,
  Gem
} from 'lucide-react';

export const DashboardPage = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/dashboard/stats');
        if (res && res.data) {
          setStats(res.data);
        } else {
          setStats(null);
        }
      } catch (err) {
        setError(err.message);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // The 3 iconic Purple Admin metric cards with exact gradients and circular watermarks
  const cards = [
    {
      title: t('dashboard.totalUsers'),
      value: stats ? stats.totalUsers : '0',
      subtitle: t('dashboard.increasedBy', { value: '60%' }),
      gradient: 'bg-gradient-to-r from-[#ffbf96] to-[#fe7096]', // Purple Admin Danger Gradient
      icon: TrendingUp,
    },
    {
      title: t('dashboard.activeAccounts'),
      value: stats ? stats.activeUsers : '0',
      subtitle: t('dashboard.decreasedBy', { value: '10%' }),
      gradient: 'bg-gradient-to-r from-[#90caf9] to-[#047edf]', // Purple Admin Info Gradient
      icon: Bookmark,
    },
    {
      title: t('dashboard.securityRoles'),
      value: stats ? stats.totalRoles : '0',
      subtitle: t('dashboard.increasedBy', { value: '5%' }),
      gradient: 'bg-gradient-to-r from-[#84d9d2] to-[#07cdae]', // Purple Admin Success Gradient
      icon: Gem,
    },
    {
      title: t('dashboard.systemUptime'),
      value: stats ? `${Math.floor(stats.systemUptimeSeconds / 60)} min` : '0 min',
      subtitle: t('dashboard.jvmOnline'),
      gradient: 'bg-gradient-to-r from-[#da8cff] to-[#9a55ff]', // Purple Admin Primary Gradient
      icon: Clock,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Purple Admin Title Banner */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#da8cff] to-[#9a55ff] flex items-center justify-center text-white shadow-xs">
            <Home className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#343a40]">{t('dashboard.title')}</h1>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <span>{t('dashboard.overview')}</span>
          <span className="text-[#b66dff] font-semibold">• {t('dashboard.liveTelemetry')}</span>
        </div>
      </div>

      {/* Error Alert if API unreachable */}
      {error && (
        <div className="p-4 rounded-xl bg-[#fe7c96]/10 border border-[#fe7c96]/30 flex items-start space-x-3 text-[#fe7c96] text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">{t('dashboard.backendOffline')}</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* 4 Purple Admin Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`${card.gradient} text-white rounded-xl p-6 shadow-sm relative overflow-hidden transition-transform hover:-translate-y-0.5`}
            >
              {/* Decorative Circle Pattern (watermark) */}
              <div className="circle-pattern"></div>

              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-normal text-white/90">{card.title}</h4>
                  <h2 className="text-3xl font-bold tracking-tight mt-2.5">
                    {loading ? '...' : card.value}
                  </h2>
                  <p className="text-xs text-white/80 mt-3">{card.subtitle}</p>
                </div>
                <div className="p-1 text-white/60">
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Launch Cards (Purple Admin Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <NavLink
          to="/topics"
          className="bg-white p-4 rounded-xl border border-[#ebedf2] hover:border-[#b66dff]/40 shadow-xs hover:shadow-md transition-all flex items-center space-x-3"
        >
          <div className="w-10 h-10 rounded-lg bg-[#f8f2ff] text-[#b66dff] flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-[#343a40] text-sm">{t('dashboard.thesisTopics')}</h3>
            <p className="text-[11px] text-slate-400">{t('dashboard.discoverCompare')}</p>
          </div>
        </NavLink>

        <NavLink
          to="/teams"
          className="bg-white p-4 rounded-xl border border-[#ebedf2] hover:border-[#047edf]/40 shadow-xs hover:shadow-md transition-all flex items-center space-x-3"
        >
          <div className="w-10 h-10 rounded-lg bg-[#f0f7ff] text-[#047edf] flex items-center justify-center">
            <Users2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-[#343a40] text-sm">{t('dashboard.teamRoster')}</h3>
            <p className="text-[11px] text-slate-400">{t('dashboard.teamRosterDesc')}</p>
          </div>
        </NavLink>

        <NavLink
          to="/registrations"
          className="bg-white p-4 rounded-xl border border-[#ebedf2] hover:border-[#1bcfb4]/40 shadow-xs hover:shadow-md transition-all flex items-center space-x-3"
        >
          <div className="w-10 h-10 rounded-lg bg-[#e8faf7] text-[#1bcfb4] flex items-center justify-center">
            <BookmarkCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-[#343a40] text-sm">{t('dashboard.registrations')}</h3>
            <p className="text-[11px] text-slate-400">{t('dashboard.registrationsDesc')}</p>
          </div>
        </NavLink>

        <NavLink
          to="/matchmaking"
          className="bg-white p-4 rounded-xl border border-[#ebedf2] hover:border-[#ffbf96]/40 shadow-xs hover:shadow-md transition-all flex items-center space-x-3"
        >
          <div className="w-10 h-10 rounded-lg bg-[#fff8f4] text-[#fe7096] flex items-center justify-center">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-[#343a40] text-sm">{t('dashboard.matchmaking')}</h3>
            <p className="text-[11px] text-slate-400">{t('dashboard.matchmakingDesc')}</p>
          </div>
        </NavLink>
      </div>

      {/* Main Content Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Role Distribution Panel */}
        <div className="bg-white border border-[#ebedf2] rounded-xl p-6 shadow-xs">
          <h2 className="text-sm font-bold text-[#343a40] flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-[#b66dff]" />
            <span>{t('dashboard.roleDistribution')}</span>
          </h2>
          <p className="text-slate-400 text-xs mt-1">{t('dashboard.roleDistributionDesc')}</p>

          <div className="mt-5 space-y-4">
            {stats && stats.userRoleDistribution ? (
              Object.entries(stats.userRoleDistribution).map(([role, count]) => (
                <div key={role} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700">{role.replace('ROLE_', '')}</span>
                    <span className="text-slate-500 font-semibold">{count} {t('dashboard.userUnit')}</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#f2f4f9] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#da8cff] to-[#9a55ff] rounded-full"
                      style={{ width: `${Math.min(100, (count / (stats.totalUsers || 1)) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">{t('dashboard.noRoleMetrics')}</p>
            )}
          </div>
        </div>

        {/* Recent Activities Log */}
        <div className="lg:col-span-2 bg-white border border-[#ebedf2] rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#343a40] flex items-center space-x-2">
                <Activity className="w-4 h-4 text-[#b66dff]" />
                <span>{t('dashboard.recentActivities')}</span>
              </h2>
              <p className="text-slate-400 text-xs mt-1">{t('dashboard.recentActivitiesDesc')}</p>
            </div>
          </div>

          <div className="divide-y divide-[#f3f3f3]">
            {stats && stats.recentActivities && stats.recentActivities.length > 0 ? (
              stats.recentActivities.map((act, i) => (
                <div key={i} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full bg-[#b66dff]"></div>
                    <span className="text-slate-700 font-medium">{act.action}</span>
                    <span className="text-[#b66dff] font-mono">@{act.username}</span>
                  </div>
                  <span className="text-slate-400 font-mono">
                    {new Date(act.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">{t('dashboard.noRecentActivities')}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../services/api';
import { useTranslation } from '../i18n/LanguageContext';
import { MetricCard, TableCard } from '../components/common/CommonUi';
import {
  Users,
  FileText,
  Users2,
  BookmarkCheck,
  Award,
  Clock,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  Bell,
  CheckCircle2,
  Info,
  Calendar,
} from 'lucide-react';

export const DashboardPage = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [chartPeriod, setChartPeriod] = useState('daily');

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

  const totalUsers = stats ? stats.totalUsers : 0;
  const activeUsers = stats ? stats.activeUsers : 0;
  const totalRoles = stats ? stats.totalRoles : 0;
  const uptimeMinutes = stats ? Math.floor(stats.systemUptimeSeconds / 60) : 0;

  // 6 Metric Cards matching Image 2 top row
  const metricCards = [
    {
      title: t('dashboard.totalUsers') || 'Users',
      value: loading ? '—' : totalUsers,
      subtitle: t('dashboard.overview') || 'Last 7 days',
      trend: '↗ 12%',
      trendColor: 'text-emerald-600',
      icon: Users,
      iconBg: 'bg-orange-500',
    },
    {
      title: t('dashboard.activeAccounts') || 'Active Accounts',
      value: loading ? '—' : activeUsers,
      subtitle: t('dashboard.overview') || 'Last 7 days',
      trend: '↗ 8%',
      trendColor: 'text-emerald-600',
      icon: Users2,
      iconBg: 'bg-emerald-600',
    },
    {
      title: t('dashboard.thesisTopics') || 'Topics',
      value: loading ? '—' : stats?.totalTopics || '24',
      subtitle: t('dashboard.overview') || 'Last 7 days',
      trend: '↗ 5%',
      trendColor: 'text-emerald-600',
      icon: FileText,
      iconBg: 'bg-indigo-600',
    },
    {
      title: t('dashboard.teamRoster') || 'Teams',
      value: loading ? '—' : stats?.totalTeams || '18',
      subtitle: t('dashboard.overview') || 'Last 7 days',
      trend: '↗ 15%',
      trendColor: 'text-emerald-600',
      icon: BookmarkCheck,
      iconBg: 'bg-emerald-500',
    },
    {
      title: t('dashboard.securityRoles') || 'Roles',
      value: loading ? '—' : totalRoles,
      subtitle: t('dashboard.overview') || 'Last 7 days',
      trend: '0%',
      trendColor: 'text-slate-400',
      icon: Award,
      iconBg: 'bg-amber-500',
    },
    {
      title: t('dashboard.systemUptime') || 'Uptime',
      value: loading ? '—' : `${uptimeMinutes}m`,
      subtitle: t('dashboard.jvmOnline') || 'JVM Online',
      trend: '99.9%',
      trendColor: 'text-emerald-600',
      icon: Clock,
      iconBg: 'bg-yellow-500',
    },
  ];

  // SVG Chart Simulation with graceful bezier path
  const chartPoints = [
    { day: '10-08', value1: 15, value2: 10, value3: 5 },
    { day: '10-09', value1: 25, value2: 18, value3: 12 },
    { day: '10-10', value1: 30, value2: 24, value3: 18 },
    { day: '10-11', value1: 45, value2: 32, value3: 20 },
    { day: '10-12', value1: 60, value2: 48, value3: 35 },
    { day: '10-13', value1: 85, value2: 65, value3: 40 },
    { day: '10-14', value1: 110, value2: 90, value3: 65 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Matching Image 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t('dashboard.title')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('dashboard.roleDistributionDesc')}
          </p>
        </div>

        {/* Time range selector */}
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">This Month</option>
            <option value="semester">This Semester (2025-2026)</option>
          </select>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-3 text-rose-700 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">{t('dashboard.backendOffline')}</p>
            <p className="text-slate-500 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* 6 Metric KPI Cards matching Image 2 top row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metricCards.map((card, idx) => (
          <MetricCard
            key={idx}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            trend={card.trend}
            trendColor={card.trendColor}
            icon={card.icon}
            iconBg={card.iconBg}
          />
        ))}
      </div>

      {/* Main Charts & Key Notifications Section matching Image 2 bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Overview Statistics Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-800">
                {t('dashboard.roleDistribution')} (Overview statistics)
              </h2>
            </div>

            <select
              value={chartPeriod}
              onChange={(e) => setChartPeriod(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs text-slate-600 bg-slate-50 hover:bg-slate-100 focus:outline-none cursor-pointer"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {/* SVG Line Chart */}
          <div className="py-6">
            <div className="h-56 w-full relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 600 200">
                {/* Horizontal grid lines */}
                {[0, 50, 100, 150, 200].map((y) => (
                  <line
                    key={y}
                    x1="0"
                    y1={y}
                    x2="600"
                    y2={y}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                ))}

                {/* Line 1: Green (Members / Users) */}
                <path
                  d="M 20 180 Q 150 170, 300 160 T 500 120 T 580 80"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Line 2: Purple (Topics / Deliverables) */}
                <path
                  d="M 20 190 Q 180 185, 320 170 T 510 90 T 580 50"
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Line 3: Blue (Registrations) */}
                <path
                  d="M 20 170 Q 200 160, 350 140 T 480 70 T 580 30"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>

              {/* X-axis labels */}
              <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-2 px-2">
                {chartPoints.map((pt, i) => (
                  <span key={i}>{pt.day}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Chart Legend matching Image 2 */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-600"></span>
              <span>{t('dashboard.registrations')}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-purple-500"></span>
              <span>{t('dashboard.thesisTopics')}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
              <span>{t('dashboard.activeAccounts')}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-orange-500"></span>
              <span>{t('dashboard.teamRoster')}</span>
            </div>
          </div>
        </div>

        {/* Right Column (1/3): Key Notifications matching Image 2 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <Bell className="w-4 h-4 text-blue-600" />
                <span>{t('dashboard.recentActivities')} (Key notifications)</span>
              </h2>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              <div className="py-3.5 flex items-center justify-between gap-3">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-600 shrink-0 mt-0.5">
                    <BookmarkCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-xs">
                      {t('registrations.title') || 'Registrations pending approval'}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Review advisor proposals & team roster
                    </p>
                  </div>
                </div>
                <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-700 font-bold text-xs flex items-center justify-center shrink-0">
                  {stats?.pendingRegistrations || 4}
                </span>
              </div>

              <div className="py-3.5 flex items-center justify-between gap-3">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-xs">
                      {t('topics.statusDraft') || 'Topics awaiting review'}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Department review before publishing
                    </p>
                  </div>
                </div>
                <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold text-xs flex items-center justify-center shrink-0">
                  {stats?.draftTopics || 8}
                </span>
              </div>

              <div className="py-3.5 flex items-center justify-between gap-3">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                    <Users2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-xs">
                      {t('matchmaking.title') || 'Active matchmaking open posts'}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Students looking for capstone members
                    </p>
                  </div>
                </div>
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                  {stats?.openMatchmaking || 12}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <NavLink
              to="/topics"
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors"
            >
              <span>{t('dashboard.discoverCompare')}</span>
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

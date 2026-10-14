import React, { useEffect, useState, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../services/api';
import { useTranslation } from '../i18n/LanguageContext';
import { MetricCard, PageHeader, buttonClass } from '../components/common/CommonUi';
import {
  Users,
  FileText,
  Users2,
  BookmarkCheck,
  Award,
  Clock,
  TrendingUp,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Info,
  Calendar,
  RefreshCw,
  PieChart as PieChartIcon,
} from 'lucide-react';

export const DashboardPage = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [chartMetric, setChartMetric] = useState('all'); // 'all', 'users', 'topics', 'registrations'

  const fetchStats = useCallback(async () => {
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
      setError(err.message || t('common.error'));
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const totalUsers = stats?.totalUsers || 0;
  const activeUsers = stats?.activeUsers || 0;
  const totalRoles = stats?.totalRoles || 0;
  const totalTopics = stats?.totalTopics || 0;
  const totalTeams = stats?.totalTeams || 0;
  const totalRegistrations = stats?.totalRegistrations || 0;
  const uptimeMinutes = stats ? Math.floor(stats.systemUptimeSeconds / 60) : 0;

  // 6 Metric Cards matching Image 2 with 100% REAL application data
  const metricCards = [
    {
      title: t('dashboard.totalUsers', 'Tổng người dùng'),
      value: loading ? '—' : totalUsers,
      subtitle: `${activeUsers} ${t('dashboard.activeOnline', 'đang hoạt động')}`,
      trend: activeUsers > 0 && totalUsers > 0 ? `${Math.round((activeUsers / totalUsers) * 100)}%` : '0%',
      trendColor: 'text-emerald-600',
      icon: Users,
      iconBg: 'bg-blue-600',
    },
    {
      title: t('dashboard.activeAccounts', 'Tài khoản hoạt động'),
      value: loading ? '—' : activeUsers,
      subtitle: t('dashboard.activeOnline', 'Đang hoạt động'),
      trend: `${activeUsers}/${totalUsers}`,
      trendColor: 'text-emerald-600',
      icon: Users2,
      iconBg: 'bg-emerald-600',
    },
    {
      title: t('dashboard.thesisTopics', 'Đề tài khóa luận'),
      value: loading ? '—' : totalTopics,
      subtitle: `${totalRegistrations} ${t('dashboard.registrationsCount', 'lượt đăng ký')}`,
      trend: `${totalTopics} ${t('dashboard.metricTopics', 'đề tài')}`,
      trendColor: 'text-blue-600',
      icon: FileText,
      iconBg: 'bg-indigo-600',
    },
    {
      title: t('dashboard.teamRoster', 'Nhóm sinh viên'),
      value: loading ? '—' : totalTeams,
      subtitle: `${totalTeams} ${t('dashboard.teamsCount', 'nhóm đã lập')}`,
      trend: `${totalTeams} ${t('dashboard.teamRoster', 'nhóm')}`,
      trendColor: 'text-amber-600',
      icon: BookmarkCheck,
      iconBg: 'bg-amber-600',
    },
    {
      title: t('dashboard.securityRoles', 'Vai trò hệ thống'),
      value: loading ? '—' : totalRoles,
      subtitle: t('dashboard.rbacMatrix', 'Phân quyền RBAC'),
      trend: `${totalRoles} roles`,
      trendColor: 'text-purple-600',
      icon: Award,
      iconBg: 'bg-purple-600',
    },
    {
      title: t('dashboard.systemUptime', 'Thời gian hoạt động'),
      value: loading ? '—' : `${uptimeMinutes}m`,
      subtitle: t('dashboard.jvmOnline', 'Máy chủ JVM hoạt động'),
      trend: t('dashboard.systemReady', '100% Sẵn sàng'),
      trendColor: 'text-emerald-600',
      icon: Clock,
      iconBg: 'bg-teal-600',
    },
  ];

  // Dynamic Chart Points calculated from real backend timeline data
  const timelineData = stats?.timelineData || [];
  const maxTimelineValue = Math.max(
    ...timelineData.map(d => Math.max(Number(d.users || 0), Number(d.topics || 0), Number(d.registrations || 0))),
    10
  );

  // Helper to generate dynamic SVG polyline path based on real numbers
  const getSvgPoints = (key) => {
    if (!timelineData.length) return '';
    const width = 560;
    const height = 160;
    const paddingLeft = 30;
    const paddingTop = 20;

    const stepX = timelineData.length > 1 ? (width - paddingLeft) / (timelineData.length - 1) : 0;

    return timelineData.map((d, index) => {
      const val = Number(d[key] || 0);
      const x = paddingLeft + index * stepX;
      const y = paddingTop + height - (val / maxTimelineValue) * height;
      return `${x},${y}`;
    }).join(' ');
  };

  const notifications = stats?.recentNotifications || [];
  const activities = stats?.recentActivities || [];
  const roleDistribution = stats?.userRoleDistribution || {};
  const totalRoleCount = Object.values(roleDistribution).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={t('dashboard.title')}
        description={t('dashboard.roleDistributionDesc')}
        action={
          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="7d">{t('dashboard.range7d', '7 ngày qua')}</option>
              <option value="30d">{t('dashboard.range30d', '30 ngày qua')}</option>
              <option value="semester">{t('dashboard.rangeSemester', 'Học kỳ này (2025-2026)')}</option>
            </select>

            <button
              onClick={fetchStats}
              disabled={loading}
              className={buttonClass('secondary')}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{t('reports.refresh', 'Làm mới')}</span>
            </button>
          </div>
        }
      />

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-3 text-rose-700 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">{t('dashboard.backendOffline')}</p>
            <p className="text-slate-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* 6 Metric KPI Cards matching Image 2 */}
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

      {/* Main Charts & Key Notifications Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Dynamic Overview Statistics Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">
                {t('dashboard.activityMetricsTitle', 'Thống kê hoạt động thực tế')}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setChartMetric('all')}
                className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition ${chartMetric === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {t('dashboard.metricAll', 'Tất cả')}
              </button>
              <button
                onClick={() => setChartMetric('users')}
                className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition ${chartMetric === 'users' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {t('dashboard.metricUsers', 'Người dùng')}
              </button>
              <button
                onClick={() => setChartMetric('topics')}
                className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition ${chartMetric === 'topics' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {t('dashboard.metricTopics', 'Đề tài')}
              </button>
              <button
                onClick={() => setChartMetric('registrations')}
                className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition ${chartMetric === 'registrations' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {t('dashboard.metricRegistrations', 'Đăng ký')}
              </button>
            </div>
          </div>

          {/* Real Dynamic SVG Line Chart */}
          <div className="py-4">
            {timelineData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-sm text-slate-400">
                {t('dashboard.noTimelineData', 'Chưa có dữ liệu hoạt động trong khoảng thời gian này')}
              </div>
            ) : (
              <div className="h-56 w-full relative">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 600 200">
                  {/* Grid lines */}
                  {[0, 50, 100, 150].map((y) => (
                    <line
                      key={y}
                      x1="30"
                      y1={y + 20}
                      x2="590"
                      y2={y + 20}
                      stroke="#f1f5f9"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                  ))}

                  {/* Line 1: Green (Users) */}
                  {(chartMetric === 'all' || chartMetric === 'users') && (
                    <polyline
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={getSvgPoints('users')}
                    />
                  )}

                  {/* Line 2: Blue (Topics) */}
                  {(chartMetric === 'all' || chartMetric === 'topics') && (
                    <polyline
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={getSvgPoints('topics')}
                    />
                  )}

                  {/* Line 3: Indigo (Registrations) */}
                  {(chartMetric === 'all' || chartMetric === 'registrations') && (
                    <polyline
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={getSvgPoints('registrations')}
                    />
                  )}
                </svg>

                {/* X-axis labels */}
                <div className="flex justify-between text-xs font-mono text-slate-500 mt-2 pl-6 pr-2">
                  {timelineData.map((d, idx) => (
                    <span key={idx}>{d.day}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Chart Legends */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 text-sm">
            <div className="flex items-center space-x-5">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="text-slate-700 font-medium">
                  {t('dashboard.metricUsers', 'Người dùng')} ({totalUsers})
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <span className="text-slate-700 font-medium">
                  {t('dashboard.metricTopics', 'Đề tài')} ({totalTopics})
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                <span className="text-slate-700 font-medium">
                  {t('dashboard.metricRegistrations', 'Lượt đăng ký')} ({totalRegistrations})
                </span>
              </div>
            </div>
            <span className="text-xs text-slate-400">
              {t('dashboard.realDataNotice', 'Dữ liệu thực tế từ cơ sở dữ liệu Nexus')}
            </span>
          </div>
        </div>

        {/* Right Column (1/3): Key Real Notifications & System Role Distribution */}
        <div className="space-y-6">
          {/* Notifications List */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  {t('dashboard.recentNotifications', 'Thông báo mới nhất')} ({notifications.length})
                </h2>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  {t('dashboard.noNotifications', 'Không có thông báo hệ thống mới')}
                </div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 text-sm line-clamp-1">{n.title}</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : t('dashboard.justNow', 'Vừa xong')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{n.content}</p>
                    <div className="text-[11px] text-blue-600 font-medium pt-1">
                      {t('dashboard.by', 'Bởi')}: {n.authorName}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* User Role Distribution */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <PieChartIcon className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">
                {t('dashboard.accountDistribution', 'Phân bổ tài khoản')} ({totalUsers})
              </h2>
            </div>

            <div className="mt-4 space-y-3">
              {Object.entries(roleDistribution).map(([role, count]) => {
                const percent = Math.round((count / totalRoleCount) * 100);
                const roleLabel = t(`enums.role.${role}`, role.replace('ROLE_', ''));
                return (
                  <div key={role} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{roleLabel}</span>
                      <span>{count} ({percent}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        style={{ width: `${percent}%` }}
                        className="h-full bg-blue-600 rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

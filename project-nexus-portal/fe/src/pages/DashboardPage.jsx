import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { useTranslation } from '../i18n/LanguageContext';
import { formatDateTime } from '../utils/dateUtils';
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
  RefreshCw,
  PieChart as PieChartIcon,
} from 'lucide-react';

export const DashboardPage = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [chartMetric, setChartMetric] = useState('all'); // 'all', 'users', 'topics', 'registrations'
  const [hoveredIndex, setHoveredIndex] = useState(null);

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

  // Dynamic Chart Points calculated per semester directly from database API
  const timelineData = stats?.timelineData || [];
  const selectedPeriod = timelineData.find(d => String(d.periodId) === String(selectedSemester) || d.day === selectedSemester);

  const displayUsers = selectedPeriod ? selectedPeriod.users : (stats?.totalUsers || 0);
  const displayActiveUsers = stats?.activeUsers || 0;
  const displayRoles = stats?.totalRoles || 0;
  const displayTopics = selectedPeriod ? selectedPeriod.topics : (stats?.totalTopics || 0);
  const displayRegistrations = selectedPeriod ? selectedPeriod.registrations : (stats?.totalRegistrations || 0);
  const displayTeams = selectedPeriod ? (selectedPeriod.teams != null ? selectedPeriod.teams : 0) : (stats?.totalTeams || 0);
  const uptimeMinutes = stats ? Math.floor(stats.systemUptimeSeconds / 60) : 0;

  useEffect(() => {
    if (selectedSemester !== 'all') {
      const idx = timelineData.findIndex(d => String(d.periodId) === String(selectedSemester) || d.day === selectedSemester);
      if (idx !== -1) {
        setHoveredIndex(idx);
      }
    }
  }, [selectedSemester, timelineData]);

  // 6 Metric Cards with 100% REAL application data from API
  const metricCards = [
    {
      title: t('dashboard.totalUsers', 'Tổng người dùng'),
      value: loading ? '—' : displayUsers,
      subtitle: selectedPeriod
        ? `${selectedPeriod.semester || selectedPeriod.day}`
        : `${displayActiveUsers} ${t('dashboard.activeOnline', 'đang hoạt động')}`,
      trend: displayActiveUsers > 0 && displayUsers > 0 ? `${Math.round((displayActiveUsers / displayUsers) * 100)}%` : '0%',
      trendColor: 'text-emerald-600',
      icon: Users,
      iconBg: 'bg-blue-600',
    },
    {
      title: t('dashboard.activeAccounts', 'Tài khoản hoạt động'),
      value: loading ? '—' : displayActiveUsers,
      subtitle: t('dashboard.activeOnline', 'Đang hoạt động'),
      trend: `${displayActiveUsers}/${displayUsers}`,
      trendColor: 'text-emerald-600',
      icon: Users2,
      iconBg: 'bg-emerald-600',
    },
    {
      title: t('dashboard.thesisTopics', 'Đề tài khóa luận'),
      value: loading ? '—' : displayTopics,
      subtitle: `${displayRegistrations} ${t('dashboard.registrationsCount', 'lượt đăng ký')}`,
      trend: `${displayTopics} ${t('dashboard.metricTopics', 'đề tài')}`,
      trendColor: 'text-blue-600',
      icon: FileText,
      iconBg: 'bg-indigo-600',
    },
    {
      title: t('dashboard.teamRoster', 'Nhóm sinh viên'),
      value: loading ? '—' : (selectedPeriod ? (displayTeams > 0 ? displayTeams : '—') : stats?.totalTeams || 0),
      subtitle: selectedPeriod
        ? `${displayRegistrations} ${t('dashboard.registrationsCount', 'đăng ký')}`
        : `${stats?.totalTeams || 0} ${t('dashboard.teamsCount', 'nhóm đã lập')}`,
      trend: selectedPeriod ? `${displayTopics} đề tài` : `${stats?.totalTeams || 0} nhóm`,
      trendColor: 'text-amber-600',
      icon: BookmarkCheck,
      iconBg: 'bg-amber-600',
    },
    {
      title: t('dashboard.securityRoles', 'Vai trò hệ thống'),
      value: loading ? '—' : displayRoles,
      subtitle: t('dashboard.rbacMatrix', 'Phân quyền RBAC'),
      trend: `${displayRoles} roles`,
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

  const maxTimelineValue = Math.max(
    ...timelineData.map(d => Math.max(Number(d.users || 0), Number(d.topics || 0), Number(d.registrations || 0))),
    1
  );

  const chartWidth = 580;
  const chartHeight = 150;
  const paddingLeft = 40;
  const paddingTop = 25;
  const stepX = timelineData.length > 1 ? (chartWidth - paddingLeft - 20) / (timelineData.length - 1) : 0;

  const getSvgPoints = (key) => {
    if (!timelineData.length) return '';
    return timelineData.map((d, index) => {
      const val = Number(d[key] || 0);
      const x = paddingLeft + index * stepX;
      const y = paddingTop + chartHeight - (val / maxTimelineValue) * chartHeight;
      return `${x},${y}`;
    }).join(' ');
  };

  const notifications = stats?.recentNotifications || [];
  const roleDistribution = stats?.userRoleDistribution || {};
  const totalRoleCount = Object.values(roleDistribution).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={t('dashboard.titleAdmin', 'Bảng điều khiển Quản trị viên')}
        description={t('dashboard.descAdmin', 'Giám sát hạ tầng nền tảng, số liệu người dùng và phân quyền hệ thống')}
        action={
          <div className="flex items-center gap-3">
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="all">{t('dashboard.allSemesters', 'Tất cả học kỳ')}</option>
              {timelineData.map((d, idx) => (
                <option key={idx} value={d.day}>
                  {d.semester || d.day} {idx === timelineData.length - 1 ? `(Hiện tại)` : ''}
                </option>
              ))}
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
            <p className="font-semibold">{t('dashboard.backendOffline', 'Máy chủ ngoại tuyến')}</p>
            <p className="text-slate-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* 6 Metric KPI Cards */}
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
        {/* Left Column (2/3): Dynamic Overview Statistics Chart By Semester */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    {t('dashboard.activityMetricsTitle', 'Thống kê hoạt động thực tế')}
                  </h2>
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    {t('dashboard.semesterStatsBadge', 'Theo học kỳ')}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('dashboard.activityMetricsSub', 'Dữ liệu đo lường theo từng học kỳ từ cơ sở dữ liệu Nexus')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl">
              <button
                onClick={() => setChartMetric('all')}
                className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition ${chartMetric === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'}`}
              >
                {t('dashboard.metricAll', 'Tất cả')}
              </button>
              <button
                onClick={() => setChartMetric('users')}
                className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition ${chartMetric === 'users' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'}`}
              >
                {t('dashboard.metricUsers', 'Người dùng')}
              </button>
              <button
                onClick={() => setChartMetric('topics')}
                className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition ${chartMetric === 'topics' ? 'bg-blue-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'}`}
              >
                {t('dashboard.metricTopics', 'Đề tài')}
              </button>
              <button
                onClick={() => setChartMetric('registrations')}
                className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition ${chartMetric === 'registrations' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'}`}
              >
                {t('dashboard.metricRegistrations', 'Đăng ký')}
              </button>
            </div>
          </div>

          {/* Real Dynamic SVG Line Chart With Data Dots & Hover Tooltip */}
          <div className="py-4 relative">
            {timelineData.length === 0 ? (
              <div className="h-60 flex items-center justify-center text-sm text-slate-400">
                {t('dashboard.noTimelineData', 'Chưa có dữ liệu hoạt động trong khoảng thời gian này')}
              </div>
            ) : (
              <div className="h-64 w-full relative select-none">
                {/* Floating Tooltip Card */}
                {hoveredIndex !== null && timelineData[hoveredIndex] && (
                  <div
                    className="absolute pointer-events-none z-30 bg-slate-900/95 text-white rounded-xl px-3.5 py-2.5 shadow-2xl text-xs backdrop-blur-md border border-slate-700/60 transition-all duration-150"
                    style={{
                      left: `${Math.min(Math.max((paddingLeft + hoveredIndex * stepX) / chartWidth * 100, 15), 85)}%`,
                      top: '12px',
                      transform: 'translateX(-50%)',
                    }}
                  >
                    <div className="font-bold text-slate-200 border-b border-slate-700/60 pb-1 mb-1.5">
                      {timelineData[hoveredIndex].semester || timelineData[hoveredIndex].day}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-5">
                        <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Người dùng:
                        </span>
                        <span className="font-bold">{timelineData[hoveredIndex].users}</span>
                      </div>
                      <div className="flex items-center justify-between gap-5">
                        <span className="flex items-center gap-1.5 text-blue-400 font-medium">
                          <span className="w-2 h-2 rounded-full bg-blue-400"></span> Đề tài:
                        </span>
                        <span className="font-bold">{timelineData[hoveredIndex].topics}</span>
                      </div>
                      <div className="flex items-center justify-between gap-5">
                        <span className="flex items-center gap-1.5 text-indigo-400 font-medium">
                          <span className="w-2 h-2 rounded-full bg-indigo-400"></span> Lượt đăng ký:
                        </span>
                        <span className="font-bold">{timelineData[hoveredIndex].registrations}</span>
                      </div>
                    </div>
                  </div>
                )}

                <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${chartWidth} 200`}>
                  {/* Horizontal Grid lines & Y-Axis Labels */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const y = paddingTop + chartHeight - ratio * chartHeight;
                    const labelVal = Math.round(maxTimelineValue * ratio);
                    return (
                      <g key={ratio}>
                        <text
                          x={paddingLeft - 10}
                          y={y + 3.5}
                          textAnchor="end"
                          className="text-[10px] font-mono fill-slate-400"
                        >
                          {labelVal}
                        </text>
                        <line
                          x1={paddingLeft}
                          y1={y}
                          x2={chartWidth - 20}
                          y2={y}
                          stroke="#f1f5f9"
                          strokeWidth="1"
                          strokeDasharray="4 4"
                        />
                      </g>
                    );
                  })}

                  {/* Vertical hover indicator bar */}
                  {hoveredIndex !== null && (
                    <line
                      x1={paddingLeft + hoveredIndex * stepX}
                      y1={paddingTop}
                      x2={paddingLeft + hoveredIndex * stepX}
                      y2={paddingTop + chartHeight}
                      stroke="#cbd5e1"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                  )}

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

                  {/* Data Points with Circles and Value Labels */}
                  {timelineData.map((d, index) => {
                    const x = paddingLeft + index * stepX;
                    const yUsers = paddingTop + chartHeight - (Number(d.users || 0) / maxTimelineValue) * chartHeight;
                    const yTopics = paddingTop + chartHeight - (Number(d.topics || 0) / maxTimelineValue) * chartHeight;
                    const yRegs = paddingTop + chartHeight - (Number(d.registrations || 0) / maxTimelineValue) * chartHeight;
                    const isHovered = hoveredIndex === index;

                    return (
                      <g key={index}>
                        {/* Users Dot */}
                        {(chartMetric === 'all' || chartMetric === 'users') && (
                          <g>
                            <circle
                              cx={x}
                              cy={yUsers}
                              r={isHovered ? 6 : 4}
                              fill="#10b981"
                              stroke="#ffffff"
                              strokeWidth={2}
                              className="transition-all duration-150"
                            />
                            {(isHovered || chartMetric === 'users') && (
                              <text
                                x={x}
                                y={yUsers - 8}
                                textAnchor="middle"
                                className="text-[10px] font-bold fill-emerald-700"
                              >
                                {d.users}
                              </text>
                            )}
                          </g>
                        )}

                        {/* Topics Dot */}
                        {(chartMetric === 'all' || chartMetric === 'topics') && (
                          <g>
                            <circle
                              cx={x}
                              cy={yTopics}
                              r={isHovered ? 6 : 4}
                              fill="#3b82f6"
                              stroke="#ffffff"
                              strokeWidth={2}
                              className="transition-all duration-150"
                            />
                            {(isHovered || chartMetric === 'topics') && (
                              <text
                                x={x}
                                y={yTopics - 8}
                                textAnchor="middle"
                                className="text-[10px] font-bold fill-blue-700"
                              >
                                {d.topics}
                              </text>
                            )}
                          </g>
                        )}

                        {/* Registrations Dot */}
                        {(chartMetric === 'all' || chartMetric === 'registrations') && (
                          <g>
                            <circle
                              cx={x}
                              cy={yRegs}
                              r={isHovered ? 6 : 4}
                              fill="#6366f1"
                              stroke="#ffffff"
                              strokeWidth={2}
                              className="transition-all duration-150"
                            />
                            {(isHovered || chartMetric === 'registrations') && (
                              <text
                                x={x}
                                y={yRegs - 8}
                                textAnchor="middle"
                                className="text-[10px] font-bold fill-indigo-700"
                              >
                                {d.registrations}
                              </text>
                            )}
                          </g>
                        )}

                        {/* Transparent interactive vertical touch/hover strip */}
                        <rect
                          x={x - (stepX / 2 || 20)}
                          y={paddingTop}
                          width={stepX || 40}
                          height={chartHeight + 30}
                          fill="transparent"
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredIndex(index)}
                          onMouseLeave={() => setHoveredIndex(null)}
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* X-axis Semester badges */}
                <div className="flex justify-between text-xs font-medium text-slate-600 mt-2 pl-9 pr-4">
                  {timelineData.map((d, idx) => {
                    const isSelected = selectedSemester === (d.periodId || d.day) || selectedSemester === d.day;
                    const isHovered = hoveredIndex === idx;

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedSemester('all');
                            setHoveredIndex(null);
                          } else {
                            setSelectedSemester(d.periodId || d.day);
                            setHoveredIndex(idx);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg transition-all ${
                          isSelected || isHovered
                            ? 'bg-blue-600 text-white font-bold shadow-xs scale-105'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {d.day}
                      </button>
                    );
                  })}
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
                  {t('dashboard.metricUsers', 'Người dùng')} ({displayUsers})
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <span className="text-slate-700 font-medium">
                  {t('dashboard.metricTopics', 'Đề tài')} ({displayTopics})
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                <span className="text-slate-700 font-medium">
                  {t('dashboard.metricRegistrations', 'Lượt đăng ký')} ({displayRegistrations})
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
                        {n.createdAt ? formatDateTime(n.createdAt) : t('dashboard.justNow', 'Vừa xong')}
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
                {t('dashboard.accountDistribution', 'Phân bổ tài khoản')} ({displayUsers})
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

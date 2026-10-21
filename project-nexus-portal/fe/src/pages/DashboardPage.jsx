import React, { useEffect, useState, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import { localizeNotification } from '../services/notificationService';
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
  ChevronRight,
  ArrowRight,
  FolderGit2,
  ClipboardList,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

export const DashboardPage = () => {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [chartMetric, setChartMetric] = useState('all'); // 'all', 'users', 'topics', 'registrations'
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Exact role determination
  const isAdmin = user?.roles?.includes('ROLE_ADMIN');
  const isPrincipal = user?.roles?.includes('ROLE_PRINCIPAL') && !isAdmin;
  const isTeacher = user?.roles?.includes('ROLE_TEACHER') && !isAdmin && !isPrincipal;
  const isCouncil = user?.roles?.includes('ROLE_COUNCIL') && !isAdmin && !isPrincipal && !isTeacher;
  const isStudent = (user?.roles?.includes('ROLE_USER') && !isAdmin && !isPrincipal && !isTeacher && !isCouncil) || (!isAdmin && !isPrincipal && !isTeacher && !isCouncil);

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

  const scoped = stats?.scopedStats || {};

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

  // Configure 6 Metric KPI Cards tailored per Role
  let metricCards = [];

  if (isStudent) {
    metricCards = [
      {
        title: t('dashboard.studentTeam', 'Nhóm sinh viên'),
        value: loading ? '—' : (scoped.hasTeam ? scoped.teamName : t('dashboard.studentNoTeam', 'Chưa vào nhóm')),
        subtitle: scoped.hasTeam ? `${scoped.memberCount || 1} ${t('dashboard.teamMembersCount', 'thành viên')}` : t('dashboard.studentNeedTeam', 'Cần tạo hoặc tham gia nhóm'),
        trend: scoped.hasTeam ? t('dashboard.activeTeam', 'Đã tham gia') : t('dashboard.noTeamWarning', 'Chưa có nhóm'),
        trendColor: scoped.hasTeam ? 'text-emerald-600' : 'text-amber-600',
        icon: Users2,
        iconBg: 'bg-blue-600',
      },
      {
        title: t('dashboard.studentTopic', 'Đề tài khóa luận'),
        value: loading ? '—' : (scoped.topicTitle ? (scoped.topicTitle.length > 22 ? scoped.topicTitle.substring(0, 22) + '...' : scoped.topicTitle) : t('dashboard.noTopic', 'Chưa đăng ký')),
        subtitle: scoped.registrationStatus === 'APPROVED' ? t('dashboard.topicApproved', 'Đã duyệt chính thức') : scoped.registrationStatus === 'PENDING' ? t('dashboard.topicPending', 'Chờ GVHD xét duyệt') : t('dashboard.noTopicSub', 'Chưa đăng ký đề tài'),
        trend: scoped.registrationStatus === 'APPROVED' ? 'APPROVED' : (scoped.registrationStatus || 'NONE'),
        trendColor: scoped.registrationStatus === 'APPROVED' ? 'text-emerald-600' : 'text-blue-600',
        icon: FileText,
        iconBg: 'bg-indigo-600',
      },
      {
        title: t('dashboard.advisor', 'Giảng viên hướng dẫn'),
        value: loading ? '—' : (scoped.advisorName || t('dashboard.unassigned', 'Chưa phân công')),
        subtitle: scoped.topicTitle ? t('dashboard.primaryAdvisor', 'Người hướng dẫn trực tiếp') : t('dashboard.byRegisteredTopic', 'Theo đề tài đăng ký'),
        trend: scoped.advisorName && scoped.advisorName !== 'Chưa phân công' ? t('dashboard.assigned', 'Đã phân công') : t('dashboard.pending', 'Chờ cập nhật'),
        trendColor: 'text-emerald-600',
        icon: Award,
        iconBg: 'bg-emerald-600',
      },
      {
        title: t('dashboard.studentProgress', 'Tiến độ thực hiện'),
        value: loading ? '—' : `${scoped.progressPercent || 0}%`,
        subtitle: `${scoped.completedTasks || 0}/${scoped.totalTasks || 0} ${t('dashboard.tasksCompleted', 'nhiệm vụ hoàn thành')}`,
        trend: `${scoped.progressPercent || 0}%`,
        trendColor: 'text-amber-600',
        icon: TrendingUp,
        iconBg: 'bg-amber-600',
      },
      {
        title: t('dashboard.defenseSchedule', 'Lịch bảo vệ khóa luận'),
        value: loading ? '—' : (scoped.councilRoom || t('dashboard.pendingSchedule', 'Chờ xếp lịch')),
        subtitle: scoped.defenseSchedule || t('dashboard.defenseCouncil', 'Hội đồng bảo vệ'),
        trend: scoped.councilRoom && scoped.councilRoom !== 'Chưa xếp lịch' ? t('dashboard.scheduled', 'Đã xếp lịch') : t('dashboard.pending', 'Chờ lịch'),
        trendColor: 'text-purple-600',
        icon: Calendar,
        iconBg: 'bg-purple-600',
      },
      {
        title: t('dashboard.finalResult', 'Điểm tổng kết'),
        value: loading ? '—' : (scoped.finalScore != null ? `${scoped.finalScore}/10` : t('dashboard.notPublished', 'Chưa công bố')),
        subtitle: scoped.resultSummary || t('dashboard.finalScoreDesc', 'Kết quả bảo vệ khóa luận'),
        trend: scoped.passed ? t('dashboard.passed', 'ĐẠT') : (scoped.finalScore != null ? t('dashboard.failed', 'CHƯA ĐẠT') : t('dashboard.pending', 'ĐANG CHỜ')),
        trendColor: scoped.passed ? 'text-emerald-600' : 'text-slate-500',
        icon: CheckCircle2,
        iconBg: 'bg-teal-600',
      },
    ];
  } else if (isTeacher) {
    metricCards = [
      {
        title: t('dashboard.myTopics', 'Đề tài phụ trách'),
        value: loading ? '—' : (scoped.myTopicsCount ?? 0),
        subtitle: `${scoped.myApprovedTopicsCount ?? 0} ${t('dashboard.approvedTopicsCount', 'đề tài đã mở/duyệt')}`,
        trend: `${scoped.myTopicsCount ?? 0} đề tài`,
        trendColor: 'text-blue-600',
        icon: FileText,
        iconBg: 'bg-blue-600',
      },
      {
        title: t('dashboard.guidedTeams', 'Nhóm đang hướng dẫn'),
        value: loading ? '—' : (scoped.guidedTeamsCount ?? 0),
        subtitle: t('dashboard.guidedTeamsDesc', 'Nhóm sinh viên nhận hướng dẫn'),
        trend: `${scoped.guidedTeamsCount ?? 0} nhóm`,
        trendColor: 'text-emerald-600',
        icon: Users2,
        iconBg: 'bg-indigo-600',
      },
      {
        title: t('dashboard.pendingReviewRegistrations', 'Đăng ký chờ xét duyệt'),
        value: loading ? '—' : (scoped.pendingRegistrationsCount ?? 0),
        subtitle: t('dashboard.pendingReviewSub', 'Yêu cầu từ các nhóm sinh viên'),
        trend: (scoped.pendingRegistrationsCount ?? 0) > 0 ? t('dashboard.actionRequired', 'Cần xử lý') : t('dashboard.allClear', 'Đã duyệt hết'),
        trendColor: (scoped.pendingRegistrationsCount ?? 0) > 0 ? 'text-amber-600' : 'text-emerald-600',
        icon: BookmarkCheck,
        iconBg: 'bg-amber-600',
      },
      {
        title: t('dashboard.pendingTasksReview', 'Tiến độ cần theo dõi'),
        value: loading ? '—' : (scoped.pendingTasksCount ?? 0),
        subtitle: t('dashboard.pendingTasksSub', 'Nhiệm vụ nhóm sinh viên đang làm'),
        trend: `${scoped.pendingTasksCount ?? 0} tasks`,
        trendColor: 'text-rose-600',
        icon: Clock,
        iconBg: 'bg-rose-600',
      },
      {
        title: t('dashboard.participatingCouncils', 'Hội đồng tham gia'),
        value: loading ? '—' : (scoped.myCouncilsCount ?? 0),
        subtitle: t('dashboard.participatingCouncilsSub', 'Hội đồng chấm bảo vệ được xếp'),
        trend: `${scoped.myCouncilsCount ?? 0} hội đồng`,
        trendColor: 'text-purple-600',
        icon: Award,
        iconBg: 'bg-purple-600',
      },
      {
        title: t('dashboard.pendingFacultyApproval', 'Chờ khoa phê duyệt'),
        value: loading ? '—' : (scoped.myPendingTopicsCount ?? 0),
        subtitle: t('dashboard.pendingFacultyApprovalSub', 'Đề tài mới gửi lên Trưởng khoa'),
        trend: (scoped.myPendingTopicsCount ?? 0) > 0 ? t('dashboard.pendingApproval', 'Chờ duyệt') : t('dashboard.ready', 'Hoàn tất'),
        trendColor: 'text-teal-600',
        icon: CheckCircle2,
        iconBg: 'bg-teal-600',
      },
    ];
  } else if (isCouncil) {
    metricCards = [
      {
        title: t('dashboard.assignedCouncils', 'Hội đồng tham gia'),
        value: loading ? '—' : (scoped.assignedCouncilsCount ?? 0),
        subtitle: t('dashboard.assignedCouncilsSub', 'Hội đồng bảo vệ được xếp'),
        trend: `${scoped.assignedCouncilsCount ?? 0} hội đồng`,
        trendColor: 'text-purple-600',
        icon: Award,
        iconBg: 'bg-purple-600',
      },
      {
        title: t('dashboard.assignedTopics', 'Đề tài / Nhóm cần chấm'),
        value: loading ? '—' : (scoped.assignedTopicsCount ?? 0),
        subtitle: t('dashboard.assignedTopicsSub', 'Lượt đề tài phân công đánh giá'),
        trend: `${scoped.assignedTopicsCount ?? 0} đề tài`,
        trendColor: 'text-blue-600',
        icon: FileText,
        iconBg: 'bg-blue-600',
      },
      {
        title: t('dashboard.completedAssessments', 'Đánh giá đã nộp'),
        value: loading ? '—' : (scoped.completedAssessments ?? 0),
        subtitle: t('dashboard.completedAssessmentsSub', 'Phiếu chấm điểm đã hoàn tất'),
        trend: `${scoped.completedAssessments ?? 0} phiếu`,
        trendColor: 'text-emerald-600',
        icon: CheckCircle2,
        iconBg: 'bg-emerald-600',
      },
      {
        title: t('dashboard.pendingAssessments', 'Đánh giá còn chờ'),
        value: loading ? '—' : (scoped.pendingAssessments ?? 0),
        subtitle: t('dashboard.pendingAssessmentsSub', 'Cần nhập điểm & nhận xét'),
        trend: (scoped.pendingAssessments ?? 0) > 0 ? t('dashboard.actionRequired', 'Cần chấm') : t('dashboard.allClear', 'Đã xong'),
        trendColor: (scoped.pendingAssessments ?? 0) > 0 ? 'text-amber-600' : 'text-emerald-600',
        icon: Clock,
        iconBg: 'bg-amber-600',
      },
      {
        title: t('dashboard.completedCouncils', 'Hội đồng đã xong'),
        value: loading ? '—' : (scoped.completedCouncilsCount ?? 0),
        subtitle: t('dashboard.completedCouncilsSub', 'Phiên bảo vệ đã hoàn thành'),
        trend: `${scoped.completedCouncilsCount ?? 0} hội đồng`,
        trendColor: 'text-indigo-600',
        icon: BookmarkCheck,
        iconBg: 'bg-indigo-600',
      },
      {
        title: t('dashboard.gradingProgress', 'Tiến độ chấm điểm'),
        value: loading ? '—' : `${scoped.completionRate ?? 100}%`,
        subtitle: t('dashboard.gradingProgressSub', 'Tỷ lệ hoàn thành đánh giá'),
        trend: `${scoped.completionRate ?? 100}%`,
        trendColor: 'text-teal-600',
        icon: TrendingUp,
        iconBg: 'bg-teal-600',
      },
    ];
  } else if (isPrincipal) {
    metricCards = [
      {
        title: t('dashboard.facultyTopics', 'Tổng đề tài cấp khoa'),
        value: loading ? '—' : (scoped.totalTopics ?? displayTopics),
        subtitle: `${scoped.approvedTopicsCount ?? 0} ${t('dashboard.approvedCount', 'đề tài đã mở/duyệt')}`,
        trend: `${scoped.totalTopics ?? displayTopics} đề tài`,
        trendColor: 'text-blue-600',
        icon: FileText,
        iconBg: 'bg-indigo-600',
      },
      {
        title: t('dashboard.pendingFacultyApprovalCount', 'Đề tài chờ phê duyệt'),
        value: loading ? '—' : (scoped.pendingTopicsCount ?? 0),
        subtitle: t('dashboard.pendingFacultyApprovalSub', 'Chờ Trưởng khoa duyệt'),
        trend: (scoped.pendingTopicsCount ?? 0) > 0 ? t('dashboard.actionRequired', 'Cần duyệt ngay') : t('dashboard.allClear', 'Đã duyệt hết'),
        trendColor: (scoped.pendingTopicsCount ?? 0) > 0 ? 'text-rose-600' : 'text-emerald-600',
        icon: Clock,
        iconBg: 'bg-rose-600',
      },
      {
        title: t('dashboard.teamRoster', 'Nhóm sinh viên'),
        value: loading ? '—' : (scoped.totalTeams ?? displayTeams),
        subtitle: `${scoped.totalRegistrations ?? displayRegistrations} ${t('dashboard.registrationsCount', 'lượt đăng ký')}`,
        trend: `${scoped.totalTeams ?? displayTeams} nhóm`,
        trendColor: 'text-amber-600',
        icon: Users2,
        iconBg: 'bg-blue-600',
      },
      {
        title: t('dashboard.openPeriods', 'Đợt đăng ký đang mở'),
        value: loading ? '—' : (scoped.openPeriodsCount ?? 0),
        subtitle: t('dashboard.openPeriodsSub', 'Đang tiếp nhận đăng ký đề tài'),
        trend: (scoped.openPeriodsCount ?? 0) > 0 ? 'OPEN' : 'CLOSED',
        trendColor: (scoped.openPeriodsCount ?? 0) > 0 ? 'text-emerald-600' : 'text-slate-500',
        icon: Calendar,
        iconBg: 'bg-amber-600',
      },
      {
        title: t('dashboard.totalCouncils', 'Hội đồng bảo vệ'),
        value: loading ? '—' : (scoped.totalCouncils ?? 0),
        subtitle: t('dashboard.totalCouncilsSub', 'Hội đồng đã thành lập'),
        trend: `${scoped.totalCouncils ?? 0} hội đồng`,
        trendColor: 'text-purple-600',
        icon: Award,
        iconBg: 'bg-purple-600',
      },
      {
        title: t('dashboard.registrations', 'Tổng lượt đăng ký'),
        value: loading ? '—' : (scoped.totalRegistrations ?? displayRegistrations),
        subtitle: t('dashboard.registrationsCountSub', 'Hồ sơ nhóm đăng ký đề tài'),
        trend: `${scoped.totalRegistrations ?? displayRegistrations} lượt`,
        trendColor: 'text-teal-600',
        icon: BookmarkCheck,
        iconBg: 'bg-teal-600',
      },
    ];
  } else {
    // Default: ADMIN
    metricCards = [
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
  }

  // Header Title & Description customized by Role
  let pageTitle = t('dashboard.title', 'Bảng điều khiển');
  let pageDesc = t('dashboard.roleDistributionDesc', 'Tổng quan phân quyền và dữ liệu thời gian thực');

  if (isStudent) {
    pageTitle = t('dashboard.titleStudent', 'Bảng điều khiển Sinh viên');
    pageDesc = t('dashboard.descStudent', 'Theo dõi thông tin nhóm, đề tài đăng ký, tiến độ thực hiện và kết quả bảo vệ');
  } else if (isTeacher) {
    pageTitle = t('dashboard.titleTeacher', 'Bảng điều khiển Giảng viên');
    pageDesc = t('dashboard.descTeacher', 'Quản lý hướng dẫn đề tài, danh sách nhóm sinh viên và đánh giá tiến độ');
  } else if (isCouncil) {
    pageTitle = t('dashboard.titleCouncil', 'Bảng điều khiển Hội đồng bảo vệ');
    pageDesc = t('dashboard.descCouncil', 'Theo dõi lịch hội đồng chấm khóa luận và tiến độ đánh giá đề tài');
  } else if (isPrincipal) {
    pageTitle = t('dashboard.titlePrincipal', 'Bảng điều khiển Trưởng khoa');
    pageDesc = t('dashboard.descPrincipal', 'Quản lý chỉ tiêu đề tài, phê duyệt đề tài và đợt đăng ký cấp khoa');
  } else if (isAdmin) {
    pageTitle = t('dashboard.titleAdmin', 'Bảng điều khiển Quản trị viên');
    pageDesc = t('dashboard.descAdmin', 'Giám sát hạ tầng nền tảng, số liệu người dùng và phân quyền hệ thống');
  }

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
  const topicStatusDistribution = stats?.topicStatusDistribution || {};

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={pageTitle}
        description={pageDesc}
        action={
          <div className="flex items-center gap-3">
            {(isAdmin || isPrincipal) && (
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
            )}

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

      {/* 6 Metric KPI Cards Tailored to Current Role */}
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

      {/* ======================================================== */}
      {/* ROLE 1: SINH VIÊN (STUDENT) SPECIFIC DASHBOARD CONTENT     */}
      {/* ======================================================== */}
      {isStudent && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2/3): My Team, My Topic & Milestones */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Team & Topic Highlight Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      {t('dashboard.studentSummaryTitle', 'Thông tin Khóa luận & Nhóm của tôi')}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {t('dashboard.studentSummarySub', 'Trạng thái học phần khóa luận tốt nghiệp')}
                    </p>
                  </div>
                </div>
                <NavLink
                  to="/registrations"
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 px-3 py-1.5 rounded-lg transition"
                >
                  <span>{t('dashboard.viewRegistrations', 'Xem chi tiết đề tài')}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </NavLink>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Team Card Box */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {t('dashboard.teamStatusLabel', 'Nhóm sinh viên')}
                    </span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${scoped.hasTeam ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {scoped.hasTeam ? t('dashboard.teamFormed', 'Đã lập nhóm') : t('dashboard.noTeam', 'Chưa có nhóm')}
                    </span>
                  </div>
                  <p className="text-base font-bold text-slate-900">{scoped.teamName || t('dashboard.studentNoTeam', 'Chưa vào nhóm')}</p>
                  <p className="text-xs text-slate-600">
                    {scoped.hasTeam ? `${scoped.memberCount || 1} ${t('dashboard.membersInTeam', 'thành viên tham gia khóa luận')}` : t('dashboard.joinTeamPrompt', 'Hãy tạo hoặc tìm nhóm cùng chuyên ngành')}
                  </p>
                  {!scoped.hasTeam && (
                    <NavLink
                      to="/teams"
                      className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:underline pt-1"
                    >
                      <span>{t('dashboard.findTeamNow', 'Tìm nhóm ngay')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </NavLink>
                  )}
                </div>

                {/* Topic Card Box */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {t('dashboard.topicStatusLabel', 'Đề tài đăng ký')}
                    </span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${scoped.registrationStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : scoped.registrationStatus === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'}`}>
                      {scoped.registrationStatus || 'NONE'}
                    </span>
                  </div>
                  <p className="text-base font-bold text-slate-900 line-clamp-1">{scoped.topicTitle || t('dashboard.noTopic', 'Chưa đăng ký đề tài')}</p>
                  <p className="text-xs text-slate-600">
                    {t('dashboard.advisor', 'GVHD')}: <span className="font-semibold text-slate-800">{scoped.advisorName || t('dashboard.unassigned', 'Chưa phân công')}</span>
                  </p>
                  {scoped.registrationStatus !== 'APPROVED' && (
                    <NavLink
                      to="/registrations"
                      className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:underline pt-1"
                    >
                      <span>{t('dashboard.registerTopicNow', 'Đăng ký đề tài')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </NavLink>
                  )}
                </div>
              </div>
            </div>

            {/* Capstone Milestone Timeline */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900">
                {t('dashboard.milestonesTitle', 'Lộ trình khóa luận tốt nghiệp')}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                {/* Step 1 */}
                <div className={`p-3.5 rounded-xl border ${scoped.hasTeam ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold font-mono uppercase">Bước 1</span>
                    {scoped.hasTeam && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <h4 className="font-bold text-xs mt-1">{t('dashboard.stepTeam', 'Lập nhóm & Chọn đề tài')}</h4>
                  <p className="text-[11px] text-slate-500 mt-1">{t('dashboard.stepTeamDesc', '1-3 SV/nhóm theo đúng chuyên ngành')}</p>
                </div>

                {/* Step 2 */}
                <div className={`p-3.5 rounded-xl border ${scoped.registrationStatus === 'APPROVED' ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : scoped.registrationStatus === 'PENDING' ? 'bg-amber-50/60 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold font-mono uppercase">Bước 2</span>
                    {scoped.registrationStatus === 'APPROVED' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <h4 className="font-bold text-xs mt-1">{t('dashboard.stepApproval', 'Xét duyệt đề tài')}</h4>
                  <p className="text-[11px] text-slate-500 mt-1">{t('dashboard.stepApprovalDesc', 'Giảng viên duyệt đơn đăng ký')}</p>
                </div>

                {/* Step 3 */}
                <div className={`p-3.5 rounded-xl border ${scoped.progressPercent >= 100 ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : scoped.progressPercent > 0 ? 'bg-blue-50/60 border-blue-200 text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold font-mono uppercase">Bước 3</span>
                    {scoped.progressPercent >= 100 && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <h4 className="font-bold text-xs mt-1">{t('dashboard.stepProgress', 'Tiến độ & Báo cáo')}</h4>
                  <p className="text-[11px] text-slate-500 mt-1">{t('dashboard.stepProgressDesc', 'Nộp các mốc báo cáo định kỳ')}</p>
                </div>

                {/* Step 4 */}
                <div className={`p-3.5 rounded-xl border ${scoped.finalScore != null ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold font-mono uppercase">Bước 4</span>
                    {scoped.finalScore != null && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <h4 className="font-bold text-xs mt-1">{t('dashboard.stepDefense', 'Bảo vệ & Nhận kết quả')}</h4>
                  <p className="text-[11px] text-slate-500 mt-1">{t('dashboard.stepDefenseDesc', 'Hội đồng chấm và công bố điểm')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (1/3): Quick Actions & Recent Notifications */}
          <div className="space-y-6">
            {/* Quick Action Shortcuts for Students */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>{t('dashboard.studentQuickActions', 'Thao tác nhanh cho Sinh viên')}</span>
              </h2>

              <div className="grid grid-cols-1 gap-2 pt-1">
                <NavLink
                  to="/teams"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/70 hover:border-blue-200 transition group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-white text-blue-600 shadow-2xs group-hover:bg-blue-600 group-hover:text-white transition">
                      <Users2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700">{t('dashboard.actionManageTeam', 'Quản lý nhóm của tôi')}</p>
                      <p className="text-[11px] text-slate-500">{t('dashboard.actionManageTeamSub', 'Mời bạn cùng nhóm, xem thành viên')}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                </NavLink>

                <NavLink
                  to="/registrations"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/70 hover:border-blue-200 transition group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-white text-indigo-600 shadow-2xs group-hover:bg-indigo-600 group-hover:text-white transition">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700">{t('dashboard.actionRegisterTopic', 'Đăng ký đề tài khóa luận')}</p>
                      <p className="text-[11px] text-slate-500">{t('dashboard.actionRegisterTopicSub', 'Chọn đề tài đang mở và gửi đơn')}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                </NavLink>

                <NavLink
                  to="/progress"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/70 hover:border-blue-200 transition group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-white text-emerald-600 shadow-2xs group-hover:bg-emerald-600 group-hover:text-white transition">
                      <ClipboardList className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700">{t('dashboard.actionProgress', 'Báo cáo tiến độ khóa luận')}</p>
                      <p className="text-[11px] text-slate-500">{t('dashboard.actionProgressSub', 'Cập nhật nhiệm vụ và tài liệu')}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                </NavLink>

                <NavLink
                  to="/results"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/70 hover:border-blue-200 transition group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-white text-purple-600 shadow-2xs group-hover:bg-purple-600 group-hover:text-white transition">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700">{t('dashboard.actionResults', 'Kết quả & Điểm bảo vệ')}</p>
                      <p className="text-[11px] text-slate-500">{t('dashboard.actionResultsSub', 'Xem điểm tổng kết khóa luận')}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                </NavLink>
              </div>
            </div>

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
                    {t('dashboard.noNotifications', 'Không có thông báo mới')}
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 text-sm line-clamp-1">{localizeNotification(n.title, language)}</span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : t('dashboard.justNow', 'Vừa xong')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{localizeNotification(n.content, language)}</p>
                      <div className="text-[11px] text-blue-600 font-medium pt-1">
                        {t('dashboard.by', 'Bởi')}: {n.authorName}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ROLE 2: GIẢNG VIÊN (TEACHER) SPECIFIC DASHBOARD CONTENT   */}
      {/* ======================================================== */}
      {isTeacher && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2/3): Pending Review Registrations & My Guided Topics */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pending Registrations Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2.5">
                  <BookmarkCheck className="w-5 h-5 text-amber-600" />
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      {t('dashboard.pendingReviewRegistrationsTitle', 'Hồ sơ nhóm sinh viên chờ xét duyệt')}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {t('dashboard.pendingReviewRegistrationsSub', 'Các nhóm đăng ký vào đề tài do bạn phụ trách')}
                    </p>
                  </div>
                </div>
                <NavLink
                  to="/registrations"
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  {t('dashboard.viewAllRegistrations', 'Xem tất cả')} →
                </NavLink>
              </div>

              {(!scoped.pendingRegistrationsList || scoped.pendingRegistrationsList.length === 0) ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  {t('dashboard.noPendingRegistrations', 'Hiện không có yêu cầu đăng ký đề tài nào đang chờ duyệt.')}
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {scoped.pendingRegistrationsList.map((item) => (
                    <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-slate-900">{item.teamName}</p>
                        <p className="text-xs text-slate-600 line-clamp-1">
                          {t('dashboard.appliedFor', 'Đăng ký đề tài')}: <span className="font-medium text-slate-800">{item.topicTitle}</span>
                        </p>
                        {item.message && (
                          <p className="text-[11px] text-slate-500 italic line-clamp-1">"{item.message}"</p>
                        )}
                      </div>
                      <NavLink
                        to="/registrations"
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs shrink-0"
                      >
                        {t('dashboard.reviewAction', 'Xét duyệt')}
                      </NavLink>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* My Topics List Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2.5">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      {t('dashboard.myTopicsTitle', 'Đề tài hướng dẫn của tôi')}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {t('dashboard.myTopicsSub', 'Danh sách các đề tài đã đề xuất và đang hướng dẫn')}
                    </p>
                  </div>
                </div>
                <NavLink
                  to="/registrations"
                  className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  + {t('dashboard.newTopic', 'Tạo đề tài mới')}
                </NavLink>
              </div>

              {(!scoped.myTopicsList || scoped.myTopicsList.length === 0) ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  {t('dashboard.noMyTopics', 'Bạn chưa đề xuất đề tài nào trong hệ thống.')}
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {scoped.myTopicsList.map((tItem) => (
                    <div key={tItem.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-slate-900">{tItem.title}</p>
                        <p className="text-xs text-slate-500">{tItem.periodName}</p>
                      </div>
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase shrink-0 ${tItem.status === 'OPEN' || tItem.status === 'ASSIGNED' ? 'bg-emerald-100 text-emerald-800' : tItem.status === 'PENDING_APPROVAL' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>
                        {tItem.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (1/3): Teacher Shortcuts & Notifications */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>{t('dashboard.teacherQuickActions', 'Thao tác nhanh cho Giảng viên')}</span>
              </h2>

              <div className="grid grid-cols-1 gap-2 pt-1">
                <NavLink
                  to="/registrations"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/70 hover:border-blue-200 transition group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-white text-blue-600 shadow-2xs group-hover:bg-blue-600 group-hover:text-white transition">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700">{t('dashboard.actionTeacherTopics', 'Xét duyệt & Quản lý đề tài')}</p>
                      <p className="text-[11px] text-slate-500">{t('dashboard.actionTeacherTopicsSub', 'Đề xuất đề tài mới hoặc duyệt sinh viên')}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                </NavLink>

                <NavLink
                  to="/progress"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/70 hover:border-blue-200 transition group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-white text-emerald-600 shadow-2xs group-hover:bg-emerald-600 group-hover:text-white transition">
                      <ClipboardList className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700">{t('dashboard.actionProgressReview', 'Theo dõi tiến độ nhóm')}</p>
                      <p className="text-[11px] text-slate-500">{t('dashboard.actionProgressReviewSub', 'Góp ý và nhận xét báo cáo tiến độ')}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                </NavLink>

                <NavLink
                  to="/assessments"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/70 hover:border-blue-200 transition group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-white text-purple-600 shadow-2xs group-hover:bg-purple-600 group-hover:text-white transition">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700">{t('dashboard.actionAssessments', 'Đánh giá & Chấm điểm')}</p>
                      <p className="text-[11px] text-slate-500">{t('dashboard.actionAssessmentsSub', 'Chấm điểm phản biện & hội đồng')}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                </NavLink>
              </div>
            </div>

            {/* Notifications */}
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
                    {t('dashboard.noNotifications', 'Không có thông báo mới')}
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 text-sm line-clamp-1">{localizeNotification(n.title, language)}</span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : t('dashboard.justNow', 'Vừa xong')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{localizeNotification(n.content, language)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ROLE 3: HỘI ĐỒNG (COUNCIL) SPECIFIC DASHBOARD CONTENT     */}
      {/* ======================================================== */}
      {isCouncil && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2/3): Upcoming Defense Councils & Guidelines */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2.5">
                  <Award className="w-5 h-5 text-purple-600" />
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      {t('dashboard.upcomingCouncilsTitle', 'Lịch các phiên bảo vệ hội đồng')}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {t('dashboard.upcomingCouncilsSub', 'Danh sách hội đồng bảo vệ khóa luận bạn được phân công')}
                    </p>
                  </div>
                </div>
                <NavLink
                  to="/councils"
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  {t('dashboard.viewAllCouncils', 'Xem tất cả')} →
                </NavLink>
              </div>

              {(!scoped.upcomingCouncils || scoped.upcomingCouncils.length === 0) ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  {t('dashboard.noUpcomingCouncils', 'Hiện tại chưa có lịch hội đồng nào được phân công.')}
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {scoped.upcomingCouncils.map((c) => (
                    <div key={c.id} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900">{c.name}</p>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                            {c.councilRole || 'MEMBER'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>{t('dashboard.room', 'Phòng')}: <strong className="text-slate-700">{c.room}</strong></span>
                          <span>{t('dashboard.time', 'Thời gian')}: {c.startsAt ? new Date(c.startsAt).toLocaleString() : 'Chưa xếp'}</span>
                        </div>
                      </div>
                      <NavLink
                        to="/assessments"
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-2xs shrink-0"
                      >
                        {t('dashboard.enterGrading', 'Nhập điểm')}
                      </NavLink>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Assessment Criteria Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{t('dashboard.criteriaTitle', 'Quy chuẩn đánh giá và Thang điểm')}</span>
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t('dashboard.criteriaDesc', 'Điểm tổng kết khóa luận là điểm trung bình có trọng số giữa Giảng viên phản biện và các thành viên Hội đồng bảo vệ:')}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-bold text-slate-700">{t('dashboard.contentScore', 'Nội dung & Mục tiêu')}</span>
                  <p className="text-sm font-black text-blue-600 mt-0.5">40% (4.0 điểm)</p>
                  <p className="text-[11px] text-slate-500 mt-1">{t('dashboard.contentScoreSub', 'Mức độ hoàn thành các yêu cầu đặt ra')}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-bold text-slate-700">{t('dashboard.techScore', 'Hiện thực & Kỹ thuật')}</span>
                  <p className="text-sm font-black text-indigo-600 mt-0.5">40% (4.0 điểm)</p>
                  <p className="text-[11px] text-slate-500 mt-1">{t('dashboard.techScoreSub', 'Chất lượng mã nguồn, kiến trúc và demo')}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-bold text-slate-700">{t('dashboard.presentationScore', 'Thuyết trình & Vấn đáp')}</span>
                  <p className="text-sm font-black text-emerald-600 mt-0.5">20% (2.0 điểm)</p>
                  <p className="text-[11px] text-slate-500 mt-1">{t('dashboard.presentationScoreSub', 'Khả năng trả lời câu hỏi phản biện')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (1/3): Council Quick Actions & Notifications */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>{t('dashboard.councilQuickActions', 'Lối tắt Hội đồng')}</span>
              </h2>

              <div className="grid grid-cols-1 gap-2 pt-1">
                <NavLink
                  to="/assessments"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-200/70 hover:border-purple-200 transition group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-white text-purple-600 shadow-2xs group-hover:bg-purple-600 group-hover:text-white transition">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-purple-700">{t('dashboard.actionGradeNow', 'Bảng chấm điểm bảo vệ')}</p>
                      <p className="text-[11px] text-slate-500">{t('dashboard.actionGradeNowSub', 'Nhập điểm và nhận xét sinh viên')}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600" />
                </NavLink>

                <NavLink
                  to="/councils"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-200/70 hover:border-purple-200 transition group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-white text-blue-600 shadow-2xs group-hover:bg-blue-600 group-hover:text-white transition">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-purple-700">{t('dashboard.actionCouncilList', 'Danh sách các hội đồng')}</p>
                      <p className="text-[11px] text-slate-500">{t('dashboard.actionCouncilListSub', 'Xem phòng thi và danh sách thành viên')}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600" />
                </NavLink>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-purple-600" />
                  <h2 className="text-sm font-bold text-slate-900">
                    {t('dashboard.recentNotifications', 'Thông báo mới nhất')} ({notifications.length})
                  </h2>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    {t('dashboard.noNotifications', 'Không có thông báo mới')}
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 text-sm line-clamp-1">{localizeNotification(n.title, language)}</span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : t('dashboard.justNow', 'Vừa xong')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{localizeNotification(n.content, language)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ROLE 4 & 5: TRƯỞNG KHOA (PRINCIPAL) & ADMIN CONTENT       */}
      {/* ======================================================== */}
      {(isAdmin || isPrincipal) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2/3): Dynamic Overview Statistics Chart By Semester */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
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

            {/* Principal Only: Topics Pending Approval Quick Action Card */}
            {isPrincipal && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <Clock className="w-5 h-5 text-rose-600" />
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">
                        {t('dashboard.pendingFacultyApprovalList', 'Đề tài khoa cần phê duyệt')}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {t('dashboard.pendingFacultyApprovalListSub', 'Các đề tài do giảng viên bộ môn đề xuất chờ Trưởng khoa duyệt')}
                      </p>
                    </div>
                  </div>
                  <NavLink
                    to="/registrations"
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    {t('dashboard.reviewAllTopics', 'Xét duyệt đề tài')} →
                  </NavLink>
                </div>

                {(!scoped.pendingTopicsList || scoped.pendingTopicsList.length === 0) ? (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    {t('dashboard.noPendingTopics', 'Hiện không có đề tài nào đang chờ duyệt.')}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {scoped.pendingTopicsList.map((top) => (
                      <div key={top.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <p className="text-sm font-bold text-slate-900">{top.title}</p>
                          <p className="text-xs text-slate-600">
                            {t('dashboard.advisor', 'GV đề xuất')}: <span className="font-medium text-slate-800">{top.lecturerName}</span> • {top.departmentName}
                          </p>
                        </div>
                        <NavLink
                          to="/registrations"
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-2xs shrink-0"
                        >
                          {t('dashboard.approveTopic', 'Xét duyệt')}
                        </NavLink>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column (1/3): Key Real Notifications & System Role / Topic Distribution */}
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
                        <span className="font-semibold text-slate-900 text-sm line-clamp-1">{localizeNotification(n.title, language)}</span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : t('dashboard.justNow', 'Vừa xong')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{localizeNotification(n.content, language)}</p>
                      <div className="text-[11px] text-blue-600 font-medium pt-1">
                        {t('dashboard.by', 'Bởi')}: {n.authorName}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Distribution Card: Admin sees Role Distribution; Principal sees Topic Status Distribution */}
            {isAdmin ? (
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
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                  <PieChartIcon className="w-4 h-4 text-blue-600" />
                  <h2 className="text-sm font-bold text-slate-900">
                    {t('dashboard.topicStatusDistribution', 'Trạng thái đề tài cấp khoa')} ({displayTopics})
                  </h2>
                </div>

                <div className="mt-4 space-y-3">
                  {Object.entries(topicStatusDistribution).map(([status, count]) => {
                    const totalTopicsCount = Object.values(topicStatusDistribution).reduce((a, b) => a + b, 0) || 1;
                    const percent = Math.round((count / totalTopicsCount) * 100);
                    return (
                      <div key={status} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                          <span>{status}</span>
                          <span>{count} ({percent}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            style={{ width: `${percent}%` }}
                            className={`h-full rounded-full ${status === 'OPEN' ? 'bg-emerald-600' : status === 'PENDING_APPROVAL' ? 'bg-rose-500' : status === 'ASSIGNED' ? 'bg-blue-600' : 'bg-indigo-600'}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;

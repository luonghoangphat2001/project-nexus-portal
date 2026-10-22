import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Users,
  BookOpen,
  ClipboardCheck,
  Plus,
  Pencil,
  Trash2,
  Search,
  Filter,
  Eye,
  Check,
  UserCheck,
  Building,
  GraduationCap,
  ExternalLink,
} from 'lucide-react';
import registrationService from '../services/registrationService';
import topicService from '../services/topicService';
import academicService from '../services/academicService';
import userService from '../services/userService';
import { periodService } from '../services/periodService';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import {
  PageHeader,
  TableCard,
  TableHeaderBar,
  StatusBadge,
  Modal,
  EmptyState,
  inputClass,
  selectClass,
  buttonClass,
} from '../components/common/CommonUi';
import { formatLecturerName, formatStudentTeamMember } from '../utils/userFormatters';

export const RegistrationsPage = () => {
  const { user, hasRole } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Role determinations
  const userRoles = user?.roles || [];
  const isAdmin = userRoles.includes('ROLE_ADMIN') || hasRole('ROLE_ADMIN');
  const isPrincipal = userRoles.includes('ROLE_PRINCIPAL');
  const isTeacher = userRoles.includes('ROLE_TEACHER');
  const isStudent = !isAdmin && !isPrincipal && !isTeacher;

  // Management permissions
  const canManageTopics = isAdmin || isPrincipal;
  const canReview = isAdmin || isPrincipal || isTeacher;

  // Default active tab based on role
  const [activeTab, setActiveTab] = useState(() => {
    if (canManageTopics) return 'topics';
    if (canReview) return 'review';
    return 'my-registrations';
  });

  // Base state
  const [loading, setLoading] = useState(true);
  const [activePeriods, setActivePeriods] = useState([]);
  const [teamRegistrations, setTeamRegistrations] = useState([]);
  const [advisorTopics, setAdvisorTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [topicRegistrations, setTopicRegistrations] = useState([]);
  const [loadingRegs, setLoadingRegs] = useState(false);

  // Topics management state (for Dean / Principal & Admin)
  const [allTopics, setAllTopics] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [majors, setMajors] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [topicSearchQuery, setTopicSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');
  const [selectedPeriodFilter, setSelectedPeriodFilter] = useState('');
  const [allPeriods, setAllPeriods] = useState([]);

  // Topic Create/Edit Modal State
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [topicFormSubmitting, setTopicFormSubmitting] = useState(false);
  const [topicFormError, setTopicFormError] = useState(null);
  const [topicFormData, setTopicFormData] = useState({
    title: '',
    description: '',
    objectives: '',
    requirements: '',
    departmentId: '',
    periodId: '',
    type: 'CAPSTONE_PROJECT',
    maxStudents: 3,
    duration: '15 tuần',
    primaryAdvisorId: '',
    coAdvisorId: '',
    majorIds: [],
  });

  // Review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedReg, setSelectedReg] = useState(null);
  const [reviewDecision, setReviewDecision] = useState('APPROVED');
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Initial data load
  useEffect(() => {
    loadInitialData();
  }, [user]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const promises = [
        topicService.getActivePeriods().catch(() => []),
      ];

      // Student load
      if (isStudent) {
        promises.push(registrationService.getMyTeamRegistrations().catch(() => []));
      }

      // Reviewer / Teacher load
      if (canReview) {
        promises.push(topicService.getMyLecturerTopics().catch(() => []));
      }

      // Principal / Admin load
      if (canManageTopics) {
        promises.push(academicService.getAllDepartments().catch(() => []));
        promises.push(academicService.getAllMajors().catch(() => []));
        promises.push(userService.getScopedLecturers().then(res => res.data || res || []).catch(() => []));
        promises.push(topicService.searchTopics({ size: 100 }).then(res => res.content || []).catch(() => []));
        promises.push(periodService.getAll().catch(() => []));
      }

      const results = await Promise.all(promises);
      const periods = results[0] || [];
      setActivePeriods(periods);

      let idx = 1;
      if (isStudent) {
        setTeamRegistrations(results[idx] || []);
        idx++;
      }

      if (canReview) {
        const myTopics = results[idx] || [];
        setAdvisorTopics(myTopics);
        if (myTopics.length > 0) {
          setSelectedTopicId(String(myTopics[0].id));
          fetchTopicRegistrations(myTopics[0].id);
        }
        idx++;
      }

      if (canManageTopics) {
        setDepartments(results[idx] || []);
        idx++;
        setMajors(results[idx] || []);
        idx++;
        setLecturers(results[idx] || []);
        idx++;
        setAllTopics(results[idx] || []);
        idx++;
        setAllPeriods(results[idx] || []);
      }
    } catch (err) {
      console.error('Error loading registration data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopicRegistrations = async (topicId) => {
    if (!topicId) return;
    setLoadingRegs(true);
    try {
      const res = await registrationService.getTopicRegistrations(topicId);
      setTopicRegistrations(res || []);
    } catch (err) {
      console.error('Failed to fetch topic registrations:', err);
      setTopicRegistrations([]);
    } finally {
      setLoadingRegs(false);
    }
  };

  // Student cancel registration
  const handleCancelRegistration = async (id) => {
    if (!window.confirm(t('teams.leaveConfirm') || 'Bạn có chắc chắn muốn huỷ đơn đăng ký này?')) return;
    try {
      await registrationService.cancelRegistration(id);
      const res = await registrationService.getMyTeamRegistrations();
      setTeamRegistrations(res || []);
    } catch (err) {
      alert(err.message || 'Failed to cancel registration');
    }
  };

  // Review submit
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReg) return;
    setReviewSubmitting(true);
    try {
      await registrationService.reviewRegistration(selectedReg.id, {
        status: reviewDecision,
        feedback: reviewFeedback,
      });
      setReviewModalOpen(false);
      setSelectedReg(null);
      setReviewFeedback('');
      if (selectedTopicId) {
        fetchTopicRegistrations(selectedTopicId);
      }
      // Refresh topic lists to keep status in sync
      const [refreshedTopics, refreshedAdvisorTopics] = await Promise.all([
        topicService.searchTopics({ size: 100 }).then(res => res.content || []).catch(() => []),
        canReview ? topicService.getMyLecturerTopics().catch(() => []) : Promise.resolve([]),
      ]);
      if (refreshedTopics.length > 0) setAllTopics(refreshedTopics);
      if (refreshedAdvisorTopics.length > 0) setAdvisorTopics(refreshedAdvisorTopics);
    } catch (err) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Open periods only (for creating topics)
  const openPeriods = useMemo(() => {
    const list = activePeriods && activePeriods.length > 0 ? activePeriods : allPeriods;
    return (list || []).filter((p) => p.status === 'OPEN');
  }, [activePeriods, allPeriods]);

  // Open Create Topic Modal
  const handleOpenCreateModal = () => {
    setEditingTopic(null);
    setTopicFormError(null);
    const defaultDept = departments.length > 0 ? departments[0].id : '';
    const defaultPeriod = openPeriods.length > 0 ? openPeriods[0].id : '';
    const currentLecturer = lecturers.find(l => l.id === user?.id || l.email === user?.email);
    const defaultAdvisorId = currentLecturer ? currentLecturer.id : (lecturers.length > 0 ? lecturers[0].id : user?.id || '');

    setTopicFormData({
      title: '',
      description: '',
      objectives: '',
      requirements: '',
      departmentId: defaultDept,
      periodId: defaultPeriod,
      type: 'CAPSTONE_PROJECT',
      maxStudents: 3,
      duration: '15 tuần',
      primaryAdvisorId: defaultAdvisorId,
      coAdvisorId: '',
      majorIds: [],
    });
    setTopicModalOpen(true);
  };

  // Open Edit Topic Modal
  const handleOpenEditModal = (topic) => {
    setEditingTopic(topic);
    setTopicFormError(null);

    const primaryAdv = topic.advisors?.find(a => a.advisorRole === 'PRIMARY' || a.role === 'PRIMARY');
    const coAdv = topic.advisors?.find(a => a.advisorRole === 'CO_ADVISOR' || a.role === 'CO_ADVISOR');

    setTopicFormData({
      title: topic.title || '',
      description: topic.description || '',
      objectives: topic.objectives || '',
      requirements: topic.requirements || '',
      departmentId: topic.department?.id || '',
      periodId: topic.periodId || topic.period?.id || '',
      type: topic.type || 'CAPSTONE_PROJECT',
      maxStudents: topic.maxStudents || 3,
      duration: topic.duration || '15 tuần',
      primaryAdvisorId: primaryAdv ? (primaryAdv.id || primaryAdv.lecturerId) : '',
      coAdvisorId: coAdv ? (coAdv.id || coAdv.lecturerId) : '',
      majorIds: topic.majors ? topic.majors.map(m => m.id) : [],
    });
    setTopicModalOpen(true);
  };

  // Handle Create / Edit Topic Submit
  const handleTopicFormSubmit = async (e) => {
    e.preventDefault();
    setTopicFormError(null);

    if (!topicFormData.title.trim()) {
      setTopicFormError('Vui lòng nhập tên đề tài');
      return;
    }
    if (!topicFormData.departmentId) {
      setTopicFormError('Vui lòng chọn khoa / bộ môn');
      return;
    }
    if (!topicFormData.periodId) {
      setTopicFormError(t('registrations.selectPeriodRequired', 'Vui lòng chọn đợt đăng ký'));
      return;
    }

    const allKnownPeriods = allPeriods.length > 0 ? allPeriods : activePeriods;
    const selectedPeriodObj = allKnownPeriods.find(
      (p) => String(p.id) === String(topicFormData.periodId)
    );

    if (!editingTopic && selectedPeriodObj && selectedPeriodObj.status !== 'OPEN') {
      setTopicFormError(t('registrations.periodNotOpenError', 'Chỉ có thể tạo đề tài trong đợt đăng ký đang mở (OPEN).'));
      return;
    }

    if (
      editingTopic &&
      selectedPeriodObj &&
      selectedPeriodObj.status !== 'OPEN' &&
      String(topicFormData.periodId) !== String(editingTopic.periodId || editingTopic.period?.id)
    ) {
      setTopicFormError(t('registrations.periodNotOpenError', 'Chỉ có thể chuyển đề tài sang đợt đăng ký đang mở (OPEN).'));
      return;
    }

    const selectedDeptObj = departments.find((d) => String(d.id) === String(topicFormData.departmentId));
    if (selectedDeptObj && selectedPeriodObj && Array.isArray(selectedPeriodObj.facultyIds) && selectedPeriodObj.facultyIds.length > 0) {
      if (selectedDeptObj.facultyId && !selectedPeriodObj.facultyIds.includes(Number(selectedDeptObj.facultyId))) {
        setTopicFormError(t('registrations.facultyOutOfPeriodScope', 'Khoa của bộ môn đã chọn không thuộc phạm vi khoa mục tiêu của đợt đăng ký này.'));
        return;
      }
    }

    setTopicFormSubmitting(true);
    try {
      const payload = {
        title: topicFormData.title.trim(),
        description: topicFormData.description.trim(),
        objectives: topicFormData.objectives.trim(),
        requirements: topicFormData.requirements.trim(),
        departmentId: Number(topicFormData.departmentId),
        periodId: Number(topicFormData.periodId),
        type: topicFormData.type,
        maxStudents: Number(topicFormData.maxStudents) || 3,
        duration: topicFormData.duration,
        primaryAdvisorId: topicFormData.primaryAdvisorId ? Number(topicFormData.primaryAdvisorId) : undefined,
        coAdvisorId: topicFormData.coAdvisorId ? Number(topicFormData.coAdvisorId) : null,
        majorIds: topicFormData.majorIds.map(Number),
      };

      if (editingTopic) {
        await topicService.updateTopic(editingTopic.id, payload);
      } else {
        await topicService.createTopic(payload);
      }

      setTopicModalOpen(false);
      setEditingTopic(null);

      // Refresh list
      const [refreshedTopics, refreshedAdvisorTopics] = await Promise.all([
        topicService.searchTopics({ size: 100 }).then(res => res.content || []),
        canReview ? topicService.getMyLecturerTopics().catch(() => []) : Promise.resolve([]),
      ]);
      setAllTopics(refreshedTopics);
      if (canReview) {
        setAdvisorTopics(refreshedAdvisorTopics);
      }
    } catch (err) {
      console.error('Failed to save topic:', err);
      setTopicFormError(err.message || 'Lưu thông tin đề tài không thành công');
    } finally {
      setTopicFormSubmitting(false);
    }
  };

  // Delete topic
  const handleDeleteTopic = async (topicId) => {
    if (!window.confirm(t('registrations.deleteTopicConfirm', 'Bạn có chắc chắn muốn xoá đề tài này? Thao tác này không thể hoàn tác.'))) {
      return;
    }
    try {
      await topicService.deleteTopic(topicId);
      setAllTopics(prev => prev.filter(t => t.id !== topicId));
      if (canReview) {
        setAdvisorTopics(prev => prev.filter(t => t.id !== topicId));
      }
    } catch (err) {
      alert(err.message || 'Không thể xoá đề tài. Có thể đề tài đã có nhóm được phê duyệt.');
    }
  };

  // Filtered topics for Principal
  const filteredTopics = useMemo(() => {
    return allTopics.filter((topic) => {
      if (topicSearchQuery) {
        const q = topicSearchQuery.toLowerCase();
        const matchesTitle = topic.title?.toLowerCase().includes(q);
        const matchesDesc = topic.description?.toLowerCase().includes(q);
        const matchesAdv = topic.advisors?.some(a => (a.fullName || a.lecturerName)?.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesAdv) return false;
      }
      if (selectedDeptFilter && String(topic.department?.id) !== String(selectedDeptFilter)) {
        return false;
      }
      if (selectedStatusFilter && topic.status !== selectedStatusFilter) {
        return false;
      }
      if (selectedPeriodFilter && String(topic.periodId || topic.period?.id) !== String(selectedPeriodFilter)) {
        return false;
      }
      return true;
    });
  }, [allTopics, topicSearchQuery, selectedDeptFilter, selectedStatusFilter, selectedPeriodFilter]);

  // Guided teams (topics with assignedTeam or advised by current user)
  const guidedTopics = useMemo(() => {
    return advisorTopics;
  }, [advisorTopics]);

  // Majors filtered by selected department in Modal
  const modalMajors = useMemo(() => {
    if (!topicFormData.departmentId) return majors;
    return majors.filter(m => String(m.departmentId) === String(topicFormData.departmentId));
  }, [majors, topicFormData.departmentId]);

  // Helper to check if a topic has been approved/assigned
  const isTopicApproved = (topic) => {
    if (!topic) return false;
    return (
      topic.status === 'ASSIGNED' ||
      topic.status === 'IN_PROGRESS' ||
      topic.status === 'COMPLETED' ||
      Boolean(topic.assignedTeam)
    );
  };

  // Currently selected topic in review tab
  const currentSelectedTopic = useMemo(() => {
    const list = canManageTopics ? allTopics : advisorTopics;
    return list.find((t) => String(t.id) === String(selectedTopicId)) || null;
  }, [canManageTopics, allTopics, advisorTopics, selectedTopicId]);

  // Check if current selected topic is already approved
  const isSelectedTopicApproved = useMemo(() => {
    if (!selectedTopicId) return false;
    if (isTopicApproved(currentSelectedTopic)) return true;
    return topicRegistrations.some((r) => r.status === 'APPROVED');
  }, [selectedTopicId, currentSelectedTopic, topicRegistrations]);

  const approvedRegistration = useMemo(() => {
    return topicRegistrations.find((r) => r.status === 'APPROVED') || null;
  }, [topicRegistrations]);

  if (loading) {
    return <div className="py-20 text-center text-slate-400 font-medium">{t('common.loading')}</div>;
  }

  // Determine Page Title & Description based on Role
  const pageTitle = canManageTopics
    ? t('registrations.topicManagementTitle', 'Quản lý đề tài')
    : isTeacher
    ? t('registrations.teacherTitle', 'Xét duyệt & Hướng dẫn đề tài')
    : t('registrations.studentTitle', 'Đăng ký đề tài tốt nghiệp');

  const pageDesc = canManageTopics
    ? t('registrations.topicManagementDesc', 'Quản lý toàn bộ danh mục đề tài, tạo mới, chỉnh sửa, xoá đề tài và theo dõi xét duyệt đăng ký của sinh viên.')
    : isTeacher
    ? t('registrations.teacherDesc', 'Xét duyệt đơn đăng ký đề tài của các nhóm sinh viên và quản lý danh sách nhóm hướng dẫn.')
    : t('registrations.studentDesc', 'Theo dõi đơn đăng ký đề tài của nhóm và kết quả xét duyệt từ giảng viên.');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <PageHeader
        title={pageTitle}
        description={pageDesc}
        actions={
          canManageTopics ? (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className={buttonClass.primary}
            >
              <Plus className="w-4 h-4" />
              <span>{t('registrations.createTopic', 'Thêm đề tài mới')}</span>
            </button>
          ) : null
        }
      />

      {/* Tabs System for Staff & Dean */}
      {(canManageTopics || isTeacher) && (
        <div className="flex items-center space-x-1 border-b border-slate-200">
          {canManageTopics && (
            <button
              type="button"
              onClick={() => setActiveTab('topics')}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
                activeTab === 'topics'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>{t('registrations.tabManageTopics', 'Quản lý đề tài')}</span>
              <span className="ml-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-mono">
                {allTopics.length}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('review')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'review'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>{t('registrations.tabReview', 'Xét duyệt đăng ký')}</span>
            {advisorTopics.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-mono">
                {advisorTopics.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guided')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'guided'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{t('registrations.tabGuidedTeams', 'Nhóm đang hướng dẫn')}</span>
            <span className="ml-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-mono">
              {guidedTopics.filter(t => t.assignedTeam).length}
            </span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. STUDENT VIEW: Active Periods & My Team's Registrations                 */}
      {/* ========================================================================= */}
      {isStudent && (
        <>
          {/* Active Periods Banner */}
          {activePeriods.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activePeriods.map((period) => (
                <div
                  key={period.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-start space-x-3.5"
                >
                  <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-slate-800 text-sm truncate">{period.name}</h3>
                      <StatusBadge value={period.status} />
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {period.academicYear} • {t('periods.semesterLabel', { num: period.semester })}
                    </p>
                    <div className="flex items-center space-x-3 mt-2 text-xs text-slate-500 font-mono">
                      <span>{t('periods.regStarts')}: {formatDate(period.startDate)}</span>
                      <span>•</span>
                      <span>{t('periods.submissionDeadline')}: {formatDate(period.submissionDeadline)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Student: My Team's Registrations Table */}
          <TableCard>
            <TableHeaderBar
              title={t('registrations.myTeamRegistrations', "Đơn đăng ký của nhóm tôi")}
              count={teamRegistrations.length}
            />

            {teamRegistrations.length === 0 ? (
              <EmptyState
                icon={ClipboardCheck}
                title={t('registrations.noTeamRegsFound', "Nhóm bạn hiện chưa đăng ký đề tài nào.")}
                description="Hãy tham khảo danh mục đề tài tốt nghiệp mở nhận đơn để cùng nhóm gửi đăng ký sớm nhất."
                action={
                  <button
                    type="button"
                    onClick={() => navigate('/topics')}
                    className={buttonClass.primary}
                  >
                    <BookOpen className="w-4 h-4 mr-1.5" />
                    <span>Xem danh sách đề tài</span>
                  </button>
                }
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {teamRegistrations.map((reg) => (
                  <div
                    key={reg.id}
                    className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                  >
                    <div>
                      <div className="flex items-center space-x-2.5">
                        <span className="font-bold text-slate-900 text-base">{reg.topicTitle}</span>
                        <StatusBadge value={reg.status} />
                      </div>

                      {reg.feedback && (
                        <div className="mt-2.5 p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-700">
                          <span className="font-semibold text-slate-800">{t('registrations.feedback')}: </span>
                          <span>{reg.feedback}</span>
                        </div>
                      )}

                      <div className="flex items-center space-x-3 mt-2 text-xs text-slate-400 font-mono">
                        <span>{t('registrations.registeredAt')}: {formatDateTime(reg.registeredAt)}</span>
                        {reg.reviewedByLecturerName && <span>• {reg.reviewedByLecturerName}</span>}
                      </div>
                    </div>

                    {reg.status === 'PENDING' && (
                      <button
                        type="button"
                        onClick={() => handleCancelRegistration(reg.id)}
                        className={buttonClass.danger}
                      >
                        {t('common.cancel')}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TableCard>
        </>
      )}

      {/* ========================================================================= */}
      {/* 2. TAB: MANAGE TOPICS (Trưởng khoa / Principal & Admin)                   */}
      {/* ========================================================================= */}
      {canManageTopics && activeTab === 'topics' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder={t('registrations.searchTopicPlaceholder', 'Tìm kiếm đề tài theo tên, từ khóa...')}
                value={topicSearchQuery}
                onChange={(e) => setTopicSearchQuery(e.target.value)}
                className={`${inputClass} pl-9`}
              />
            </div>

            <div className="w-full sm:w-48">
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className={selectClass}
              >
                <option value="">{t('registrations.allDepartments', 'Tất cả bộ môn')}</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-40">
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className={selectClass}
              >
                <option value="">{t('registrations.allStatuses', 'Tất cả trạng thái')}</option>
                <option value="OPEN">Đang mở (OPEN)</option>
                <option value="ASSIGNED">Đã phân công (ASSIGNED)</option>
                <option value="IN_PROGRESS">Đang thực hiện (IN_PROGRESS)</option>
                <option value="COMPLETED">Đã hoàn thành (COMPLETED)</option>
              </select>
            </div>

            <div className="w-full sm:w-44">
              <select
                value={selectedPeriodFilter}
                onChange={(e) => setSelectedPeriodFilter(e.target.value)}
                className={selectClass}
              >
                <option value="">{t('registrations.selectPeriod', 'Tất cả đợt')}</option>
                {(allPeriods.length > 0 ? allPeriods : activePeriods).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.status === 'OPEN' ? `(${t('enums.periodStatus.OPEN', 'Đang mở')})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Topics Table */}
          <TableCard>
            <TableHeaderBar
              title={t('registrations.tabManageTopics', 'Danh mục đề tài')}
              count={filteredTopics.length}
            />

            {filteredTopics.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="Không tìm thấy đề tài nào"
                description="Không có đề tài nào phù hợp với bộ lọc hiện tại hoặc chưa có đề tài nào được tạo."
                action={
                  <button
                    type="button"
                    onClick={handleOpenCreateModal}
                    className={buttonClass.primary}
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    <span>{t('registrations.createTopic', 'Thêm đề tài mới')}</span>
                  </button>
                }
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredTopics.map((topic) => (
                  <div
                    key={topic.id}
                    className="p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 text-base">{topic.title}</span>
                        <StatusBadge value={topic.type} type="topicType" />
                        <StatusBadge value={topic.status} />
                      </div>

                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                        {topic.department && (
                          <span className="flex items-center gap-1 text-slate-700 font-medium">
                            <Building className="w-3.5 h-3.5 text-slate-400" />
                            {topic.department.name}
                          </span>
                        )}
                        {topic.periodName && (
                          <span className="text-slate-400 font-mono">
                            Đợt: {topic.periodName}
                          </span>
                        )}
                        <span className="text-slate-400">
                          Tối đa: {topic.maxStudents || 3} SV • {topic.duration || '15 tuần'}
                        </span>
                      </div>

                      {/* Advisors list */}
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        <span className="text-xs text-slate-400 font-medium">Giảng viên:</span>
                        {topic.advisors && topic.advisors.length > 0 ? (
                          topic.advisors.map((adv, idx) => (
                            <span
                              key={idx}
                              className={`text-[11px] px-2 py-0.5 rounded-lg border font-medium ${
                                (adv.advisorRole === 'PRIMARY' || adv.role === 'PRIMARY')
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-slate-50 text-slate-600 border-slate-200'
                              }`}
                            >
                              {formatLecturerName(adv)}
                              <span className="text-[9px] opacity-75 ml-1">
                                ({(adv.advisorRole === 'PRIMARY' || adv.role === 'PRIMARY') ? 'Chính' : 'Đồng HD'})
                              </span>
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">Chưa phân công</span>
                        )}
                      </div>

                      {/* Assigned team info */}
                      {topic.assignedTeam ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Nhóm thực hiện: <strong>{topic.assignedTeam.name}</strong></span>
                          {topic.assignedTeam.members && (
                            <span className="text-[11px] text-emerald-700 font-normal">
                              ({topic.assignedTeam.members.length} thành viên)
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 text-xs text-slate-400">
                          <span>Chưa có nhóm chính thức</span>
                          {topic.registeredTeamsCount > 0 && (
                            <span className="ml-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-semibold text-[10px]">
                              {topic.registeredTeamsCount} nhóm đang nộp đơn
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action buttons: Edit, Delete, View registrations */}
                    <div className="flex items-center space-x-2 shrink-0">
                      {(() => {
                        const approved = isTopicApproved(topic);
                        return (
                          <button
                            type="button"
                            disabled={approved}
                            onClick={() => {
                              if (approved) return;
                              setSelectedTopicId(String(topic.id));
                              fetchTopicRegistrations(topic.id);
                              setActiveTab('review');
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1 ${
                              approved
                                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer'
                            }`}
                            title={
                              approved
                                ? t('registrations.topicAlreadyApproved', 'Đề tài đã được duyệt')
                                : t('registrations.viewTopicRegsToReview', 'Xem danh sách đơn đăng ký cho đề tài này')
                            }
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{t('registrations.review', 'Xét duyệt')}</span>
                          </button>
                        );
                      })()}

                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(topic)}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center space-x-1"
                        title="Sửa đề tài"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Sửa</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteTopic(topic.id)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center space-x-1"
                        title="Xoá đề tài"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xoá</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TableCard>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TAB: REVIEW APPLICATIONS (Teacher & Principal / Admin)                */}
      {/* ========================================================================= */}
      {canReview && activeTab === 'review' && (
        <TableCard>
          <TableHeaderBar
            title={t('registrations.advisorReviewSection', 'Xét duyệt đơn đăng ký đề tài')}
            subtitle={t('registrations.desc')}
            actions={
              <div className="w-full sm:w-80">
                <select
                  value={selectedTopicId}
                  onChange={(e) => {
                    setSelectedTopicId(e.target.value);
                    fetchTopicRegistrations(e.target.value);
                  }}
                  className={selectClass}
                >
                  <option value="">-- {t('registrations.selectTopicToReview', 'Chọn đề tài cần duyệt')} --</option>
                  {(canManageTopics ? allTopics : advisorTopics).map((tItem) => (
                    <option key={tItem.id} value={tItem.id}>
                      {tItem.title}
                    </option>
                  ))}
                </select>
              </div>
            }
          />

          {isSelectedTopicApproved && selectedTopicId && (
            <div className="p-3.5 px-5 bg-emerald-50/80 border-b border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {t(
                    'registrations.topicAlreadyApprovedBanner',
                    'Đề tài này đã được phê duyệt chính thức. Không thể xét duyệt thêm nhóm khác.'
                  )}
                  {approvedRegistration
                    ? ` (${t('registrations.team', 'Nhóm')}: ${approvedRegistration.teamName})`
                    : currentSelectedTopic?.assignedTeam
                    ? ` (${t('registrations.team', 'Nhóm')}: ${currentSelectedTopic.assignedTeam.name})`
                    : ''}
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[11px]">
                {t('registrations.statusApproved', 'Đã duyệt')}
              </span>
            </div>
          )}

          {loadingRegs ? (
            <div className="p-12 text-center text-slate-400 text-sm font-medium">
              {t('common.loading')}
            </div>
          ) : !selectedTopicId ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              Vui lòng chọn đề tài trong danh sách phía trên để xem các đơn đăng ký cần xét duyệt.
            </div>
          ) : topicRegistrations.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              {t('registrations.noTopicRegsFound', 'Chưa có nhóm nào đăng ký đề tài này.')}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {topicRegistrations.map((reg) => {
                const isRegApproved = reg.status === 'APPROVED';
                const isApproveDisabled = isSelectedTopicApproved || isRegApproved;
                return (
                  <div
                    key={reg.id}
                    className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-800 text-sm">{reg.teamName}</span>
                        <StatusBadge value={reg.status} />
                      </div>

                      {reg.message && (
                        <p className="text-xs text-slate-600 italic leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          "{reg.message}"
                        </p>
                      )}

                      {/* Student Team Members List */}
                      {reg.members && reg.members.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100">
                          <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                            {t('registrations.members', 'Thành viên nhóm:')} ({reg.members.length})
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {reg.members.map((m) => (
                              <span
                                key={m.memberRecordId || m.userId}
                                className={`text-[11px] px-2 py-0.5 rounded-lg border font-medium flex items-center space-x-1 ${
                                  m.roleInTeam === 'LEADER'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200 font-semibold'
                                    : 'bg-slate-50 text-slate-700 border-slate-200'
                                }`}
                              >
                                <span>{formatStudentTeamMember(m, { isLeader: false })} ({m.studentCode || 'N/A'})</span>
                                <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-black/5 font-mono">
                                  {m.roleInTeam === 'LEADER' ? t('teams.leader', 'Nhóm trưởng') : t('teams.member', 'Thành viên')}
                                </span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-xs text-slate-400 mt-2 font-mono">
                        {t('registrations.registeredAt')}: {formatDateTime(reg.registeredAt)}
                        {reg.feedback && (
                          <div className="text-xs text-slate-600 mt-1">
                            <strong>Phản hồi trước đó:</strong> {reg.feedback}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        disabled={isApproveDisabled}
                        onClick={() => {
                          if (isApproveDisabled) return;
                          setSelectedReg(reg);
                          setReviewDecision('APPROVED');
                          setReviewFeedback(reg.feedback || '');
                          setReviewModalOpen(true);
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center space-x-1 ${
                          isApproveDisabled
                            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                        }`}
                        title={
                          isRegApproved
                            ? t('registrations.alreadyApprovedThisReg', 'Đơn đăng ký này đã được duyệt')
                            : isSelectedTopicApproved
                            ? t('registrations.topicAlreadyAssignedToOther', 'Đề tài đã có nhóm được duyệt, không thể xét duyệt thêm')
                            : t('registrations.approve', 'Duyệt chấp thuận')
                        }
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{t('registrations.approve', 'Duyệt chấp thuận')}</span>
                      </button>
                      <button
                        type="button"
                        disabled={isRegApproved}
                        onClick={() => {
                          if (isRegApproved) return;
                          setSelectedReg(reg);
                          setReviewDecision('REJECTED');
                          setReviewFeedback(reg.feedback || '');
                          setReviewModalOpen(true);
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1 ${
                          isRegApproved
                            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer'
                        }`}
                        title={
                          isRegApproved
                            ? t('registrations.cannotRejectApproved', 'Đơn đăng ký đã duyệt không thể từ chối')
                            : t('registrations.reject', 'Từ chối')
                        }
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{t('registrations.reject', 'Từ chối')}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TableCard>
      )}

      {/* ========================================================================= */}
      {/* 4. TAB: GUIDED TEAMS (Teacher & Principal / Admin)                         */}
      {/* ========================================================================= */}
      {(canReview || canManageTopics) && activeTab === 'guided' && (
        <div className="space-y-4">
          <TableCard>
            <TableHeaderBar
              title={t('registrations.tabGuidedTeams', 'Nhóm mà giáo viên hướng dẫn')}
              subtitle="Danh sách các đề tài và nhóm sinh viên đang nhận sự hướng dẫn trực tiếp từ bạn."
              count={guidedTopics.length}
            />

            {guidedTopics.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Chưa có đề tài nào bạn đang hướng dẫn"
                description="Bạn chưa được phân công làm cán bộ hướng dẫn chính hoặc đồng hướng dẫn cho đề tài nào."
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {guidedTopics.map((topic) => {
                  const myRole = topic.advisors?.find(
                    a => a.id === user?.id || a.lecturerId === user?.id || a.email === user?.email
                  );
                  const isPrimary = myRole?.advisorRole === 'PRIMARY' || myRole?.role === 'PRIMARY';

                  return (
                    <div key={topic.id} className="p-6 space-y-4 hover:bg-slate-50/40 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-slate-900 text-base">{topic.title}</span>
                            <StatusBadge value={topic.type} type="topicType" />
                            <StatusBadge value={topic.status} />
                            <span
                              className={`text-[11px] px-2.5 py-0.5 rounded-lg border font-semibold ${
                                isPrimary
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-slate-50 text-slate-600 border-slate-200'
                              }`}
                            >
                              {isPrimary ? 'Hướng dẫn chính' : 'Đồng hướng dẫn'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {topic.department?.name} • Đợt: {topic.periodName} • Thời lượng: {topic.duration || '15 tuần'}
                          </p>
                        </div>

                        {/* Quick links */}
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => navigate('/progress')}
                            className={buttonClass.secondary}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>{t('registrations.viewProgress', 'Xem tiến độ')}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate('/reports')}
                            className={buttonClass.secondary}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>{t('registrations.viewReports', 'Báo cáo')}</span>
                          </button>
                        </div>
                      </div>

                      {/* Assigned Team Card or Empty prompt */}
                      {topic.assignedTeam ? (
                        <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 text-emerald-900 font-bold text-sm">
                              <Users className="w-4 h-4 text-emerald-700" />
                              <span>Nhóm: {topic.assignedTeam.name}</span>
                              <StatusBadge value={topic.assignedTeam.status} />
                            </div>
                            {topic.assignedTeam.leaderName && (
                              <span className="text-xs text-emerald-800">
                                Trưởng nhóm: <strong>{topic.assignedTeam.leaderName}</strong>
                              </span>
                            )}
                          </div>

                          {/* Member chips */}
                          {topic.assignedTeam.members && topic.assignedTeam.members.length > 0 && (
                            <div className="pt-2 border-t border-emerald-100 flex flex-wrap gap-2">
                              {topic.assignedTeam.members.map((m) => (
                                <div
                                  key={m.id || m.userId}
                                  className="px-3 py-1.5 rounded-xl bg-white border border-emerald-200/80 shadow-2xs flex items-center space-x-2 text-xs"
                                >
                                  <span className="font-semibold text-slate-800">{formatStudentTeamMember(m, { isLeader: false })}</span>
                                  {m.studentCode && (
                                    <span className="text-slate-400 font-mono text-[11px]">({m.studentCode})</span>
                                  )}
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono uppercase">
                                    {m.roleInTeam === 'LEADER' ? 'Trưởng nhóm' : 'Thành viên'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs text-slate-500">
                          <span>
                            {t('registrations.noAssignedTeam', 'Chưa có nhóm chính thức được gán cho đề tài này.')}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTopicId(String(topic.id));
                              fetchTopicRegistrations(topic.id);
                              setActiveTab('review');
                            }}
                            className="text-blue-600 font-semibold hover:underline cursor-pointer"
                          >
                            Xem xét duyệt đơn đăng ký →
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TableCard>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: CREATE / EDIT TOPIC (Trưởng khoa / Admin)                       */}
      {/* ========================================================================= */}
      {canManageTopics && (
        <Modal
          isOpen={topicModalOpen}
          onClose={() => setTopicModalOpen(false)}
          title={editingTopic ? t('registrations.editTopic', 'Chỉnh sửa đề tài') : t('registrations.createTopic', 'Thêm đề tài mới')}
          maxWidth="max-w-3xl"
        >
          <form onSubmit={handleTopicFormSubmit} className="space-y-4">
            {topicFormError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{topicFormError}</span>
              </div>
            )}

            {!editingTopic && openPeriods.length === 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>
                  {t('registrations.noOpenPeriodsAlert', 'Hiện không có đợt đăng ký nào đang mở. Trưởng khoa chỉ có thể tạo đề tài trong phạm vi các đợt đăng ký đang được mở.')}
                </span>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('topics.topicTitle', 'Tên đề tài')} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={topicFormData.title}
                onChange={(e) => setTopicFormData({ ...topicFormData, title: e.target.value })}
                placeholder="Nhập tên đề tài nghiên cứu hoặc khóa luận..."
                className={inputClass}
              />
            </div>

            {/* Department & Period */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('topics.department', 'Khoa / Bộ môn')} <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={topicFormData.departmentId}
                  onChange={(e) => setTopicFormData({ ...topicFormData, departmentId: e.target.value, majorIds: [] })}
                  className={selectClass}
                >
                  <option value="">-- {t('registrations.selectDept', 'Chọn khoa / bộ môn')} --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('registrations.period', 'Đợt đăng ký')} <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={topicFormData.periodId}
                  onChange={(e) => setTopicFormData({ ...topicFormData, periodId: e.target.value })}
                  className={selectClass}
                >
                  <option value="">-- {t('registrations.selectPeriod', 'Chọn đợt đăng ký')} --</option>
                  {openPeriods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.academicYear}) - {t('enums.periodStatus.OPEN', 'Đang mở')}
                    </option>
                  ))}
                  {editingTopic && !openPeriods.some((p) => String(p.id) === String(topicFormData.periodId)) && topicFormData.periodId && (
                    <option value={topicFormData.periodId}>
                      {editingTopic.periodName || `Đợt hiện tại (#${topicFormData.periodId})`}
                    </option>
                  )}
                </select>
                {!editingTopic && openPeriods.length === 0 && (
                  <p className="mt-1 text-[11px] text-amber-600 font-medium">
                    {t('registrations.noOpenPeriodsWarning', 'Hiện không có đợt đăng ký nào đang mở. Vui lòng mở đợt đăng ký trước khi tạo đề tài.')}
                  </p>
                )}
              </div>
            </div>

            {/* Advisors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('registrations.primaryAdvisor', 'Giảng viên hướng dẫn chính')} <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={topicFormData.primaryAdvisorId}
                  onChange={(e) => setTopicFormData({ ...topicFormData, primaryAdvisorId: e.target.value })}
                  className={selectClass}
                >
                  <option value="">-- {t('registrations.selectPrimaryAdvisor', 'Chọn giảng viên hướng dẫn chính...')} --</option>
                  {lecturers.map((l) => (
                    <option key={l.id} value={l.id}>
                      {formatLecturerName(l)} ({l.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('registrations.coAdvisor', 'Giảng viên đồng hướng dẫn (tùy chọn)')}
                </label>
                <select
                  value={topicFormData.coAdvisorId}
                  onChange={(e) => setTopicFormData({ ...topicFormData, coAdvisorId: e.target.value })}
                  className={selectClass}
                >
                  <option value="">-- {t('registrations.selectCoAdvisor', 'Không có đồng hướng dẫn')} --</option>
                  {lecturers
                    .filter((l) => String(l.id) !== String(topicFormData.primaryAdvisorId))
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {formatLecturerName(l)} ({l.email})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Type, Max Students, Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('topics.topicType', 'Loại đề tài')}
                </label>
                <select
                  value={topicFormData.type}
                  onChange={(e) => setTopicFormData({ ...topicFormData, type: e.target.value })}
                  className={selectClass}
                >
                  <option value="CAPSTONE_PROJECT">Khóa luận tốt nghiệp (CAPSTONE)</option>
                  <option value="GRADUATION_THESIS">Đồ án tốt nghiệp (THESIS)</option>
                  <option value="RESEARCH">Nghiên cứu khoa học (RESEARCH)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('topics.maxStudents', 'Số SV tối đa')}
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={topicFormData.maxStudents}
                  onChange={(e) => setTopicFormData({ ...topicFormData, maxStudents: Number(e.target.value) })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('topics.duration', 'Thời lượng dự kiến')}
                </label>
                <input
                  type="text"
                  value={topicFormData.duration}
                  onChange={(e) => setTopicFormData({ ...topicFormData, duration: e.target.value })}
                  placeholder={t('registrations.durationPlaceholder', '15 tuần')}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Majors */}
            {modalMajors.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('topics.major', 'Chuyên ngành áp dụng')}
                </label>
                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200/80 rounded-xl max-h-36 overflow-y-auto">
                  {modalMajors.map((m) => {
                    const isChecked = topicFormData.majorIds.includes(m.id);
                    return (
                      <label
                        key={m.id}
                        className={`text-xs px-2.5 py-1 rounded-lg border cursor-pointer select-none transition-colors flex items-center space-x-1.5 ${
                          isChecked
                            ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setTopicFormData({
                                ...topicFormData,
                                majorIds: topicFormData.majorIds.filter((id) => id !== m.id),
                              });
                            } else {
                              setTopicFormData({
                                ...topicFormData,
                                majorIds: [...topicFormData.majorIds, m.id],
                              });
                            }
                          }}
                        />
                        <span>{m.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Objectives */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('topics.expectedOutcomes', 'Mục tiêu đề tài')}
              </label>
              <textarea
                rows={2}
                value={topicFormData.objectives}
                onChange={(e) => setTopicFormData({ ...topicFormData, objectives: e.target.value })}
                placeholder={t('registrations.objectivesPlaceholder', 'Mục tiêu cụ thể đề tài cần đạt được...')}
                className={inputClass}
              />
            </div>

            {/* Requirements */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('topics.requirements', 'Yêu cầu kiến thức & kỹ năng')}
              </label>
              <textarea
                rows={2}
                value={topicFormData.requirements}
                onChange={(e) => setTopicFormData({ ...topicFormData, requirements: e.target.value })}
                placeholder={t('registrations.requirementsPlaceholder', 'Yêu cầu kiến thức, công nghệ, kỹ năng...')}
                className={inputClass}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('topics.topicDescription', 'Mô tả chi tiết')}
              </label>
              <textarea
                rows={3}
                value={topicFormData.description}
                onChange={(e) => setTopicFormData({ ...topicFormData, description: e.target.value })}
                placeholder={t('registrations.descPlaceholder', 'Mô tả chi tiết nội dung nghiên cứu hoặc phát triển của đề tài...')}
                className={inputClass}
              />
            </div>

            {/* Form actions */}
            <div className="pt-3 flex justify-end space-x-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setTopicModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={topicFormSubmitting || (!editingTopic && openPeriods.length === 0)}
                className={buttonClass.primary}
              >
                <Check className="w-4 h-4 mr-1" />
                <span>
                  {topicFormSubmitting
                    ? t('common.loading')
                    : editingTopic
                    ? t('common.saveChanges')
                    : t('common.create')}
                </span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: REVIEW REGISTRATION APPLICATION (Teacher & Principal)            */}
      {/* ========================================================================= */}
      <Modal
        isOpen={reviewModalOpen && !!selectedReg}
        onClose={() => setReviewModalOpen(false)}
        title={reviewDecision === 'APPROVED' ? t('registrations.approve') : t('registrations.reject')}
        maxWidth="max-w-md"
      >
        {selectedReg && (
          <form onSubmit={handleReviewSubmit} className="space-y-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">
                {t('registrations.team')}: <strong className="text-slate-800">{selectedReg.teamName}</strong>
              </p>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {t('registrations.reviewFeedbackLabel')}
              </label>
              <textarea
                rows={4}
                required
                placeholder={t('registrations.reviewFeedbackPlaceholder')}
                value={reviewFeedback}
                onChange={(e) => setReviewFeedback(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="pt-2 flex justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={reviewSubmitting || (reviewDecision === 'APPROVED' && (isSelectedTopicApproved || selectedReg?.status === 'APPROVED'))}
                className={`px-4 py-2 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer ${
                  (reviewDecision === 'APPROVED' && (isSelectedTopicApproved || selectedReg?.status === 'APPROVED'))
                    ? 'bg-slate-300 cursor-not-allowed'
                    : reviewDecision === 'APPROVED'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {reviewSubmitting ? t('common.loading') : t('registrations.saveDecision')}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default RegistrationsPage;

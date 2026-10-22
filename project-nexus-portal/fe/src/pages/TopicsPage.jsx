import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  ArrowRightLeft,
  Users,
  Clock,
  BookOpen,
  GraduationCap,
  RotateCcw,
  CheckCircle,
  Building,
  Download,
  SlidersHorizontal,
  X,
  Filter,
} from 'lucide-react';
import topicService from '../services/topicService';
import academicService from '../services/academicService';
import registrationService from '../services/registrationService';
import { periodService } from '../services/periodService';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import {
  PageHeader,
  FilterCard,
  FilterField,
  StatusBadge,
  Pagination,
  Modal,
  EmptyState,
  inputClass,
  selectClass,
  buttonClass,
} from '../components/common/CommonUi';
import { formatLecturerName, formatStudentTeamMember } from '../utils/userFormatters';

export const TopicsPage = () => {
  const { user, hasRole } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isLecturerOrAdmin = hasRole('ROLE_ADMIN') || hasRole('ROLE_TEACHER') || hasRole('ROLE_PRINCIPAL');
  const isStudent = hasRole('ROLE_USER') && !hasRole('ROLE_TEACHER') && !hasRole('ROLE_PRINCIPAL') && !hasRole('ROLE_ADMIN');

  // Topics list state
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedMajor, setSelectedMajor] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedSort, setSelectedSort] = useState('desc');
  const [departments, setDepartments] = useState([]);
  const [majors, setMajors] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Comparison state (up to 3)
  const [compareList, setCompareList] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [comparing, setComparing] = useState(false);

  // Modals state
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(null);
  const [myPendingTopicIds, setMyPendingTopicIds] = useState(new Set());
  const [hasApprovedTopic, setHasApprovedTopic] = useState(false);
  const [approvedTopicId, setApprovedTopicId] = useState(null);

  const loadStudentRegistrations = async () => {
    if (!isStudent) return;
    try {
      const regs = await registrationService.getMyTeamRegistrations();
      const approved = (regs || []).find((r) => r.status === 'APPROVED');
      if (approved) {
        setHasApprovedTopic(true);
        setApprovedTopicId(approved.topicId);
      } else {
        setHasApprovedTopic(false);
        setApprovedTopicId(null);
      }
      const pendingIds = new Set(
        (regs || []).filter((r) => r.status === 'PENDING').map((r) => r.topicId)
      );
      setMyPendingTopicIds(pendingIds);
    } catch {
      setHasApprovedTopic(false);
      setApprovedTopicId(null);
      setMyPendingTopicIds(new Set());
    }
  };

  // Load departments and initial topics
  useEffect(() => {
    loadAcademicData();
    fetchTopics(0);
    if (isStudent) {
      loadStudentRegistrations();
    }
  }, [isStudent]);

  const loadAcademicData = async () => {
    try {
      const [deptRes, majorRes, periodRes] = await Promise.all([
        academicService.getAllDepartments(),
        academicService.getAllMajors(),
        (isStudent ? topicService.getActivePeriods() : periodService.getAll()).catch(() => []),
      ]);
      setDepartments(deptRes || []);
      setMajors(majorRes || []);
      setPeriods(periodRes || []);
    } catch (err) {
      console.error('Failed to load academic data:', err);
    }
  };

  // Memoize majors based on selected department
  const filteredMajors = useMemo(() => {
    if (!selectedDept) return majors;
    return majors.filter((m) => String(m.departmentId) === String(selectedDept));
  }, [majors, selectedDept]);

  const fetchTopics = async (customPage = page, customFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const q = customFilters.query !== undefined ? customFilters.query : searchQuery;
      const dept = customFilters.departmentId !== undefined ? customFilters.departmentId : selectedDept;
      const maj = customFilters.majorId !== undefined ? customFilters.majorId : selectedMajor;
      const period = customFilters.periodId !== undefined ? customFilters.periodId : selectedPeriod;
      const status = customFilters.status !== undefined ? customFilters.status : selectedStatus;
      const sort = customFilters.direction !== undefined ? customFilters.direction : selectedSort;

      const params = {
        query: q || undefined,
        departmentId: dept || undefined,
        majorId: maj || undefined,
        periodId: period || undefined,
        status: status || undefined,
        direction: sort || 'desc',
        page: customPage,
        size: 9,
      };
      const res = await topicService.searchTopics(params);
      setTopics(res.content || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      setError(err.message || 'Failed to fetch topics');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    setExportLoading(true);
    setError(null);
    try {
      const params = {
        query: searchQuery || undefined,
        departmentId: selectedDept || undefined,
        majorId: selectedMajor || undefined,
        periodId: selectedPeriod || undefined,
        status: selectedStatus || undefined,
      };
      const blob = await topicService.exportTopicsExcel(params);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'danh-sach-de-tai-khoa-luan.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Không thể xuất danh sách đề tài ra Excel');
    } finally {
      setExportLoading(false);
    }
  };

  const handleDepartmentChange = (deptId) => {
    setSelectedDept(deptId);
    let newMajorId = selectedMajor;
    if (deptId && selectedMajor) {
      const currentMajor = majors.find((m) => String(m.id) === String(selectedMajor));
      if (currentMajor && String(currentMajor.departmentId) !== String(deptId)) {
        newMajorId = '';
        setSelectedMajor('');
      }
    }
    setPage(0);
    fetchTopics(0, { departmentId: deptId, majorId: newMajorId });
  };

  const handleMajorChange = (majorId) => {
    setSelectedMajor(majorId);
    let newDeptId = selectedDept;
    if (majorId && !selectedDept) {
      const selectedMajorObj = majors.find((m) => String(m.id) === String(majorId));
      if (selectedMajorObj && selectedMajorObj.departmentId) {
        newDeptId = String(selectedMajorObj.departmentId);
        setSelectedDept(newDeptId);
      }
    }
    setPage(0);
    fetchTopics(0, { departmentId: newDeptId, majorId: majorId });
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setPage(0);
    fetchTopics(0);
  };

  const toggleCompare = (topic) => {
    if (compareList.some((t) => t.id === topic.id)) {
      setCompareList(compareList.filter((t) => t.id !== topic.id));
    } else {
      if (compareList.length >= 3) {
        alert(t('topics.selectUpTo3'));
        return;
      }
      setCompareList([...compareList, topic]);
    }
  };

  const handleExecuteCompare = async () => {
    if (compareList.length < 2) {
      alert(t('topics.selectUpTo3'));
      return;
    }
    try {
      const ids = compareList.map((t) => t.id);
      const res = await topicService.compareTopics(ids);
      setComparisonData(res.topics || []);
      setComparing(true);
    } catch (err) {
      alert(err.message || 'Comparison failed');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTopic || !isStudent || studentHasTopic) return;
    try {
      await registrationService.submitRegistration({
        topicId: selectedTopic.id,
        message: registrationMessage,
      });
      setMyPendingTopicIds((prev) => new Set([...prev, selectedTopic.id]));
      await loadStudentRegistrations();
      setRegisterSuccess(t('topics.registeredSuccess'));
      setTimeout(() => {
        setRegisterModalOpen(false);
        setRegisterSuccess(null);
        setRegistrationMessage('');
      }, 2000);
    } catch (err) {
      alert(err.message || 'Registration failed');
    }
  };

  const isStudentAssignedToTopic = (t) => {
    if (!isStudent || !t) return false;
    if (approvedTopicId && String(t.id) === String(approvedTopicId)) return true;
    return Boolean(
      t.assignedTeam?.members?.some(
        (m) =>
          (m.userId && user?.id && String(m.userId) === String(user.id)) ||
          (m.id && user?.id && String(m.id) === String(user.id)) ||
          (m.studentCode && user?.studentCode && m.studentCode === user.studentCode) ||
          (m.username && user?.username && m.username === user.username) ||
          (m.email && user?.email && m.email === user.email)
      )
    );
  };

  const studentHasTopic = useMemo(() => {
    if (!isStudent) return false;
    if (hasApprovedTopic) return true;
    return topics.some((t) => isStudentAssignedToTopic(t));
  }, [isStudent, hasApprovedTopic, topics, approvedTopicId, user]);

  // Filter topics for students: PENDING_APPROVAL topics are only visible to students waiting for approval on that topic
  const displayedTopics = useMemo(() => {
    if (!isStudent) return topics;
    return topics.filter((t) => {
      if (t.status === 'PENDING_APPROVAL') {
        return myPendingTopicIds.has(t.id);
      }
      return true;
    });
  }, [topics, isStudent, myPendingTopicIds]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header with Inheritance */}
      <PageHeader
        title={t('topics.title')}
        description={t('topics.desc')}
        actions={
          <div className="flex items-center space-x-2.5">
            {compareList.length > 0 && (
              <button
                type="button"
                onClick={handleExecuteCompare}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-xl text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-xs"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>
                  {t('topics.compareTopics')} ({compareList.length}/3)
                </span>
              </button>
            )}

            {isLecturerOrAdmin && (
              <button
                type="button"
                onClick={() => navigate('/registrations')}
                className={buttonClass.primary}
              >
                <Plus className="w-4 h-4" />
                <span>
                  {hasRole('ROLE_PRINCIPAL') || hasRole('ROLE_ADMIN')
                    ? t('nav.topicManagement', 'Quản lý đề tài')
                    : t('topics.proposeTopic', 'Đề xuất đề tài')}
                </span>
              </button>
            )}
          </div>
        }
      />

      {/* Notice if student already has a capstone topic */}
      {isStudent && studentHasTopic && (
        <div className="p-4 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl flex items-center space-x-3 text-xs text-emerald-800 shadow-xs">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">
            {t('topics.studentAlreadyHasTopicBanner', 'Bạn đã có đề tài tốt nghiệp chính thức. Chức năng đăng ký các đề tài khác đã được khóa.')}
          </span>
        </div>
      )}

      {/* Filter and Search Card */}
      <FilterCard
        onReset={() => {
          setSearchQuery('');
          setSelectedDept('');
          setSelectedMajor('');
          setPage(0);
          fetchTopics(0, { query: '', departmentId: '', majorId: '' });
        }}
        onSearch={() => {
          setPage(0);
          fetchTopics(0);
        }}
      >
        <FilterField label={t('common.search') || 'Search'}>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder={t('topics.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${inputClass} pl-9`}
            />
          </div>
        </FilterField>

        <FilterField label={t('topics.department') || 'Department'}>
          <select
            value={selectedDept}
            onChange={(e) => handleDepartmentChange(e.target.value)}
            className={selectClass}
          >
            <option value="">{t('topics.allDepartments')}</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label={t('topics.major') || 'Major'}>
          <select
            value={selectedMajor}
            onChange={(e) => handleMajorChange(e.target.value)}
            className={selectClass}
          >
            <option value="">{t('topics.allMajors')}</option>
            {filteredMajors.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.code})
              </option>
            ))}
          </select>
        </FilterField>
      </FilterCard>

      {/* Topics Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 font-medium">{t('common.loading')}</div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm">{error}</div>
      ) : displayedTopics.length === 0 ? (
        <EmptyState message={t('topics.noTopicsFound')} icon={BookOpen} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedTopics.map((topic) => {
            const isSelectedForCompare = compareList.some((t) => t.id === topic.id);

            return (
              <div
                key={topic.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <StatusBadge value={topic.type} type="topicType" />
                    <StatusBadge value={topic.status} />
                  </div>

                  <h3 className="text-base font-semibold text-slate-800 line-clamp-2 leading-snug">
                    {topic.title}
                  </h3>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                    {topic.description || t('topics.noDescription')}
                  </p>

                  {/* Target Majors Tags */}
                  {topic.majors && topic.majors.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {topic.majors.map((m) => (
                        <span
                          key={m.id}
                          className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium"
                          title={m.code}
                        >
                          {m.name || m.code}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Department & Advisors */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                    {topic.department?.name && (
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate text-slate-600">{topic.department.name}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <GraduationCap className="w-4 h-4 text-indigo-500 shrink-0" />
                      <div className="truncate">
                        <span className="font-medium text-slate-700">
                          {topic.advisors && topic.advisors.length > 0
                            ? topic.advisors.map((a) => formatLecturerName(a)).filter(Boolean).join(', ')
                            : t('topics.deptAssigned')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Assigned Team & Students when status is ASSIGNED or team is present */}
                  {topic.assignedTeam && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 bg-slate-50/70 p-2.5 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between text-emerald-800 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{topic.assignedTeam.name}</span>
                        </span>
                        {topic.assignedTeam.members && (
                          <span className="text-[10px] font-mono font-normal text-slate-500">
                            {topic.assignedTeam.members.length} {t('teams.membersCount', 'thành viên')}
                          </span>
                        )}
                      </div>
                      {topic.assignedTeam.members && topic.assignedTeam.members.length > 0 && (
                        <div className="text-[11px] text-slate-600 leading-snug">
                          <span className="text-slate-400">{t('topics.assignedStudents', 'Sinh viên')}: </span>
                          <span className="font-medium text-slate-700">
                            {topic.assignedTeam.members.map((m) => formatStudentTeamMember(m)).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Meta stats */}
                  <div className="flex items-center space-x-4 mt-2 text-[11px] text-slate-400">
                    <div className="flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{t('topics.maxStudentsLabel', { count: topic.maxStudents || 3 })}</span>
                    </div>
                    {topic.duration && (
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{topic.duration}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => toggleCompare(topic)}
                    className={`text-xs px-2.5 py-1.5 rounded-xl border font-medium transition-colors flex items-center space-x-1 cursor-pointer ${
                      isSelectedForCompare
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>{isSelectedForCompare ? t('topics.added') : t('topics.compare')}</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTopic(topic)}
                      className={buttonClass.secondary}
                    >
                      {t('topics.viewDetails')}
                    </button>
                    {isStudent && isStudentAssignedToTopic(topic) ? (
                      <span className="text-xs px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium flex items-center space-x-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{t('topics.myTopic', 'Đề tài của bạn')}</span>
                      </span>
                    ) : isStudent && myPendingTopicIds.has(topic.id) ? (
                      <span className="text-xs px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                        {t('enums.registrationStatus.PENDING', 'Chờ duyệt')}
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={!isStudent || topic.status !== 'OPEN' || studentHasTopic || myPendingTopicIds.size > 0}
                        onClick={() => {
                          if (!isStudent || topic.status !== 'OPEN' || studentHasTopic || myPendingTopicIds.size > 0) return;
                          setSelectedTopic(topic);
                          setRegisterModalOpen(true);
                        }}
                        className={buttonClass.primary}
                        title={
                          !isStudent
                            ? t('topics.studentOnlyRegistration')
                            : studentHasTopic
                            ? t('topics.alreadyHasTopic', 'Bạn đã có đề tài tốt nghiệp')
                            : myPendingTopicIds.size > 0
                            ? t('topics.alreadyHasPendingRegistration', 'Bạn đang có đơn đăng ký chờ duyệt')
                            : topic.status !== 'OPEN'
                            ? t('topics.registrationClosed')
                            : ''
                        }
                      >
                        {t('topics.register')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination with Inheritance */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={(p) => {
          setPage(p);
          fetchTopics(p);
        }}
      />

      {/* Topic Details Modal */}
      <Modal
        isOpen={!!selectedTopic && !registerModalOpen}
        onClose={() => setSelectedTopic(null)}
        title={selectedTopic?.title || t('topics.viewDetails')}
        maxWidth="max-w-2xl"
        footer={
          <div className="flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={() => setSelectedTopic(null)}
              className={buttonClass.secondary}
            >
              {t('common.close')}
            </button>
            {isStudent && isStudentAssignedToTopic(selectedTopic) ? (
              <span className="text-xs px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium flex items-center space-x-1.5">
                <CheckCircle className="w-4 h-4" />
                <span>{t('topics.myTopic', 'Đề tài của bạn')}</span>
              </span>
            ) : isStudent && myPendingTopicIds.has(selectedTopic?.id) ? (
              <span className="text-xs px-3 py-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                {t('enums.registrationStatus.PENDING', 'Đang chờ duyệt')}
              </span>
            ) : (
              <button
                type="button"
                disabled={!isStudent || selectedTopic?.status !== 'OPEN' || studentHasTopic || myPendingTopicIds.size > 0}
                onClick={() => {
                  if (!isStudent || selectedTopic?.status !== 'OPEN' || studentHasTopic || myPendingTopicIds.size > 0) return;
                  setRegisterModalOpen(true);
                }}
                className={buttonClass.primary}
                title={
                  !isStudent
                    ? t('topics.studentOnlyRegistration')
                    : studentHasTopic
                    ? t('topics.alreadyHasTopic', 'Bạn đã có đề tài tốt nghiệp')
                    : myPendingTopicIds.size > 0
                    ? t('topics.alreadyHasPendingRegistration', 'Bạn đang có đơn đăng ký chờ duyệt')
                    : selectedTopic?.status !== 'OPEN'
                    ? t('topics.registrationClosed')
                    : ''
                }
              >
                {t('topics.registerTopic')}
              </button>
            )}
          </div>
        }
      >
        {selectedTopic && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <StatusBadge value={selectedTopic.type} type="topicType" />
              <StatusBadge value={selectedTopic.status} />
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('common.description')}</h4>
              <p className="text-sm text-slate-700 mt-1 leading-relaxed whitespace-pre-wrap">
                {selectedTopic.description || t('topics.noDescription')}
              </p>
            </div>

            {selectedTopic.requirements && (
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {t('topics.requirements')}
                </h4>
                <p className="text-sm text-slate-700 mt-1 leading-relaxed whitespace-pre-wrap">
                  {selectedTopic.requirements}
                </p>
              </div>
            )}

            {selectedTopic.department && (
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('topics.department')}</h4>
                <p className="text-sm font-medium text-slate-800 mt-1">
                  {selectedTopic.department.name} {selectedTopic.department.code ? `(${selectedTopic.department.code})` : ''}
                </p>
              </div>
            )}

            {/* Advisors section */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('topics.instructor')}</h4>
              {selectedTopic.advisors && selectedTopic.advisors.length > 0 ? (
                <div className="mt-2 space-y-1.5">
                  {selectedTopic.advisors.map((adv, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs"
                    >
                      <div className="font-semibold text-slate-800">{formatLecturerName(adv)}</div>
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-mono text-[10px]">
                        {t(`enums.advisorRole.${adv.role || adv.advisorRole}`, (adv.role || adv.advisorRole) === 'PRIMARY' ? 'Hướng dẫn chính' : 'Đồng hướng dẫn')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 mt-1.5 italic">
                  {t('topics.deptAssigned')}
                </p>
              )}
            </div>

            {/* Assigned Team & Students section */}
            {selectedTopic.assignedTeam && (
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {t('topics.assignedTeam', 'Nhóm sinh viên thực hiện')}
                </h4>
                <div className="mt-2 p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-emerald-600" />
                      <span>{selectedTopic.assignedTeam.name}</span>
                    </span>
                    {selectedTopic.assignedTeam.leaderName && (
                      <span className="text-[11px] font-normal text-slate-500">
                        {t('teams.leader', 'Nhóm trưởng')}: <strong className="font-medium text-slate-700">{selectedTopic.assignedTeam.leaderName}</strong>
                      </span>
                    )}
                  </div>

                  {selectedTopic.assignedTeam.members && selectedTopic.assignedTeam.members.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      {selectedTopic.assignedTeam.members.map((m) => (
                        <div key={m.id || m.userId} className="flex items-center justify-between text-xs">
                          <div>
                            <span className="font-medium text-slate-800">{formatStudentTeamMember(m, { isLeader: false })}</span>
                            {m.studentCode && (
                              <span className="text-slate-400 text-[11px] font-mono ml-1.5">({m.studentCode})</span>
                            )}
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                            {m.roleInTeam === 'LEADER' ? t('teams.leader', 'Trưởng nhóm') : t('teams.member', 'Thành viên')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Targeted Majors */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('topics.major')}</h4>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selectedTopic.majors?.map((m) => (
                  <span
                    key={m.id}
                    className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium"
                  >
                    {m.name} ({m.code})
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Comparison Modal */}
      <Modal
        isOpen={comparing && !!comparisonData}
        onClose={() => setComparing(false)}
        title={t('topics.comparisonTitle')}
        maxWidth="max-w-5xl"
        footer={
          <button
            type="button"
            onClick={() => setComparing(false)}
            className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-medium hover:bg-slate-900 transition-colors cursor-pointer"
          >
            {t('common.close')}
          </button>
        }
      >
        {comparisonData && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm min-w-[650px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-3 px-4 text-left font-semibold text-slate-500 w-1/4">
                    {t('defense.rubric')}
                  </th>
                  {comparisonData.map((tItem) => (
                    <th key={tItem.id} className="py-3 px-4 text-left font-bold text-slate-800">
                      {tItem.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-500">{t('topics.topicType')}</td>
                  {comparisonData.map((tItem) => (
                    <td key={tItem.id} className="py-3 px-4 text-slate-700">
                      <StatusBadge value={tItem.type} type="topicType" />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-500">{t('topics.instructor')}</td>
                  {comparisonData.map((tItem) => (
                    <td key={tItem.id} className="py-3 px-4 text-slate-700">
                      {tItem.advisors?.map((a) => formatLecturerName(a)).filter(Boolean).join(', ') || 'N/A'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-500">{t('topics.assignedTeam', 'Nhóm thực hiện')}</td>
                  {comparisonData.map((tItem) => (
                    <td key={tItem.id} className="py-3 px-4 text-slate-700 text-xs">
                      {tItem.assignedTeam ? (
                        <div>
                          <span className="font-semibold text-emerald-800">{tItem.assignedTeam.name}</span>
                          {tItem.assignedTeam.members && (
                            <div className="text-slate-500 text-[11px] mt-0.5">
                              {tItem.assignedTeam.members.map((m) => formatStudentTeamMember(m)).join(', ')}
                            </div>
                          )}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-500">{t('topics.major')}</td>
                  {comparisonData.map((tItem) => (
                    <td key={tItem.id} className="py-3 px-4 text-slate-700">
                      {tItem.majors?.map((m) => m.name).join(', ') || t('common.all')}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-500">{t('topics.requirements')}</td>
                  {comparisonData.map((tItem) => (
                    <td key={tItem.id} className="py-3 px-4 text-slate-600 text-xs leading-relaxed">
                      {tItem.requirements || 'N/A'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-500">{t('topics.maxStudents')}</td>
                  {comparisonData.map((tItem) => (
                    <td key={tItem.id} className="py-3 px-4 text-slate-700">
                      {t('topics.maxStudentsLabel', { count: tItem.maxStudents || 3 })}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      {/* Team Registration Modal */}
      <Modal
        isOpen={registerModalOpen && !!selectedTopic}
        onClose={() => setRegisterModalOpen(false)}
        title={t('topics.confirmRegisterTitle')}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          {registerSuccess ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <span>{registerSuccess}</span>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{t('registrations.topic')}</label>
                <p className="text-sm font-semibold text-slate-800 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  {selectedTopic?.title}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {t('topics.registrationNote')}
                </label>
                <textarea
                  rows={4}
                  value={registrationMessage}
                  onChange={(e) => setRegistrationMessage(e.target.value)}
                  placeholder={t('topics.registrationNotePlaceholder')}
                  className={inputClass}
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setRegisterModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  {t('topics.submitRegistration')}
                </button>
              </div>
            </>
          )}
        </form>
      </Modal>
    </div>
  );
};

export default TopicsPage;

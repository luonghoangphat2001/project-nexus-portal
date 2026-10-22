import React, { useEffect, useMemo, useState } from 'react';
import { Download, RefreshCw, BarChart2, PieChart as PieChartIcon, TrendingUp, CheckCircle, XCircle, Award, Users, BookOpen, Clock, Building2, CheckCircle2, GraduationCap, MessageSquare, FileText, HelpCircle, Send, AlertCircle, Eye, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import councilService from '../services/councilService';
import resultsService from '../services/resultsService';
import appealService from '../services/appealService';
import { useTranslation } from '../i18n/LanguageContext';
import {
  PageHeader,
  FilterCard,
  FilterField,
  TableCard,
  TableHeaderBar,
  MetricCard,
  StatusBadge,
  Modal,
  buttonClass,
  inputClass,
  selectClass
} from '../components/common/CommonUi';
import { formatDateTime } from '../utils/dateUtils';
import { formatLecturerName, formatStudentTeamMember } from '../utils/userFormatters';

const formatDate = (date) => formatDateTime(date, '—');

const formatScore = (value) => (value != null ? Number(value).toFixed(2) : '—');
const selectedFilters = (filters) => Object.fromEntries(
  Object.entries(filters).filter(([, value]) => value),
);

export function ResultsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const isStudent = user?.roles?.includes('ROLE_USER') && !user?.roles?.includes('ROLE_ADMIN');
  const [assignments, setAssignments] = useState([]);
  const [selectedCouncilId, setSelectedCouncilId] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [grades, setGrades] = useState([]);
  const [myGrades, setMyGrades] = useState([]);
  const [myAppeals, setMyAppeals] = useState([]);
  const [appealsList, setAppealsList] = useState([]);
  const [appealingGrade, setAppealingGrade] = useState(null);
  const [appealReason, setAppealReason] = useState('');
  const [viewingAppealDetail, setViewingAppealDetail] = useState(null);
  const [processingAppeal, setProcessingAppeal] = useState(null);
  const [processingStatus, setProcessingStatus] = useState('APPROVED');
  const [processingNote, setProcessingNote] = useState('');
  const [options, setOptions] = useState({ periods: [], departments: [], topics: [] });
  const [report, setReport] = useState([]);
  const [filters, setFilters] = useState({ periodId: '', departmentId: '', topicId: '' });
  const [viewingGradeDetail, setViewingGradeDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gradesLoading, setGradesLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refresh, setRefresh] = useState(0);

  const completedAssignments = useMemo(
    () => assignments.filter((a) => a.council.status === 'COMPLETED'),
    [assignments]
  );

  // Danh sách hội đồng duy nhất từ completedAssignments
  const completedCouncils = useMemo(() => {
    const map = new Map();
    completedAssignments.forEach((a) => {
      if (a.council && !map.has(a.council.id)) {
        map.set(a.council.id, a.council);
      }
    });
    return Array.from(map.values());
  }, [completedAssignments]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    const load = isStudent
      ? Promise.all([
          resultsService.getMyPublishedResults().then((data) => { if (active) setMyGrades(data); }),
          appealService.getMyAppeals().then((data) => { if (active) setMyAppeals(data); }).catch(() => {})
        ])
      : Promise.all([
          councilService.getCouncils(),
          resultsService.getFilterOptions().catch(() => ({ periods: [], departments: [], topics: [] })),
          appealService.getAppeals().catch(() => [])
        ])
        .then(([councils, reportOptions, appealsData]) => {
          if (!active) return;
          setAssignments(
            councils
              .filter((c) => c.canManage || c.members?.some((m) => m.lecturerId === user?.id))
              .flatMap((c) => (c.assignments || []).map((assignment) => ({ ...assignment, council: c })))
          );
          setOptions(reportOptions || { periods: [], departments: [], topics: [] });
          setAppealsList(appealsData || []);
        });
    load.catch((e) => { if (active) setError(e.message || t('common.error')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isStudent, refresh, user?.id, t]);

  // Đồng bộ selectedCouncilId
  useEffect(() => {
    if (isStudent || completedCouncils.length === 0) return;
    setSelectedCouncilId((id) =>
      completedCouncils.some((c) => String(c.id) === id) ? id : String(completedCouncils[0].id)
    );
  }, [completedCouncils, isStudent]);

  // Danh sách đề tài & nhóm thuộc hội đồng đang chọn
  const councilAssignments = useMemo(() => {
    if (!selectedCouncilId) return [];
    return completedAssignments.filter((a) => String(a.council.id) === String(selectedCouncilId));
  }, [completedAssignments, selectedCouncilId]);

  // Đồng bộ selectedId (assignmentId)
  useEffect(() => {
    if (isStudent || councilAssignments.length === 0) return;
    setSelectedId((id) =>
      councilAssignments.some((a) => String(a.id) === id) ? id : String(councilAssignments[0].id)
    );
  }, [councilAssignments, isStudent]);

  const activeCouncil = useMemo(
    () => completedCouncils.find((c) => String(c.id) === String(selectedCouncilId)) || null,
    [completedCouncils, selectedCouncilId]
  );

  const activeAssignment = useMemo(
    () => councilAssignments.find((a) => String(a.id) === String(selectedId)) || councilAssignments[0] || null,
    [councilAssignments, selectedId]
  );

  useEffect(() => {
    let active = true;
    if (isStudent || !selectedId) { setGrades([]); return () => { active = false; }; }
    setGradesLoading(true);
    setError('');
    resultsService.getAssignmentScores(selectedId)
      .then((data) => { if (active) setGrades(data); })
      .catch((e) => { if (active) setError(e.message || t('common.error')); })
      .finally(() => { if (active) setGradesLoading(false); });
    return () => { active = false; };
  }, [isStudent, selectedId, refresh, t]);

  useEffect(() => {
    let active = true;
    if (isStudent) return () => { active = false; };
    setReportLoading(true);
    setError('');
    resultsService.getStatistics(selectedFilters(filters))
      .then((data) => { if (active) setReport(data); })
      .catch((e) => { if (active) setError(e.message || t('common.error')); })
      .finally(() => { if (active) setReportLoading(false); });
    return () => { active = false; };
  }, [isStudent, filters, refresh, t]);

  const runPublish = async (confirmKey, request) => {
    if (!window.confirm(t(confirmKey))) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await request();
      setNotice(t('results.publishSuccess'));
      setRefresh((n) => n + 1);
    } catch (e) {
      if (e.message && e.message.includes('There are no completed councils waiting')) {
        setError(t('results.noPendingPeriodPublish'));
      } else {
        setError(e.message || t('common.error'));
      }
    } finally {
      setBusy(false);
    }
  };

  const publish = () => activeAssignment
    && runPublish('results.confirmPublish', () => resultsService.publishAssignmentResults(activeAssignment.id));

  const republish = () => activeAssignment
    && runPublish('results.confirmRepublish', () => resultsService.republishAssignmentResults(activeAssignment.id));

  const promptScore = (key, current) => {
    const raw = window.prompt(t(key, { current: formatScore(current) }));
    if (raw === null || raw.trim() === '') return null;
    const value = Number(raw.trim());
    if (!Number.isFinite(value) || value < 0 || value > 10) throw new Error(t('results.adjustInvalidScore'));
    return value;
  };

  const adjustGrade = async (grade) => {
    try {
      const advisorScore = promptScore('results.adjustAdvisorPrompt', grade.advisorScore);
      const reviewScore = promptScore('results.adjustReviewPrompt', grade.reviewScore);
      const defenseScore = promptScore('results.adjustDefensePrompt', grade.defenseScore);
      if (advisorScore == null && reviewScore == null && defenseScore == null) {
        setError(t('results.adjustNoChange'));
        return;
      }
      const reason = window.prompt(t('results.adjustReasonPrompt'));
      if (!reason || !reason.trim()) return;
      setBusy(true);
      setError('');
      setNotice('');
      await resultsService.adjustPublishedResult(activeAssignment.id, grade.studentId,
        { advisorScore, reviewScore, defenseScore }, reason.trim());
      setNotice(t('results.adjustSuccess'));
      setRefresh((n) => n + 1);
    } catch (e) {
      setError(e.message || t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  const periodId = activeCouncil?.periodId;
  const pendingPeriodAssignments = useMemo(
    () => completedAssignments.filter(
      (assignment) => String(assignment.registration?.periodId) === String(periodId)
        && !assignment.resultsPublished,
    ),
    [completedAssignments, periodId],
  );
  const hasUnpublishedInPeriod = pendingPeriodAssignments.length > 0;

  const publishPeriod = () => periodId
    && runPublish('results.confirmPublishPeriod', () => resultsService.publishPeriodResults(periodId));

  const exportReport = async () => {
    setBusy(true);
    setError('');
    try {
      const blob = await resultsService.exportDetailedReportExcel(selectedFilters(filters));
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'academic-results-report.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      if (e.message && e.message.includes('There are no completed councils waiting')) {
        setError(t('results.noPendingPeriodPublish'));
      } else {
        setError(e.message || t('common.error'));
      }
    } finally {
      setBusy(false);
    }
  };

  const updateFilter = (key, value) =>
    setFilters((current) => ({
      ...current,
      [key]: value,
      ...(key === 'departmentId' || key === 'periodId' ? { topicId: '' } : {}),
    }));

  // === BIỂU ĐỒ & SỐ LIỆU TỔNG HỢP DỰA TRÊN DỮ LIỆU BÁO CÁO THẬT ===
  const totalStudents = report.reduce((sum, r) => sum + (Number(r.studentCount) || 0), 0);
  const totalPassed = report.reduce((sum, r) => sum + (Number(r.passCount) || 0), 0);
  const totalFailed = report.reduce((sum, r) => sum + (Number(r.failCount) || 0), 0);
  const overallAvg = totalStudents > 0
    ? (report.reduce((sum, r) => sum + (Number(r.averageFinalScore) || 0) * (Number(r.studentCount) || 0), 0) / totalStudents).toFixed(2)
    : '0.00';
  const passRate = totalStudents > 0 ? Math.round((totalPassed / totalStudents) * 100) : 0;

  // Tính tổng phân bổ phổ điểm
  const aggregatedBands = {
    BELOW_FIVE: 0,
    FIVE_TO_SIX: 0,
    SIX_TO_SEVEN: 0,
    SEVEN_TO_EIGHT: 0,
    EIGHT_TO_NINE: 0,
    NINE_TO_TEN: 0,
  };

  const normalizeBandKey = (k) => {
    switch (k) {
      case 'BELOW_FIVE':
      case '0.00-4.99':
        return 'BELOW_FIVE';
      case 'FIVE_TO_SIX':
      case '5.00-5.99':
        return 'FIVE_TO_SIX';
      case 'SIX_TO_SEVEN':
      case '6.00-6.99':
        return 'SIX_TO_SEVEN';
      case 'SEVEN_TO_EIGHT':
      case '7.00-7.99':
        return 'SEVEN_TO_EIGHT';
      case 'EIGHT_TO_NINE':
      case '8.00-8.99':
        return 'EIGHT_TO_NINE';
      case 'NINE_TO_TEN':
      case '9.00-10.00':
        return 'NINE_TO_TEN';
      default:
        return null;
    }
  };

  report.forEach(r => {
    if (r.scoreDistribution) {
      const countedBandsInRow = new Set();
      Object.entries(r.scoreDistribution).forEach(([k, v]) => {
        const normalized = normalizeBandKey(k);
        if (normalized && !countedBandsInRow.has(normalized)) {
          aggregatedBands[normalized] += Number(v) || 0;
          countedBandsInRow.add(normalized);
        }
      });
    }
  });

  const bandConfigs = [
    { key: 'BELOW_FIVE', label: t('results.bandBelowFive'), color: 'bg-rose-500', barColor: 'bg-rose-500' },
    { key: 'FIVE_TO_SIX', label: t('results.bandFiveToSix'), color: 'bg-amber-500', barColor: 'bg-amber-500' },
    { key: 'SIX_TO_SEVEN', label: t('results.bandSixToSeven'), color: 'bg-yellow-500', barColor: 'bg-yellow-500' },
    { key: 'SEVEN_TO_EIGHT', label: t('results.bandSevenToEight'), color: 'bg-blue-500', barColor: 'bg-blue-500' },
    { key: 'EIGHT_TO_NINE', label: t('results.bandEightToNine'), color: 'bg-indigo-600', barColor: 'bg-indigo-600' },
    { key: 'NINE_TO_TEN', label: t('results.bandNineToTen'), color: 'bg-emerald-600', barColor: 'bg-emerald-600' },
  ];

  const maxBandCount = Math.max(...Object.values(aggregatedBands), 1);

  if (isStudent) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <PageHeader
          title={t('results.studentTitle')}
          description={t('results.studentSubtitle')}
        />
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            {error}
          </div>
        )}
        {loading ? (
          <div className="p-16 text-center text-sm text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-blue-600" />
            <span>{t('common.loading', 'Đang tải dữ liệu...')}</span>
          </div>
        ) : myGrades.length === 0 ? (
          <div className="p-16 text-center text-sm text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-xs">
            {t('results.noPublishedStudent')}
          </div>
        ) : (
          <div className="space-y-6">
            {myGrades.map((grade) => (
              <div
                key={`${grade.assignmentId}-${grade.studentId}`}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition hover:shadow-md"
              >
                {/* Header Banner của đề tài */}
                <div className="p-6 bg-gradient-to-r from-slate-50 via-white to-blue-50/40 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-3 py-1 rounded-full font-semibold bg-blue-100/70 text-blue-800 border border-blue-200">
                        {grade.periodName}
                      </span>
                      <span className="px-3 py-1 rounded-full font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {grade.teamName}
                      </span>
                      {grade.advisorName && (
                        <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                          <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                          <span>GVHD: {grade.advisorName}</span>
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 leading-snug">
                      {grade.topicTitle}
                    </h3>
                  </div>

                  {/* Khối Điểm tổng kết & Kết quả */}
                  <div className="flex items-center gap-4 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs shrink-0 self-start lg:self-center">
                    <div className="text-right">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {t('results.finalScore', 'Điểm tổng kết')}
                      </div>
                      <div className="text-2xl font-black font-mono text-blue-600">
                        {formatScore(grade.finalScore)}
                      </div>
                    </div>
                    <div className="h-10 w-px bg-slate-200" />
                    <div>
                      <StatusBadge value={grade.passed ? 'PASSED' : 'FAILED'} type="status" />
                    </div>
                  </div>
                </div>

                {/* 3 Khối Điểm Thành phần & Nhận xét chi tiết */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* 1. Giảng viên hướng dẫn (20%) */}
                  <div className="flex flex-col bg-slate-50/60 rounded-xl border border-blue-100 p-5 space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-blue-100/80">
                      <div className="flex items-center gap-2 text-blue-900 font-bold">
                        <GraduationCap className="w-5 h-5 text-blue-600" />
                        <span>{t('results.advisorCol', 'GVHD (20%)')}</span>
                      </div>
                      <span className="text-xl font-bold font-mono text-blue-700">
                        {formatScore(grade.advisorScore)}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs py-1 bg-white p-2.5 rounded-lg border border-slate-100">
                      <div>
                        <div className="text-slate-400 font-medium">Nội dung</div>
                        <div className="font-mono font-bold text-slate-700 text-sm mt-0.5">
                          {formatScore(grade.advisorContentScore)}
                        </div>
                      </div>
                      <div className="border-x border-slate-100">
                        <div className="text-slate-400 font-medium">Triển khai</div>
                        <div className="font-mono font-bold text-slate-700 text-sm mt-0.5">
                          {formatScore(grade.advisorImplementationScore)}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 font-medium">Trình bày</div>
                        <div className="font-mono font-bold text-slate-700 text-sm mt-0.5">
                          {formatScore(grade.advisorPresentationScore)}
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col pt-1">
                      <span className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span>{t('results.advisorCommentCol', 'Nhận xét của GVHD')}</span>
                      </span>
                      <div className="flex-1 p-3.5 bg-white rounded-lg border border-blue-200/70 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed shadow-2xs">
                        {grade.advisorComment || (
                          <span className="italic text-slate-400 text-xs">Chưa có nhận xét</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 2. Cán bộ phản biện (30%) */}
                  <div className="flex flex-col bg-slate-50/60 rounded-xl border border-indigo-100 p-5 space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-indigo-100/80">
                      <div className="flex items-center gap-2 text-indigo-900 font-bold">
                        <Award className="w-5 h-5 text-indigo-600" />
                        <span>{t('results.reviewerCol', 'Phản biện (30%)')}</span>
                      </div>
                      <span className="text-xl font-bold font-mono text-indigo-700">
                        {formatScore(grade.reviewScore)}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs py-1 bg-white p-2.5 rounded-lg border border-slate-100">
                      <div>
                        <div className="text-slate-400 font-medium">Nội dung</div>
                        <div className="font-mono font-bold text-slate-700 text-sm mt-0.5">
                          {formatScore(grade.reviewContentScore)}
                        </div>
                      </div>
                      <div className="border-x border-slate-100">
                        <div className="text-slate-400 font-medium">Triển khai</div>
                        <div className="font-mono font-bold text-slate-700 text-sm mt-0.5">
                          {formatScore(grade.reviewImplementationScore)}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 font-medium">Trình bày</div>
                        <div className="font-mono font-bold text-slate-700 text-sm mt-0.5">
                          {formatScore(grade.reviewPresentationScore)}
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col pt-1">
                      <span className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{t('results.reviewerCommentCol', 'Nhận xét phản biện')}</span>
                      </span>
                      <div className="flex-1 p-3.5 bg-white rounded-lg border border-indigo-200/70 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed shadow-2xs">
                        {grade.reviewComment || (
                          <span className="italic text-slate-400 text-xs">Chưa có nhận xét</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 3. Hội đồng bảo vệ (50%) */}
                  <div className="flex flex-col bg-slate-50/60 rounded-xl border border-purple-100 p-5 space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-purple-100/80">
                      <div className="flex items-center gap-2 text-purple-900 font-bold">
                        <Users className="w-5 h-5 text-purple-600" />
                        <span>{t('results.councilCol', 'Hội đồng (50%)')}</span>
                      </div>
                      <span className="text-xl font-bold font-mono text-purple-700">
                        {formatScore(grade.defenseScore)}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs py-1 bg-white p-2.5 rounded-lg border border-slate-100">
                      <div>
                        <div className="text-slate-400 font-medium">Nội dung</div>
                        <div className="font-mono font-bold text-slate-700 text-sm mt-0.5">
                          {formatScore(grade.defenseContentScore)}
                        </div>
                      </div>
                      <div className="border-x border-slate-100">
                        <div className="text-slate-400 font-medium">Triển khai</div>
                        <div className="font-mono font-bold text-slate-700 text-sm mt-0.5">
                          {formatScore(grade.defenseImplementationScore)}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 font-medium">Trình bày</div>
                        <div className="font-mono font-bold text-slate-700 text-sm mt-0.5">
                          {formatScore(grade.defensePresentationScore)}
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col pt-1">
                      <span className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-purple-600" />
                        <span>{t('results.councilCommentCol', 'Nhận xét hội đồng')}</span>
                      </span>
                      <div className="flex-1 p-3.5 bg-white rounded-lg border border-purple-200/70 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed shadow-2xs">
                        {grade.defenseComments || (
                          <span className="italic text-slate-400 text-xs">Chưa có nhận xét</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Khối Phúc khảo & Trạng thái phúc khảo */}
                {(() => {
                  const studentAppeal = myAppeals.find(
                    (a) => String(a.assignmentId) === String(grade.assignmentId) && String(a.studentId) === String(grade.studentId)
                  );

                  return (
                    <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <HelpCircle className="w-4 h-4 text-amber-600" />
                          <span>{t('results.appealCol', 'Phúc khảo điểm')}:</span>
                        </span>
                        {studentAppeal ? (
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                              studentAppeal.status === 'PENDING'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : studentAppeal.status === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : studentAppeal.status === 'RESOLVED'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {studentAppeal.status === 'PENDING' && <Clock className="w-3.5 h-3.5" />}
                              {studentAppeal.status === 'APPROVED' && <CheckCircle2 className="w-3.5 h-3.5" />}
                              {studentAppeal.status === 'RESOLVED' && <CheckCircle className="w-3.5 h-3.5" />}
                              {studentAppeal.status === 'REJECTED' && <XCircle className="w-3.5 h-3.5" />}
                              <span>
                                {studentAppeal.status === 'PENDING'
                                  ? t('results.appealStatusPending', 'Đang chờ phúc khảo')
                                  : studentAppeal.status === 'APPROVED'
                                  ? t('results.appealStatusApproved', 'Đã tiếp nhận phúc khảo (Hội đồng xem xét chấm lại)')
                                  : studentAppeal.status === 'RESOLVED'
                                  ? t('results.appealStatusResolved', 'Đã chấm lại điểm')
                                  : t('results.appealStatusRejected', 'Từ chối phúc khảo')}
                              </span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setViewingAppealDetail(studentAppeal)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 bg-white hover:bg-blue-50 rounded-lg border border-slate-200 shadow-2xs transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{t('results.viewAppealDetail', 'Xem đơn')}</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">
                            Nếu có thắc mắc về kết quả, sinh viên có thể gửi đơn phúc khảo để Hội đồng chấm thi, Trưởng bộ môn và GVHD xem xét lại.
                          </span>
                        )}
                      </div>

                      {!studentAppeal && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            setAppealingGrade(grade);
                            setAppealReason('');
                            setError('');
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-all cursor-pointer"
                        >
                          <HelpCircle className="w-4 h-4" />
                          <span>{t('results.appealBtn', 'Yêu cầu phúc khảo')}</span>
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
        )}

        {/* Modal: Gửi đơn phúc khảo (Dành cho Sinh viên) */}
        <Modal
          isOpen={!!appealingGrade}
          onClose={() => setAppealingGrade(null)}
          title={t('results.appealModalTitle', 'Đơn xin phúc khảo điểm bảo vệ khóa luận')}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4 text-sm">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div>
                <span className="text-xs text-slate-400 block">Đề tài & Nhóm</span>
                <span className="font-bold text-slate-900">{appealingGrade?.topicTitle}</span>
                <span className="text-xs text-slate-500 block mt-0.5">Nhóm: {appealingGrade?.teamName} · Đợt: {appealingGrade?.periodName}</span>
              </div>
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-200/80 text-center text-xs">
                <div className="bg-white p-2 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block">GVHD</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">{formatScore(appealingGrade?.advisorScore)}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block">Phản biện</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">{formatScore(appealingGrade?.reviewScore)}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block">Hội đồng</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">{formatScore(appealingGrade?.defenseScore)}</span>
                </div>
                <div className="bg-blue-50 p-2 rounded-lg border border-blue-200">
                  <span className="text-blue-600 font-semibold block">Tổng kết</span>
                  <span className="font-mono font-bold text-blue-700 text-sm">{formatScore(appealingGrade?.finalScore)}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center justify-between">
                <span>{t('results.appealReasonLabel', 'Lý do xin phúc khảo')} *</span>
                <span className="text-xs text-slate-400 font-normal">Tối đa 2000 ký tự</span>
              </label>
              <textarea
                rows={4}
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                placeholder={t('results.appealReasonPlaceholder', 'Trình bày cụ thể các tiêu chí hoặc nội dung bạn mong muốn Hội đồng xem xét chấm lại...')}
                className={inputClass}
              />
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Quy trình thông báo:</strong> Ngay sau khi bạn gửi, hệ thống sẽ tự động gửi thông báo đến <strong>Tất cả thành viên Hội đồng chấm thi</strong>, <strong>Trưởng khoa / Trưởng bộ môn</strong> và <strong>Giáo viên hướng dẫn</strong> để họp xem xét bài chấm.
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={busy}
                onClick={() => setAppealingGrade(null)}
                className={buttonClass('secondary')}
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={busy || !appealReason.trim()}
                onClick={async () => {
                  if (!appealReason.trim()) return;
                  setBusy(true);
                  setError('');
                  try {
                    await appealService.submitAppeal(appealingGrade.assignmentId, { reason: appealReason.trim() });
                    setNotice(t('results.appealSubmitSuccess'));
                    setAppealingGrade(null);
                    setRefresh((n) => n + 1);
                  } catch (e) {
                    setError(e.response?.data?.message || e.message || 'Lỗi khi gửi đơn phúc khảo');
                  } finally {
                    setBusy(false);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Gửi đơn phúc khảo</span>
              </button>
            </div>
          </div>
        </Modal>

        {/* Modal: Xem chi tiết đơn phúc khảo (Dành cho Sinh viên) */}
        <Modal
          isOpen={!!viewingAppealDetail}
          onClose={() => setViewingAppealDetail(null)}
          title={t('results.viewAppealDetail', 'Chi tiết đơn phúc khảo')}
          maxWidth="max-w-lg"
        >
          <div className="space-y-4 text-sm">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">Sinh viên</span>
                <span className="font-bold text-slate-800">{viewingAppealDetail?.studentName} ({viewingAppealDetail?.studentCode})</span>
              </div>
              <div>
                <span className="text-slate-400 block">Trạng thái</span>
                <span className="font-semibold text-slate-800">{viewingAppealDetail?.status}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Ngày gửi</span>
                <span className="text-slate-700">{formatDate(viewingAppealDetail?.createdAt)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Người duyệt</span>
                <span className="text-slate-700">{viewingAppealDetail?.reviewedByName || 'Chưa duyệt'}</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-700 block mb-1">Lý do xin phúc khảo:</span>
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-800 whitespace-pre-wrap leading-relaxed">
                {viewingAppealDetail?.reason}
              </div>
            </div>

            {viewingAppealDetail?.responseNote && (
              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-1">Phản hồi của Hội đồng / Khoa:</span>
                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {viewingAppealDetail?.responseNote}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewingAppealDetail(null)}
                className={buttonClass('primary')}
              >
                Đóng
              </button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('results.adminTitle')}
        description={t('results.adminSubtitle')}
        action={
          <button
            type="button"
            disabled={busy || loading}
            onClick={() => setRefresh((n) => n + 1)}
            className={buttonClass('secondary')}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('results.refresh', 'Làm mới')}</span>
          </button>
        }
      />

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}
      {notice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
          {notice}
        </div>
      )}

      {/* KHỐI ĐƠN PHÚC KHẢO ĐIỂM (Dành cho Hội đồng & Trưởng khoa) */}
      {appealsList.length > 0 && (
        <TableCard>
          <TableHeaderBar
            title={t('results.appealsListTitle', 'Danh sách đơn phúc khảo điểm')}
            subtitle="Đơn xin phúc khảo từ sinh viên sau khi công bố kết quả bảo vệ"
            count={appealsList.length}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold text-sm">
                  <th className="py-3.5 px-4">Sinh viên</th>
                  <th className="py-3.5 px-4">Đề tài & Nhóm</th>
                  <th className="py-3.5 px-4">Lý do phúc khảo</th>
                  <th className="py-3.5 px-4 text-center">Ngày gửi</th>
                  <th className="py-3.5 px-4 text-center">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {appealsList.map((appeal) => (
                  <tr key={appeal.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{appeal.studentName}</div>
                      <div className="text-xs font-mono text-slate-400">{appeal.studentCode || `ID: ${appeal.studentId}`}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800 line-clamp-1">{appeal.topicTitle}</div>
                      <div className="text-xs text-slate-400">Nhóm: {appeal.teamName}</div>
                    </td>
                    <td className="py-3.5 px-4 max-w-[280px]">
                      <div className="line-clamp-2 text-xs text-slate-700 whitespace-pre-wrap">{appeal.reason}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(appeal.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        appeal.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : appeal.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : appeal.status === 'RESOLVED'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {appeal.status === 'PENDING' ? 'Chờ xem xét'
                          : appeal.status === 'APPROVED' ? 'Đã duyệt xem xét lại'
                          : appeal.status === 'RESOLVED' ? 'Đã hoàn tất'
                          : 'Từ chối'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingAppealDetail(appeal)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Chi tiết</span>
                        </button>
                        {(user?.roles?.includes('ROLE_ADMIN') || user?.roles?.includes('ROLE_PRINCIPAL')) && (
                          <button
                            type="button"
                            onClick={() => {
                              setProcessingAppeal(appeal);
                              setProcessingStatus(appeal.status === 'PENDING' ? 'APPROVED' : appeal.status);
                              setProcessingNote(appeal.responseNote || '');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg transition cursor-pointer"
                          >
                            <span>Xử lý</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TableCard>
      )}

      {/* KHỐI 1: TÍNH ĐIỂM & CÔNG BỐ KẾT QUẢ CHO HỘI ĐỒNG */}
      <TableCard>
        <TableHeaderBar
          title={t('results.calcPublishTitle')}
          subtitle={t('results.calcPublishFormula')}
        />

        <div className="p-5 space-y-4">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">{t('common.loading')}</div>
          ) : completedAssignments.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">{t('results.noCompletedCouncils')}</div>
          ) : (
            <>
              {/* KHỐI 2 BỘ LỌC TÁCH BIỆT: HỘI ĐỒNG CHẤM & ĐỀ TÀI BẢO VỆ */}
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4.5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Bộ lọc 1: Hội đồng chấm */}
                  <div>
                    <label className="block text-sm font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-blue-600" />
                      <span>{t('results.filterCouncil', '1. Chọn Hội đồng chấm')}</span>
                    </label>
                    <div className="relative">
                      <select
                        className={selectClass}
                        disabled={busy}
                        value={selectedCouncilId}
                        onChange={(e) => {
                          const nextCouncilId = e.target.value;
                          setSelectedCouncilId(nextCouncilId);
                          const nextAssignment = completedAssignments.find(
                            (assignment) => String(assignment.council.id) === nextCouncilId,
                          );
                          setSelectedId(nextAssignment ? String(nextAssignment.id) : '');
                        }}
                      >
                        {completedCouncils.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.room ? `— ${t('results.roomLabel')} ${c.room}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Bộ lọc 2: Đề tài & Nhóm sinh viên */}
                  <div>
                    <label className="block text-sm font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      <span>{t('results.filterTopic', '2. Chọn Đề tài & Nhóm sinh viên')}</span>
                    </label>
                    <div className="relative">
                      <select
                        className={selectClass}
                        disabled={busy || councilAssignments.length === 0}
                        value={selectedId}
                        onChange={(e) => setSelectedId(e.target.value)}
                      >
                        {councilAssignments.length === 0 ? (
                          <option value="">{t('results.noTopicsInCouncil', 'Hội đồng chưa có đề tài bảo vệ')}</option>
                        ) : (
                          councilAssignments.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.registration.topicTitle} — {t('results.teamLabel')}: {a.registration.teamName}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Dải thông tin bổ trợ Hội đồng & Đề tài đang chọn */}
                {activeCouncil && activeAssignment && (
                  <div className="pt-3 border-t border-slate-200/70 space-y-2 text-xs text-slate-600">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
                          <Building2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>{t('results.roomLabel')}: {activeCouncil.room || t('results.defaultRoom')}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{formatDate(activeCouncil.startsAt)}</span>
                        </span>
                        {activeAssignment.registration?.periodName && (
                          <span className="text-slate-500 font-medium">
                            {activeAssignment.registration.periodName}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">{t('results.publishStatus', 'Trạng thái công bố')}:</span>
                        {activeAssignment.resultsPublished ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{t('results.publishedNotice', 'Đã công bố chính thức')}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{t('results.pendingPublish', 'Chờ công bố điểm')}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Giảng viên hướng dẫn & Sinh viên thực hiện */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200/80">
                      <div className="flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span className="text-slate-500 font-normal">{t('topics.instructor', 'GVHD')}:</span>
                        <span className="font-semibold text-slate-800">
                          {activeAssignment.registration?.advisors?.length > 0
                            ? activeAssignment.registration.advisors.map((adv) => formatLecturerName(adv)).join(', ')
                            : t('topics.deptAssigned', 'Bộ môn phân công')}
                        </span>
                      </div>
                      {activeAssignment.registration?.students?.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-slate-500 shrink-0" />
                          <span className="text-slate-500 font-normal">{t('results.studentCol', 'Sinh viên')}:</span>
                          <span className="font-medium text-slate-800">
                            {activeAssignment.registration.students.map((s) => formatStudentTeamMember(s)).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {gradesLoading ? (
                <div className="p-8 text-center text-sm text-slate-500">{t('results.calculatingScores')}</div>
              ) : grades.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">{t('results.noStudentResults')}</div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-sm border-collapse min-w-[850px]">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-200 font-semibold text-slate-600">
                        <th className="py-3 px-4">{t('results.studentCol')}</th>
                        <th className="py-3 px-4 text-center">{t('results.advisorScore', 'Điểm GVHD (20%)')}</th>
                        <th className="py-3 px-4 text-center">{t('results.reviewerScore', 'Điểm phản biện (30%)')}</th>
                        <th className="py-3 px-4 text-center">{t('results.defenseScore', 'Điểm hội đồng (50%)')}</th>
                        <th className="py-3 px-4 text-center font-bold text-slate-900">{t('results.finalScore', 'Điểm tổng kết')}</th>
                        <th className="py-3 px-4 text-center">{t('results.resultCol')}</th>
                        <th className="py-3 px-4 text-center">{t('results.commentsCol', 'Nhận xét & Chi tiết')}</th>
                        <th className="py-3 px-4 text-center">{t('results.adjustCol')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {grades.map((grade) => (
                        <tr key={grade.studentId} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            <div>{formatStudentTeamMember(grade.studentName, { isLeader: false })}</div>
                            <div className="text-xs font-mono text-slate-400 font-normal">
                              {grade.studentCode || grade.studentId}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center font-mono">
                            <div className="font-semibold text-slate-800">{formatScore(grade.advisorScore)}</div>
                            {grade.advisorName && (
                              <div className="text-[11px] text-slate-400 font-sans truncate max-w-[120px] mx-auto" title={grade.advisorName}>
                                {grade.advisorName}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center font-mono">
                            <div className="font-semibold text-slate-800">{formatScore(grade.reviewScore)}</div>
                            <div className="text-[11px] text-slate-400 font-sans">
                              {formatScore(grade.reviewContentScore)} / {formatScore(grade.reviewImplementationScore)} / {formatScore(grade.reviewPresentationScore)}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center font-mono">
                            <div className="font-semibold text-slate-800">{formatScore(grade.defenseScore)}</div>
                            <div className="text-[11px] text-slate-400 font-sans">
                              {formatScore(grade.defenseContentScore)} / {formatScore(grade.defenseImplementationScore)} / {formatScore(grade.defensePresentationScore)}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center font-semibold font-mono text-blue-600 text-base">
                            {formatScore(grade.finalScore)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <StatusBadge value={grade.passed ? 'PASSED' : 'FAILED'} type="status" />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => setViewingGradeDetail(grade)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition border border-indigo-200/60 shadow-2xs"
                              title={t('results.viewComments')}
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                              <span>{t('results.viewComments', 'Xem nhận xét')}</span>
                            </button>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {grade.published && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => adjustGrade(grade)}
                                className={buttonClass.actionRow}
                                title={t('results.adjustHint')}
                              >
                                {t('results.adjustBtn')}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {grades.length > 0 && (
                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    disabled={busy || !periodId || !hasUnpublishedInPeriod}
                    onClick={publishPeriod}
                    className={buttonClass('secondary')}
                    title={
                      !hasUnpublishedInPeriod
                        ? t('results.noPendingPeriodPublish')
                        : ''
                    }
                  >
                    {!hasUnpublishedInPeriod && periodId
                      ? t('results.periodPublished')
                      : `${t('results.publishPeriodBtn')}${pendingPeriodAssignments.length > 0 ? ` (${pendingPeriodAssignments.length})` : ''}`}
                  </button>
                  <button
                    type="button"
                    disabled={busy || activeAssignment?.resultsPublished || grades.every((grade) => grade.published)}
                    onClick={publish}
                    className={buttonClass('primary')}
                  >
                    {activeAssignment?.resultsPublished || grades.every((grade) => grade.published)
                      ? t('results.publishedBtn')
                      : t('results.publishBtn')}
                  </button>
                  {activeAssignment?.resultsPublished && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={republish}
                      className={buttonClass('secondary')}
                      title={t('results.republishHint')}
                    >
                      {t('results.republishBtn')}
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </TableCard>

      {/* KHỐI 2: BIỂU ĐỒ TRỰC QUAN HÓA THỐNG KÊ HỌC VỤ (DYNAMIC ANALYTICS CHARTS) */}
      <div className="space-y-4">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            title={t('results.kpiTotalStudents')}
            value={reportLoading ? '—' : totalStudents}
            subtitle={t('results.kpiTotalStudentsSub')}
            trend={t('results.kpiTopicsCount', { count: report.length })}
            trendColor="text-blue-600"
            icon={Users}
            iconBg="bg-blue-600"
          />
          <MetricCard
            title={t('results.kpiAvgScore')}
            value={reportLoading ? '—' : overallAvg}
            subtitle={t('results.kpiAvgScoreSub')}
            trend={t('results.kpiWholeSchool')}
            trendColor="text-indigo-600"
            icon={Award}
            iconBg="bg-indigo-600"
          />
          <MetricCard
            title={t('results.kpiPassRate')}
            value={reportLoading ? '—' : `${passRate}%`}
            subtitle={t('results.kpiPassedSub', { count: totalPassed })}
            trend={t('results.kpiPassTrend')}
            trendColor="text-emerald-600"
            icon={CheckCircle}
            iconBg="bg-emerald-600"
          />
          <MetricCard
            title={t('results.kpiFailedCount')}
            value={reportLoading ? '—' : totalFailed}
            subtitle={t('results.kpiFailedSub', { percent: 100 - passRate })}
            trend={t('results.kpiFailTrend')}
            trendColor="text-rose-600"
            icon={XCircle}
            iconBg="bg-rose-600"
          />
        </div>

        {/* Biểu đồ Cột động (Bar Chart) Phổ điểm Khóa luận */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <BarChart2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {t('results.chartDistribution')}
                </h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {t('results.studentsCount', { count: totalStudents })}
              </span>
            </div>

            {totalStudents === 0 ? (
              <div className="h-60 flex items-center justify-center text-sm text-slate-400">
                {t('results.noChartData')}
              </div>
            ) : (
              <div className="py-4 space-y-4">
                <div className="h-52 flex items-end justify-between gap-3 px-2 pt-6">
                  {bandConfigs.map((band) => {
                    const count = aggregatedBands[band.key] || 0;
                    const percent = totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0;
                    const barHeightPercent = Math.max(Math.round((count / maxBandCount) * 100), 4);

                    return (
                      <div key={band.key} className="flex-1 flex flex-col items-center h-full justify-end group">
                        {/* Tooltip / Value on top */}
                        <div className="text-xs font-bold text-slate-700 mb-1.5 opacity-90 group-hover:scale-110 transition-transform font-mono">
                          {count} ({percent}%)
                        </div>

                        {/* Bar */}
                        <div className="w-full max-w-[56px] bg-slate-100 rounded-t-xl overflow-hidden h-full flex items-end">
                          <div
                            style={{ height: `${barHeightPercent}%` }}
                            className={`w-full ${band.barColor} rounded-t-lg transition-all duration-500 shadow-xs group-hover:opacity-90`}
                          />
                        </div>

                        {/* Label underneath */}
                        <span className="text-[11px] font-medium text-slate-600 mt-2 text-center line-clamp-1">
                          {band.label.split(' ')[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Chú thích biểu đồ */}
                <div className="flex flex-wrap items-center justify-center gap-4 pt-3 border-t border-slate-100 text-xs">
                  {bandConfigs.map((b) => (
                    <div key={b.key} className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${b.color}`}></span>
                      <span className="text-slate-600">{b.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Biểu đồ tròn / Thống kê tỷ lệ Đạt vs Không đạt */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <PieChartIcon className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900">
                {t('results.chartCompletionPass')}
              </h3>
            </div>

            {totalStudents === 0 ? (
              <div className="h-60 flex items-center justify-center text-sm text-slate-400">
                {t('results.noData')}
              </div>
            ) : (
              <div className="py-4 space-y-5 flex-1 flex flex-col justify-center">
                {/* Visual Progress Bars */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-semibold text-slate-800">
                    <span className="flex items-center gap-1.5 text-emerald-700">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>{t('results.passedLabel', { percent: passRate })}</span>
                    </span>
                    <span className="font-mono">{totalPassed}/{totalStudents}</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      style={{ width: `${passRate}%` }}
                      className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-semibold text-slate-800">
                    <span className="flex items-center gap-1.5 text-rose-700">
                      <XCircle className="w-4 h-4 text-rose-600" />
                      <span>{t('results.failedLabel', { percent: 100 - passRate })}</span>
                    </span>
                    <span className="font-mono">{totalFailed}/{totalStudents}</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      style={{ width: `${100 - passRate}%` }}
                      className="h-full bg-rose-500 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>

                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200/80 text-xs text-blue-800 space-y-1 mt-auto">
                  <span className="font-semibold block">{t('results.policyTitle')}</span>
                  <p className="leading-relaxed">
                    {t('results.policyText')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KHỐI 3: BẢNG BÁO CÁO HỌC VỤ CHI TIẾT THEO BỘ MÔN & ĐỀ TÀI */}
      <TableCard>
        <TableHeaderBar
          title={t('results.academicStatsTitle')}
          subtitle={t('results.academicStatsSub')}
          count={report.length}
          actions={
            <button
              type="button"
              disabled={busy || reportLoading}
              onClick={exportReport}
              className={buttonClass('secondary')}
            >
              <Download className="w-4 h-4" />
              <span>{t('results.exportExcelBtn')}</span>
            </button>
          }
        />

        {/* Filter Card for Academic Stats */}
        <div className="p-5 border-b border-slate-100 grid gap-4 md:grid-cols-3 bg-slate-50/50">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              {t('results.periodCol')}
            </label>
            <select
              className={selectClass}
              value={filters.periodId}
              onChange={(e) => updateFilter('periodId', e.target.value)}
            >
              <option value="">{t('results.allPeriods')}</option>
              {options.periods.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              {t('results.departmentCol')}
            </label>
            <select
              className={selectClass}
              value={filters.departmentId}
              onChange={(e) => updateFilter('departmentId', e.target.value)}
            >
              <option value="">{t('results.allDepartments')}</option>
              {options.departments.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              {t('results.topicCol')}
            </label>
            <select
              className={selectClass}
              value={filters.topicId}
              onChange={(e) => updateFilter('topicId', e.target.value)}
            >
              <option value="">{t('results.allTopics')}</option>
              {options.topics
                .filter(
                  (topic) =>
                    (!filters.departmentId || String(topic.departmentId) === filters.departmentId) &&
                    (!filters.periodId || String(topic.periodId) === filters.periodId)
                )
                .map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.title || option.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {reportLoading ? (
          <div className="p-12 text-center text-sm text-slate-500">{t('results.loadingReport')}</div>
        ) : report.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">{t('results.noReportData')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse min-w-[750px]">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 font-semibold text-slate-600">
                  <th className="py-3.5 px-4">{t('results.periodCol')}</th>
                  <th className="py-3.5 px-4">{t('results.departmentCol')}</th>
                  <th className="py-3.5 px-4">{t('results.topicCol')}</th>
                  <th className="py-3.5 px-3 text-center">{t('results.studentsCountCol')}</th>
                  <th className="py-3.5 px-3 text-center">{t('results.avgScoreCol')}</th>
                  <th className="py-3.5 px-3 text-center">{t('results.passedCountCol')}</th>
                  <th className="py-3.5 px-3 text-center">{t('results.failedCountCol')}</th>
                  <th className="py-3.5 px-4">{t('results.scoreDistCol')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {report.map((row) => (
                  <tr key={`${row.periodId}-${row.departmentId}-${row.topicId}`} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-medium text-slate-800">{row.periodName}</td>
                    <td className="py-3.5 px-4">{row.departmentName}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{row.topicTitle}</td>
                    <td className="py-3.5 px-3 text-center font-mono font-medium">{row.studentCount}</td>
                    <td className="py-3.5 px-3 text-center font-semibold font-mono text-blue-600 text-base">
                      {formatScore(row.averageFinalScore)}
                    </td>
                    <td className="py-3.5 px-3 text-center font-semibold text-emerald-600 font-mono">
                      {row.passCount}
                    </td>
                    <td className="py-3.5 px-3 text-center font-semibold text-rose-600 font-mono">
                      {row.failCount}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(row.scoreDistribution || {}).map(([band, count]) => {
                          if (!count) return null;
                          return (
                            <span key={band} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">
                              {band.replace('BELOW_FIVE', '<5').replace('FIVE_TO_SIX', '5-6.4').replace('SIX_TO_SEVEN', '6.5-6.9').replace('SEVEN_TO_EIGHT', '7-7.9').replace('EIGHT_TO_NINE', '8-8.9').replace('NINE_TO_TEN', '9-10')}: <strong>{count}</strong>
                            </span>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>

      {/* Modal Chi tiết Nhận xét & Điểm thành phần */}
      {viewingGradeDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {t('results.commentsDetailTitle', 'Chi tiết Điểm & Nhận xét Đánh giá')}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {formatStudentTeamMember(viewingGradeDetail.studentName)} ({viewingGradeDetail.studentCode || viewingGradeDetail.studentId})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingGradeDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-sm">
              {/* Nhận xét GVHD */}
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-blue-900 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                    <span>{t('results.advisorAssessment', '1. Giảng viên hướng dẫn')}</span>
                    {viewingGradeDetail.advisorName && (
                      <span className="text-xs font-normal text-blue-700">({viewingGradeDetail.advisorName})</span>
                    )}
                  </div>
                  <span className="font-mono font-bold text-blue-700 text-sm">
                    {formatScore(viewingGradeDetail.advisorScore)} / 10
                  </span>
                </div>
                {(viewingGradeDetail.advisorContentScore != null || viewingGradeDetail.advisorImplementationScore != null || viewingGradeDetail.advisorPresentationScore != null) && (
                  <div className="text-xs text-blue-600/80 font-mono flex flex-wrap gap-4 pt-0.5">
                    <span>Nội dung: {formatScore(viewingGradeDetail.advisorContentScore)}</span>
                    <span>Triển khai: {formatScore(viewingGradeDetail.advisorImplementationScore)}</span>
                    <span>Trình bày: {formatScore(viewingGradeDetail.advisorPresentationScore)}</span>
                  </div>
                )}
                <div className="pt-1.5 text-xs text-slate-700 whitespace-pre-wrap bg-white/80 p-3 rounded-lg border border-blue-100 leading-relaxed">
                  <div className="font-semibold text-slate-600 mb-1">{t('results.advisorCommentCol', 'Nhận xét GVHD')}:</div>
                  {viewingGradeDetail.advisorComment || <span className="italic text-slate-400">{t('results.noComment', 'Chưa có nhận xét')}</span>}
                </div>
              </div>

              {/* Nhận xét Cán bộ Phản biện */}
              <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-indigo-900 flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-600" />
                    <span>{t('results.reviewerAssessment', '2. Cán bộ phản biện')}</span>
                  </div>
                  <span className="font-mono font-bold text-indigo-700 text-sm">
                    {formatScore(viewingGradeDetail.reviewScore)} / 10
                  </span>
                </div>
                {(viewingGradeDetail.reviewContentScore != null || viewingGradeDetail.reviewImplementationScore != null || viewingGradeDetail.reviewPresentationScore != null) && (
                  <div className="text-xs text-indigo-600/80 font-mono flex flex-wrap gap-4 pt-0.5">
                    <span>Nội dung: {formatScore(viewingGradeDetail.reviewContentScore)}</span>
                    <span>Triển khai: {formatScore(viewingGradeDetail.reviewImplementationScore)}</span>
                    <span>Trình bày: {formatScore(viewingGradeDetail.reviewPresentationScore)}</span>
                  </div>
                )}
                <div className="pt-1.5 text-xs text-slate-700 whitespace-pre-wrap bg-white/80 p-3 rounded-lg border border-indigo-100 leading-relaxed">
                  <div className="font-semibold text-slate-600 mb-1">{t('results.reviewerCommentCol', 'Nhận xét phản biện')}:</div>
                  {viewingGradeDetail.reviewComment || <span className="italic text-slate-400">{t('results.noComment', 'Chưa có nhận xét')}</span>}
                </div>
              </div>

              {/* Nhận xét Hội đồng */}
              <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-purple-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-600" />
                    <span>{t('results.councilAssessment', '3. Hội đồng bảo vệ')}</span>
                  </div>
                  <span className="font-mono font-bold text-purple-700 text-sm">
                    {formatScore(viewingGradeDetail.defenseScore)} / 10
                  </span>
                </div>
                {(viewingGradeDetail.defenseContentScore != null || viewingGradeDetail.defenseImplementationScore != null || viewingGradeDetail.defensePresentationScore != null) && (
                  <div className="text-xs text-purple-600/80 font-mono flex flex-wrap gap-4 pt-0.5">
                    <span>Nội dung: {formatScore(viewingGradeDetail.defenseContentScore)}</span>
                    <span>Triển khai: {formatScore(viewingGradeDetail.defenseImplementationScore)}</span>
                    <span>Trình bày: {formatScore(viewingGradeDetail.defensePresentationScore)}</span>
                  </div>
                )}
                <div className="pt-1.5 text-xs text-slate-700 whitespace-pre-wrap bg-white/80 p-3 rounded-lg border border-purple-100 leading-relaxed">
                  <div className="font-semibold text-slate-600 mb-1">{t('results.councilCommentCol', 'Nhận xét hội đồng')}:</div>
                  {viewingGradeDetail.defenseComments || <span className="italic text-slate-400">{t('results.noComment', 'Chưa có nhận xét')}</span>}
                </div>
              </div>

              {/* Summary Bar */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500">{t('results.finalScore', 'Điểm tổng kết')}:</span>
                  <div className="text-lg font-bold font-mono text-blue-600">{formatScore(viewingGradeDetail.finalScore)}</div>
                </div>
                <div>
                  <StatusBadge value={viewingGradeDetail.passed ? 'PASSED' : 'FAILED'} type="status" />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 flex justify-end bg-slate-50/60 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setViewingGradeDetail(null)}
                className={buttonClass('secondary')}
              >
                {t('common.close', 'Đóng')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Xem chi tiết đơn phúc khảo (Dành cho Cán bộ / Hội đồng) */}
      <Modal
        isOpen={!isStudent && !!viewingAppealDetail}
        onClose={() => setViewingAppealDetail(null)}
        title={t('results.viewAppealDetail', 'Chi tiết đơn phúc khảo')}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4 text-sm">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block">Sinh viên</span>
              <span className="font-bold text-slate-800">{viewingAppealDetail?.studentName} ({viewingAppealDetail?.studentCode})</span>
            </div>
            <div>
              <span className="text-slate-400 block">Trạng thái</span>
              <span className="font-semibold text-slate-800">{viewingAppealDetail?.status}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Ngày gửi</span>
              <span className="text-slate-700">{formatDate(viewingAppealDetail?.createdAt)}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Người duyệt</span>
              <span className="text-slate-700">{viewingAppealDetail?.reviewedByName || 'Chưa duyệt'}</span>
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-700 block mb-1">Lý do xin phúc khảo:</span>
            <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-800 whitespace-pre-wrap leading-relaxed">
              {viewingAppealDetail?.reason}
            </div>
          </div>

          {viewingAppealDetail?.responseNote && (
            <div>
              <span className="text-xs font-semibold text-slate-700 block mb-1">Phản hồi của Hội đồng / Khoa:</span>
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-slate-800 whitespace-pre-wrap leading-relaxed">
                {viewingAppealDetail?.responseNote}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setViewingAppealDetail(null)}
              className={buttonClass('primary')}
            >
              Đóng
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Xử lý đơn phúc khảo (Dành cho Admin / Trưởng khoa) */}
      <Modal
        isOpen={!!processingAppeal}
        onClose={() => setProcessingAppeal(null)}
        title="Xử lý đơn phúc khảo điểm"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4 text-sm">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
            <div><strong>Sinh viên:</strong> {processingAppeal?.studentName} ({processingAppeal?.studentCode})</div>
            <div><strong>Đề tài:</strong> {processingAppeal?.topicTitle}</div>
            <div><strong>Lý do xin phúc khảo:</strong> {processingAppeal?.reason}</div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">
              Cập nhật trạng thái *
            </label>
            <select
              className={selectClass}
              value={processingStatus}
              onChange={(e) => setProcessingStatus(e.target.value)}
            >
              <option value="APPROVED">Chấp nhận phúc khảo (Hội đồng sẽ họp xem xét chấm lại)</option>
              <option value="REJECTED">Từ chối phúc khảo (Giữ nguyên kết quả hiện tại)</option>
              <option value="RESOLVED">Đã hoàn tất chấm lại / Cập nhật điểm</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">
              Ghi chú phản hồi cho sinh viên
            </label>
            <textarea
              rows={3}
              value={processingNote}
              onChange={(e) => setProcessingNote(e.target.value)}
              placeholder="Nhập ghi chú phản hồi của Khoa / Hội đồng..."
              className={inputClass}
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              disabled={busy}
              onClick={() => setProcessingAppeal(null)}
              className={buttonClass('secondary')}
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError('');
                try {
                  await appealService.updateAppealStatus(processingAppeal.id, {
                    status: processingStatus,
                    responseNote: processingNote.trim()
                  });
                  setNotice('Đã cập nhật trạng thái đơn phúc khảo và gửi thông báo cho sinh viên!');
                  setProcessingAppeal(null);
                  setRefresh((n) => n + 1);
                } catch (e) {
                  setError(e.response?.data?.message || e.message || 'Lỗi khi cập nhật trạng thái');
                } finally {
                  setBusy(false);
                }
              }}
              className={buttonClass('primary')}
            >
              Lưu & Thông báo
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ResultsPage;

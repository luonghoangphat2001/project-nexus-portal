import React, { useEffect, useMemo, useState } from 'react';
import { Download, RefreshCw, BarChart2, PieChart as PieChartIcon, TrendingUp, CheckCircle, XCircle, Award, Users, BookOpen, Clock, Building2, CheckCircle2, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import councilService from '../services/councilService';
import resultsService from '../services/resultsService';
import { useTranslation } from '../i18n/LanguageContext';
import {
  PageHeader,
  FilterCard,
  FilterField,
  TableCard,
  TableHeaderBar,
  MetricCard,
  StatusBadge,
  buttonClass,
  inputClass,
  selectClass
} from '../components/common/CommonUi';

function formatDate(date) {
  if (!date) return '—';
  try {
    return new Date(date).toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(date);
  }
}

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
  const [options, setOptions] = useState({ periods: [], departments: [], topics: [] });
  const [report, setReport] = useState([]);
  const [filters, setFilters] = useState({ periodId: '', departmentId: '', topicId: '' });
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
      ? resultsService.getMyPublishedResults().then((data) => { if (active) setMyGrades(data); })
      : Promise.all([councilService.getCouncils(), resultsService.getFilterOptions()])
        .then(([councils, reportOptions]) => {
          if (!active) return;
          setAssignments(
            councils
              .filter((c) => c.canManage)
              .flatMap((c) => c.assignments.map((assignment) => ({ ...assignment, council: c })))
          );
          setOptions(reportOptions);
        });
    load.catch((e) => { if (active) setError(e.message || t('common.error')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isStudent, refresh, t]);

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

  const publish = () => selectedId
    && runPublish('results.confirmPublish', () => resultsService.publishAssignmentResults(selectedId));

  const periodId = activeAssignment?.registration?.periodId;
  const hasUnpublishedInPeriod = useMemo(() => {
    if (!periodId) return false;
    return completedAssignments.some(
      (a) => a.registration?.periodId === periodId && !a.resultsPublished
    );
  }, [completedAssignments, periodId]);

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
      <div className="space-y-6">
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
          <div className="p-12 text-center text-sm text-slate-500 bg-white rounded-2xl border border-slate-200">
            {t('common.loading')}
          </div>
        ) : myGrades.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500 bg-white rounded-2xl border border-slate-200">
            {t('results.noPublishedStudent')}
          </div>
        ) : (
          <TableCard>
            <TableHeaderBar
              title={t('results.studentTitle')}
              count={myGrades.length}
            />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 font-semibold text-slate-600">
                    <th className="py-3.5 px-4">{t('results.periodCol')}</th>
                    <th className="py-3.5 px-4">{t('results.topicCol')}</th>
                    <th className="py-3.5 px-4">{t('results.advisorCol')}</th>
                    <th className="py-3.5 px-4 text-center">{t('results.reviewerCol')}</th>
                    <th className="py-3.5 px-4 text-center">{t('results.councilCol')}</th>
                    <th className="py-3.5 px-4 text-center font-bold text-slate-900">{t('results.finalScore', 'Điểm tổng kết')}</th>
                    <th className="py-3.5 px-4 text-center">{t('results.resultCol')}</th>
                    <th className="py-3.5 px-4">{t('results.advisorCommentCol')}</th>
                    <th className="py-3.5 px-4">{t('results.reviewerCommentCol')}</th>
                    <th className="py-3.5 px-4">{t('results.councilCommentCol')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {myGrades.map((grade) => (
                    <tr key={`${grade.assignmentId}-${grade.studentId}`} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 font-medium text-slate-800">{grade.periodName}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{grade.topicTitle}</div>
                        <div className="text-xs text-slate-500 font-normal">{grade.teamName}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono">{formatScore(grade.advisorScore)}</div>
                        <div className="text-xs text-slate-500">{grade.advisorName}</div>
                        <div className="text-xs text-slate-500">{t('results.componentsLabel')}: {formatScore(grade.advisorContentScore)} / {formatScore(grade.advisorImplementationScore)} / {formatScore(grade.advisorPresentationScore)}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono">
                        {formatScore(grade.reviewScore)}
                        <div className="text-xs text-slate-500 font-sans">{t('results.criteriaLabel')}: {formatScore(grade.reviewContentScore)} / {formatScore(grade.reviewImplementationScore)} / {formatScore(grade.reviewPresentationScore)}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono">
                        {formatScore(grade.defenseScore)}
                        <div className="text-xs text-slate-500 font-sans">{t('results.criteriaLabel')}: {formatScore(grade.defenseContentScore)} / {formatScore(grade.defenseImplementationScore)} / {formatScore(grade.defensePresentationScore)}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold font-mono text-blue-600 text-base">{formatScore(grade.finalScore)}</td>
                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge value={grade.passed ? 'PASSED' : 'FAILED'} type="status" />
                      </td>
                      <td className="py-3.5 px-4 whitespace-pre-wrap">{grade.advisorComment || '—'}</td>
                      <td className="py-3.5 px-4 whitespace-pre-wrap">{grade.reviewComment || '—'}</td>
                      <td className="py-3.5 px-4 whitespace-pre-wrap">{grade.defenseComments || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TableCard>
        )}
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
                        onChange={(e) => setSelectedCouncilId(e.target.value)}
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
                            ? activeAssignment.registration.advisors.map((adv) => adv.fullName).join(', ')
                            : t('topics.deptAssigned', 'Bộ môn phân công')}
                        </span>
                      </div>
                      {activeAssignment.registration?.students?.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-slate-500 shrink-0" />
                          <span className="text-slate-500 font-normal">{t('results.studentCol', 'Sinh viên')}:</span>
                          <span className="font-medium text-slate-800">
                            {activeAssignment.registration.students.map((s) => `${s.fullName} (${s.studentCode || s.id})`).join(', ')}
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
                  <table className="w-full text-left text-sm border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-200 font-semibold text-slate-600">
                        <th className="py-3 px-4">{t('results.studentCol')}</th>
                        <th className="py-3 px-4 text-center">{t('results.reviewerScore', 'Điểm phản biện')}</th>
                        <th className="py-3 px-4 text-center">{t('results.defenseScore')}</th>
                        <th className="py-3 px-4 text-center font-bold text-slate-900">{t('results.finalScore', 'Điểm tổng kết')}</th>
                        <th className="py-3 px-4 text-center">{t('results.resultCol')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {grades.map((grade) => (
                        <tr key={grade.studentId} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            <div>{grade.studentName}</div>
                            <div className="text-xs font-mono text-slate-400 font-normal">
                              {grade.studentCode || grade.studentId}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center font-mono">{formatScore(grade.reviewScore)}</td>
                          <td className="py-3 px-4 text-center font-mono">{formatScore(grade.defenseScore)}</td>
                          <td className="py-3 px-4 text-center font-semibold font-mono text-blue-600 text-base">
                            {formatScore(grade.finalScore)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <StatusBadge value={grade.passed ? 'PASSED' : 'FAILED'} type="status" />
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
                      : t('results.publishPeriodBtn')}
                  </button>
                  <button
                    type="button"
                    disabled={busy || grades.every((grade) => grade.published)}
                    onClick={publish}
                    className={buttonClass('primary')}
                  >
                    {grades.every((grade) => grade.published) ? t('results.publishedBtn') : t('results.publishBtn')}
                  </button>
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
    </div>
  );
}

export default ResultsPage;

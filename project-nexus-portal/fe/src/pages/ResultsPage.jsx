import React, { useEffect, useMemo, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import councilService from '../services/councilService';
import scoreCalculationService from '../services/scoreCalculationService';
import resultsService from '../services/resultsService';
import { useTranslation } from '../i18n/LanguageContext';
import { Banner, Button, Empty, Field, Panel, inputClass } from '../components/common/DefenseUi';
import { StatusBadge } from '../components/common/CommonUi';

const formatScore = (value) => Number(value).toFixed(2);
const selectedFilters = (filters) => Object.fromEntries(
  Object.entries(filters).filter(([, value]) => value),
);

export function ResultsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const isStudent = user?.roles?.includes('ROLE_USER') && !user?.roles?.includes('ROLE_ADMIN');
  const [assignments, setAssignments] = useState([]);
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

  useEffect(() => {
    if (isStudent || completedAssignments.length === 0) return;
    setSelectedId((id) => completedAssignments.some((a) => String(a.id) === id) ? id : String(completedAssignments[0].id));
  }, [completedAssignments, isStudent]);

  useEffect(() => {
    let active = true;
    if (isStudent || !selectedId) { setGrades([]); return () => { active = false; }; }
    setGradesLoading(true);
    setError('');
    scoreCalculationService.getAssignmentScores(selectedId)
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

  const publish = async () => {
    if (!selectedId || !window.confirm(t('results.confirmPublish'))) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await resultsService.publishAssignmentResults(selectedId);
      setNotice(t('results.publishSuccess'));
      setRefresh((n) => n + 1);
    } catch (e) {
      setError(e.message || t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  const exportReport = async () => {
    setBusy(true);
    setError('');
    try {
      const blob = await resultsService.exportStatisticsCsv(selectedFilters(filters));
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'academic-results-report.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message || t('common.error'));
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

  if (isStudent) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{t('results.studentTitle')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('results.studentSubtitle')}</p>
        </div>
        <Banner error={error} notice={notice} />
        {loading ? (
          <Empty>{t('common.loading')}</Empty>
        ) : myGrades.length === 0 ? (
          <Panel><Empty>{t('results.noPublishedStudent')}</Empty></Panel>
        ) : (
          <Panel className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3">{t('results.periodCol')}</th>
                  <th className="p-3">{t('results.topicCol')}</th>
                  <th className="p-3">{t('results.reviewerScore')}</th>
                  <th className="p-3">{t('results.defenseScore')}</th>
                  <th className="p-3">{t('results.finalScore')}</th>
                  <th className="p-3">{t('results.resultCol')}</th>
                </tr>
              </thead>
              <tbody>
                {myGrades.map((grade) => (
                  <tr key={`${grade.assignmentId}-${grade.studentId}`} className="border-t border-slate-100 hover:bg-slate-50/50">
                    <td className="p-3">{grade.periodName}</td>
                    <td className="p-3 font-medium text-slate-800">{grade.topicTitle} · <span className="text-slate-500 font-normal">{grade.teamName}</span></td>
                    <td className="p-3 font-mono">{formatScore(grade.reviewScore)}</td>
                    <td className="p-3 font-mono">{formatScore(grade.defenseScore)}</td>
                    <td className="p-3 font-semibold font-mono">{formatScore(grade.finalScore)}</td>
                    <td className="p-3">
                      <StatusBadge value={grade.passed ? 'PASSED' : 'FAILED'} type="status" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{t('results.adminTitle')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('results.adminSubtitle')}</p>
        </div>
        <Button secondary disabled={busy || loading} onClick={() => setRefresh((n) => n + 1)}>
          <RefreshCw size={16} />
          <span>{t('results.refresh')}</span>
        </Button>
      </div>

      <Banner error={error} notice={notice} />

      <Panel className="space-y-4">
        <div>
          <h2 className="font-semibold text-slate-800">{t('results.calcPublishTitle')}</h2>
          <p className="mt-1 text-xs text-slate-500">{t('results.calcPublishFormula')}</p>
        </div>

        {loading ? (
          <Empty>{t('common.loading')}</Empty>
        ) : completedAssignments.length === 0 ? (
          <Empty>{t('results.noCompletedCouncils')}</Empty>
        ) : (
          <>
            <Field label={t('results.councilTeamTopic')}>
              <select
                className={inputClass}
                disabled={busy}
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                {completedAssignments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.council.name} · {a.registration.teamName} · {a.registration.topicTitle}
                  </option>
                ))}
              </select>
            </Field>

            {gradesLoading ? (
              <Empty>{t('results.calculatingScores')}</Empty>
            ) : grades.length === 0 ? (
              <Empty>{t('results.noStudentResults')}</Empty>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="p-3">{t('results.studentCol')}</th>
                      <th className="p-3">{t('results.reviewerScore')}</th>
                      <th className="p-3">{t('results.defenseScore')}</th>
                      <th className="p-3">{t('results.finalScore')}</th>
                      <th className="p-3">{t('results.resultCol')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map((grade) => (
                      <tr key={grade.studentId} className="border-t border-slate-100 hover:bg-slate-50/50">
                        <td className="p-3 font-medium text-slate-800">{grade.studentName} · <span className="text-slate-400 font-mono text-xs">{grade.studentCode || grade.studentId}</span></td>
                        <td className="p-3 font-mono">{formatScore(grade.reviewScore)}</td>
                        <td className="p-3 font-mono">{formatScore(grade.defenseScore)}</td>
                        <td className="p-3 font-semibold font-mono">{formatScore(grade.finalScore)}</td>
                        <td className="p-3">
                          <StatusBadge value={grade.passed ? 'PASSED' : 'FAILED'} type="status" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {grades.length > 0 && (
              <Button disabled={busy || grades.every((grade) => grade.published)} onClick={publish}>
                {grades.every((grade) => grade.published) ? t('results.publishedBtn') : t('results.publishBtn')}
              </Button>
            )}
          </>
        )}
      </Panel>

      <Panel className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-slate-800">{t('results.academicStatsTitle')}</h2>
            <p className="mt-1 text-xs text-slate-500">{t('results.academicStatsSub')}</p>
          </div>
          <Button secondary disabled={busy || reportLoading} onClick={exportReport}>
            <Download size={16} />
            <span>{t('results.exportCsv')}</span>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Field label={t('results.periodCol')}>
            <select
              className={inputClass}
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
          </Field>

          <Field label={t('results.departmentCol')}>
            <select
              className={inputClass}
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
          </Field>

          <Field label={t('results.topicCol')}>
            <select
              className={inputClass}
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
                    {option.name}
                  </option>
                ))}
            </select>
          </Field>
        </div>

        {reportLoading ? (
          <Empty>{t('results.loadingReport')}</Empty>
        ) : report.length === 0 ? (
          <Empty>{t('results.noReportData')}</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3">{t('results.periodCol')}</th>
                  <th className="p-3">{t('results.departmentCol')}</th>
                  <th className="p-3">{t('results.topicCol')}</th>
                  <th className="p-3">{t('results.studentsCountCol')}</th>
                  <th className="p-3">{t('results.avgScoreCol')}</th>
                  <th className="p-3">{t('results.passedCountCol')}</th>
                  <th className="p-3">{t('results.failedCountCol')}</th>
                  <th className="p-3">{t('results.scoreDistCol')}</th>
                </tr>
              </thead>
              <tbody>
                {report.map((row) => (
                  <tr key={`${row.periodId}-${row.departmentId}-${row.topicId}`} className="border-t border-slate-100 align-top hover:bg-slate-50/50">
                    <td className="p-3">{row.periodName}</td>
                    <td className="p-3">{row.departmentName}</td>
                    <td className="p-3 font-medium text-slate-800">{row.topicTitle}</td>
                    <td className="p-3 font-mono">{row.studentCount}</td>
                    <td className="p-3 font-semibold font-mono">{formatScore(row.averageFinalScore)}</td>
                    <td className="p-3 font-medium text-emerald-700 font-mono">{row.passCount}</td>
                    <td className="p-3 font-medium text-rose-700 font-mono">{row.failCount}</td>
                    <td className="p-3 text-xs">
                      {Object.entries(row.scoreDistribution).map(([band, count]) => (
                        <span key={band} className="block text-slate-600 font-mono">
                          {band}: <strong>{count}</strong>
                        </span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

export default ResultsPage;

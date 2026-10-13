import React, { useEffect, useMemo, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import councilService from '../services/councilService';
import scoreCalculationService from '../services/scoreCalculationService';
import resultPublicationService from '../services/resultPublicationService';
import resultStatisticsService from '../services/resultStatisticsService';
import { Banner, Button, Empty, Field, Panel, inputClass } from '../components/common/DefenseUi';

const formatScore = (value) => Number(value).toFixed(2);
const selectedFilters = (filters) => Object.fromEntries(
  Object.entries(filters).filter(([, value]) => value),
);

export function ResultsPage() {
  const { user } = useAuth();
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
  const completedAssignments = useMemo(() => assignments.filter((a) => a.council.status === 'COMPLETED'), [assignments]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    const load = isStudent
      ? resultPublicationService.getMyPublishedResults().then((data) => { if (active) setMyGrades(data); })
      : Promise.all([councilService.getCouncils(), resultStatisticsService.getFilterOptions()])
        .then(([councils, reportOptions]) => {
          if (!active) return;
          setAssignments(councils.filter((c) => c.canManage).flatMap((c) =>
            c.assignments.map((assignment) => ({ ...assignment, council: c }))));
          setOptions(reportOptions);
        });
    load.catch((e) => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isStudent, refresh]);

  useEffect(() => {
    if (isStudent || completedAssignments.length === 0) return;
    setSelectedId((id) => completedAssignments.some((a) => String(a.id) === id) ? id : String(completedAssignments[0].id));
  }, [completedAssignments, isStudent]);

  useEffect(() => {
    let active = true;
    if (isStudent || !selectedId) { setGrades([]); return () => { active = false; }; }
    setGradesLoading(true);
    setError('');
    scoreCalculationService.getAssignmentScores(selectedId).then((data) => { if (active) setGrades(data); })
      .catch((e) => { if (active) setError(e.message); })
      .finally(() => { if (active) setGradesLoading(false); });
    return () => { active = false; };
  }, [isStudent, selectedId, refresh]);

  useEffect(() => {
    let active = true;
    if (isStudent) return () => { active = false; };
    setReportLoading(true);
    setError('');
    resultStatisticsService.getStatistics(selectedFilters(filters)).then((data) => { if (active) setReport(data); })
      .catch((e) => { if (active) setError(e.message); })
      .finally(() => { if (active) setReportLoading(false); });
    return () => { active = false; };
  }, [isStudent, filters, refresh]);

  const publish = async () => {
    if (!selectedId || !window.confirm('Publish results for this team? Published scores cannot be changed.')) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await resultPublicationService.publishAssignmentResults(selectedId);
      setNotice('Results published for all team members.');
      setRefresh((n) => n + 1);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const exportReport = async () => {
    setBusy(true);
    setError('');
    try {
      const blob = await resultStatisticsService.exportStatisticsCsv(selectedFilters(filters));
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'bao-cao-thong-ke-diem-hoc-tap.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const updateFilter = (key, value) => setFilters((current) => ({
    ...current,
    [key]: value,
    ...(key === 'departmentId' || key === 'periodId' ? { topicId: '' } : {}),
  }));

  if (isStudent) {
    return <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800">My Defense Results</h1>
        <p className="mt-1 text-sm text-slate-500">Only officially published results are shown.</p></div>
      <Banner error={error} notice={notice} />
      {loading ? <Empty>Loading results...</Empty> : myGrades.length === 0
        ? <Panel><Empty>No results have been published yet.</Empty></Panel>
        : <Panel className="overflow-x-auto"><table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-500"><tr>
            <th className="p-3">Registration Period</th><th className="p-3">Topic</th><th className="p-3">Reviewer Score</th>
            <th className="p-3">Defense Score</th><th className="p-3">Final Score</th><th className="p-3">Result</th>
          </tr></thead>
          <tbody>{myGrades.map((grade) => <tr key={`${grade.assignmentId}-${grade.studentId}`} className="border-t border-slate-100">
            <td className="p-3">{grade.periodName}</td><td className="p-3">{grade.topicTitle} · {grade.teamName}</td>
            <td className="p-3">{formatScore(grade.reviewScore)}</td><td className="p-3">{formatScore(grade.defenseScore)}</td>
            <td className="p-3 font-semibold">{formatScore(grade.finalScore)}</td>
            <td className={`p-3 font-medium ${grade.passed ? 'text-emerald-700' : 'text-rose-700'}`}>{grade.passed ? 'Passed' : 'Failed'}</td>
          </tr>)}</tbody>
        </table></Panel>}
    </div>;
  }

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div>
      <h1 className="text-2xl font-bold text-slate-800">Score Calculation, Publication, and Academic Reports</h1>
      <p className="mt-1 text-sm text-slate-500">Calculate defense scores, publish results, and review academic statistics.</p>
    </div><Button secondary disabled={busy || loading} onClick={() => setRefresh((n) => n + 1)}><RefreshCw size={16} />Refresh</Button></div>
    <Banner error={error} notice={notice} />
    <Panel className="space-y-4">
      <div><h2 className="font-semibold text-slate-800">Calculate and Publish Results</h2>
        <p className="mt-1 text-xs text-slate-500">Final score = 30% reviewer score + 70% defense score. Each assessment averages three criteria; scores of 5.00 or higher pass.</p></div>
      {loading ? <Empty>Loading completed assignments...</Empty> : completedAssignments.length === 0
        ? <Empty>No completed council assignments are available in your managed departments.</Empty>
        : <>
          <Field label="Council / Team / Topic"><select className={inputClass} disabled={busy}
            value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            {completedAssignments.map((a) => <option key={a.id} value={a.id}>
              {a.council.name} · {a.registration.teamName} · {a.registration.topicTitle}
            </option>)}
          </select></Field>
            {gradesLoading ? <Empty>Calculating final scores...</Empty> : grades.length === 0
            ? <Empty>No student results to display.</Empty>
            : <div className="overflow-x-auto"><table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500"><tr>
                <th className="p-3">Student</th><th className="p-3">Reviewer Score</th><th className="p-3">Defense Score</th>
                <th className="p-3">Final Score</th><th className="p-3">Result</th>
              </tr></thead>
              <tbody>{grades.map((grade) => <tr key={grade.studentId} className="border-t border-slate-100">
                <td className="p-3">{grade.studentName} · {grade.studentCode || grade.studentId}</td>
                <td className="p-3">{formatScore(grade.reviewScore)}</td><td className="p-3">{formatScore(grade.defenseScore)}</td>
                <td className="p-3 font-semibold">{formatScore(grade.finalScore)}</td>
                <td className={`p-3 font-medium ${grade.passed ? 'text-emerald-700' : 'text-rose-700'}`}>{grade.passed ? 'Passed' : 'Failed'}</td>
              </tr>)}</tbody>
            </table></div>}
          {grades.length > 0 && <Button disabled={busy || grades.every((grade) => grade.published)} onClick={publish}>
            {grades.every((grade) => grade.published) ? 'Results Published' : 'Publish Results'}
          </Button>}
        </>}
    </Panel>

    <Panel className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="font-semibold text-slate-800">Academic Results and Statistics</h2>
          <p className="mt-1 text-xs text-slate-500">Published results only. Scores are grouped into one-point bands, with a separate band for scores below 5.00.</p></div>
        <Button secondary disabled={busy || reportLoading} onClick={exportReport}><Download size={16} />Export CSV</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Registration Period"><select className={inputClass} value={filters.periodId}
          onChange={(e) => updateFilter('periodId', e.target.value)}>
          <option value="">All periods</option>{options.periods.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
        </select></Field>
        <Field label="Department"><select className={inputClass} value={filters.departmentId}
          onChange={(e) => updateFilter('departmentId', e.target.value)}>
          <option value="">All managed departments</option>{options.departments.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
        </select></Field>
        <Field label="Topic"><select className={inputClass} value={filters.topicId}
          onChange={(e) => updateFilter('topicId', e.target.value)}>
          <option value="">All topics</option>{options.topics.filter((topic) =>
            (!filters.departmentId || String(topic.departmentId) === filters.departmentId)
            && (!filters.periodId || String(topic.periodId) === filters.periodId))
            .map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
        </select></Field>
      </div>
      {reportLoading ? <Empty>Loading report...</Empty> : report.length === 0
        ? <Empty>No published results match the selected filters.</Empty>
        : <div className="overflow-x-auto"><table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-500"><tr>
            <th className="p-3">Registration Period</th><th className="p-3">Department</th><th className="p-3">Topic</th>
            <th className="p-3">Students</th><th className="p-3">Average Score</th><th className="p-3">Passed</th>
            <th className="p-3">Failed</th><th className="p-3">Score Distribution</th>
          </tr></thead>
          <tbody>{report.map((row) => <tr key={`${row.periodId}-${row.departmentId}-${row.topicId}`} className="border-t border-slate-100 align-top">
            <td className="p-3">{row.periodName}</td><td className="p-3">{row.departmentName}</td><td className="p-3">{row.topicTitle}</td>
            <td className="p-3">{row.studentCount}</td><td className="p-3">{formatScore(row.averageFinalScore)}</td>
            <td className="p-3">{row.passCount}</td><td className="p-3">{row.failCount}</td>
            <td className="p-3">{Object.entries(row.scoreDistribution).map(([band, count]) =>
              <span key={band} className="block">{band}: {count}</span>)}</td>
          </tr>)}</tbody>
        </table></div>}
    </Panel>
  </div>;
}

export default ResultsPage;

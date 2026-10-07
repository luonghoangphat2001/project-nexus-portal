import React, { useEffect, useMemo, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import councilService from '../services/councilService';
import finalResultService from '../services/finalResultService';
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
      ? finalResultService.getMyPublishedGrades().then((data) => { if (active) setMyGrades(data); })
      : Promise.all([councilService.getCouncils(), finalResultService.getReportOptions()])
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
    finalResultService.getAssignmentGrades(selectedId).then((data) => { if (active) setGrades(data); })
      .catch((e) => { if (active) setError(e.message); })
      .finally(() => { if (active) setGradesLoading(false); });
    return () => { active = false; };
  }, [isStudent, selectedId, refresh]);

  useEffect(() => {
    let active = true;
    if (isStudent) return () => { active = false; };
    setReportLoading(true);
    setError('');
    finalResultService.getAcademicReport(selectedFilters(filters)).then((data) => { if (active) setReport(data); })
      .catch((e) => { if (active) setError(e.message); })
      .finally(() => { if (active) setReportLoading(false); });
    return () => { active = false; };
  }, [isStudent, filters, refresh]);

  const publish = async () => {
    if (!selectedId || !window.confirm('Công bố kết quả cho sinh viên trong nhóm này? Kết quả đã công bố sẽ không thể chỉnh sửa.')) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await finalResultService.publishAssignmentGrades(selectedId);
      setNotice('Đã công bố kết quả cho các thành viên trong nhóm.');
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
      const blob = await finalResultService.exportAcademicReport(selectedFilters(filters));
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'bao-cao-ket-qua-hoc-tap.csv';
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
      <div><h1 className="text-2xl font-bold text-slate-800">Kết quả bảo vệ của tôi</h1>
        <p className="mt-1 text-sm text-slate-500">Chỉ hiển thị kết quả đã được công bố chính thức.</p></div>
      <Banner error={error} notice={notice} />
      {loading ? <Empty>Đang tải kết quả...</Empty> : myGrades.length === 0
        ? <Panel><Empty>Bạn chưa có kết quả nào được công bố.</Empty></Panel>
        : <Panel className="overflow-x-auto"><table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-500"><tr>
            <th className="p-3">Đợt đăng ký</th><th className="p-3">Đề tài</th><th className="p-3">Điểm phản biện</th>
            <th className="p-3">Điểm bảo vệ</th><th className="p-3">Điểm tổng kết</th><th className="p-3">Kết quả</th>
          </tr></thead>
          <tbody>{myGrades.map((grade) => <tr key={`${grade.assignmentId}-${grade.studentId}`} className="border-t border-slate-100">
            <td className="p-3">{grade.periodName}</td><td className="p-3">{grade.topicTitle} · {grade.teamName}</td>
            <td className="p-3">{formatScore(grade.reviewScore)}</td><td className="p-3">{formatScore(grade.defenseScore)}</td>
            <td className="p-3 font-semibold">{formatScore(grade.finalScore)}</td>
            <td className={`p-3 font-medium ${grade.passed ? 'text-emerald-700' : 'text-rose-700'}`}>{grade.passed ? 'Đạt' : 'Chưa đạt'}</td>
          </tr>)}</tbody>
        </table></Panel>}
    </div>;
  }

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div>
      <h1 className="text-2xl font-bold text-slate-800">Kết quả bảo vệ & Thống kê học tập</h1>
      <p className="mt-1 text-sm text-slate-500">Tính điểm, công bố kết quả và thống kê kết quả học tập.</p>
    </div><Button secondary disabled={busy || loading} onClick={() => setRefresh((n) => n + 1)}><RefreshCw size={16} />Làm mới</Button></div>
    <Banner error={error} notice={notice} />
    <Panel className="space-y-4">
      <div><h2 className="font-semibold text-slate-800">Tính điểm và công bố kết quả</h2>
        <p className="mt-1 text-xs text-slate-500">Điểm tổng kết = 30% điểm phản biện + 70% điểm bảo vệ. Mỗi phiếu chấm là trung bình của ba tiêu chí; từ 5,00 là đạt.</p></div>
      {loading ? <Empty>Đang tải danh sách phân công đã hoàn tất...</Empty> : completedAssignments.length === 0
        ? <Empty>Không có phân công hội đồng đã hoàn tất trong phạm vi khoa được cấp quyền.</Empty>
        : <>
          <Field label="Hội đồng / nhóm / đề tài"><select className={inputClass} disabled={busy}
            value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            {completedAssignments.map((a) => <option key={a.id} value={a.id}>
              {a.council.name} · {a.registration.teamName} · {a.registration.topicTitle}
            </option>)}
          </select></Field>
          {gradesLoading ? <Empty>Đang tính điểm tổng kết...</Empty> : grades.length === 0
            ? <Empty>Không có kết quả sinh viên để hiển thị.</Empty>
            : <div className="overflow-x-auto"><table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500"><tr>
                <th className="p-3">Sinh viên</th><th className="p-3">Điểm phản biện</th><th className="p-3">Điểm bảo vệ</th>
                <th className="p-3">Điểm tổng kết</th><th className="p-3">Kết quả</th>
              </tr></thead>
              <tbody>{grades.map((grade) => <tr key={grade.studentId} className="border-t border-slate-100">
                <td className="p-3">{grade.studentName} · {grade.studentCode || grade.studentId}</td>
                <td className="p-3">{formatScore(grade.reviewScore)}</td><td className="p-3">{formatScore(grade.defenseScore)}</td>
                <td className="p-3 font-semibold">{formatScore(grade.finalScore)}</td>
                <td className={`p-3 font-medium ${grade.passed ? 'text-emerald-700' : 'text-rose-700'}`}>{grade.passed ? 'Đạt' : 'Chưa đạt'}</td>
              </tr>)}</tbody>
            </table></div>}
          {grades.length > 0 && <Button disabled={busy || grades.every((grade) => grade.published)} onClick={publish}>
            {grades.every((grade) => grade.published) ? 'Đã công bố kết quả' : 'Công bố kết quả cho sinh viên'}
          </Button>}
        </>}
    </Panel>

    <Panel className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="font-semibold text-slate-800">Thống kê kết quả học tập</h2>
          <p className="mt-1 text-xs text-slate-500">Chỉ tổng hợp kết quả đã công bố; điểm được chia theo từng khoảng một điểm và một khoảng riêng dưới 5,00.</p></div>
        <Button secondary disabled={busy || reportLoading} onClick={exportReport}><Download size={16} />Xuất CSV</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Đợt đăng ký"><select className={inputClass} value={filters.periodId}
          onChange={(e) => updateFilter('periodId', e.target.value)}>
          <option value="">Tất cả đợt</option>{options.periods.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
        </select></Field>
        <Field label="Khoa"><select className={inputClass} value={filters.departmentId}
          onChange={(e) => updateFilter('departmentId', e.target.value)}>
          <option value="">Tất cả khoa được phân quyền</option>{options.departments.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
        </select></Field>
        <Field label="Đề tài"><select className={inputClass} value={filters.topicId}
          onChange={(e) => updateFilter('topicId', e.target.value)}>
          <option value="">Tất cả đề tài</option>{options.topics.filter((topic) =>
            (!filters.departmentId || String(topic.departmentId) === filters.departmentId)
            && (!filters.periodId || String(topic.periodId) === filters.periodId))
            .map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
        </select></Field>
      </div>
      {reportLoading ? <Empty>Đang tải báo cáo...</Empty> : report.length === 0
        ? <Empty>Không có kết quả đã công bố phù hợp với bộ lọc.</Empty>
        : <div className="overflow-x-auto"><table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-500"><tr>
            <th className="p-3">Đợt đăng ký</th><th className="p-3">Khoa</th><th className="p-3">Đề tài</th>
            <th className="p-3">Số sinh viên</th><th className="p-3">Điểm trung bình</th><th className="p-3">Đạt</th>
            <th className="p-3">Chưa đạt</th><th className="p-3">Phân bố điểm</th>
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

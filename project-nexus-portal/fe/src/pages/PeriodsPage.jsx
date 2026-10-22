import React, { useEffect, useState, useMemo } from 'react';
import { periodService } from '../services/periodService';
import { academicService } from '../services/academicService';
import { formatDateTime } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import {
  PageHeader,
  FilterCard,
  FilterField,
  TableCard,
  StatusBadge,
  Modal,
  MultiSelectDropdown,
  EmptyState,
  Banner,
  buttonClass,
  inputClass,
  selectClass,
} from '../components/common/CommonUi';
import {
  Plus,
  Edit2,
  Trash2,
  CalendarRange,
  Search,
  Download,
  LayoutList,
  GanttChart,
  Milestone,
  Clock,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

export function PeriodsPage() {
  const { hasRole } = useAuth();
  const { t } = useTranslation();
  const canManage = hasRole('ROLE_ADMIN') || hasRole('ROLE_PRINCIPAL');
  const [periods, setPeriods] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [form, setForm] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline', 'milestones', 'table'

  const statuses = ['DRAFT', 'OPEN', 'CLOSED', 'DEFENSE', 'COMPLETED'];

  async function load() {
    setLoading(true);
    try {
      const [items, facultyItems, cohortItems] = await Promise.all([
        periodService.getAll(),
        academicService.getAllFaculties(),
        academicService.getAllCohorts(),
      ]);
      setPeriods(items || []);
      setFaculties(facultyItems || []);
      setCohorts(cohortItems || []);
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleExportExcel() {
    setExportLoading(true);
    setError('');
    try {
      const blob = await periodService.exportPeriodsExcel();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'danh-sach-dot-dang-ky.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Không thể xuất danh sách đợt đăng ký');
    } finally {
      setExportLoading(false);
    }
  }

  async function handleSave(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        semester: Number(form.semester),
        facultyIds: form.facultyIds ? form.facultyIds.map(Number) : [],
        cohortIds: form.cohortIds ? form.cohortIds.map(Number) : [],
      };
      if (!payload.facultyIds?.length || !payload.cohortIds?.length) {
        throw new Error(t('periods.facultyCohortError'));
      }
      if (payload.startDate >= payload.endDate || payload.endDate > payload.submissionDeadline) {
        throw new Error(t('periods.dateError'));
      }
      if (form.id) {
        await periodService.update(form.id, payload);
      } else {
        await periodService.create(payload);
      }
      setForm(null);
      setSuccess(t('periods.savedSuccess'));
      await load();
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(period) {
    if (!window.confirm(t('periods.confirmDelete', { name: period.name }))) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await periodService.delete(period.id);
      setSuccess(t('periods.deletedSuccess'));
      await load();
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setBusy(false);
    }
  }

  const filteredPeriods = useMemo(() => {
    return periods.filter((p) => {
      const matchStatus = !statusFilter || p.status === statusFilter;
      const matchSearch =
        !searchQuery ||
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.academicYear?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [periods, statusFilter, searchQuery]);

  // Overall timeline calculation for Gantt view
  const timelineBounds = useMemo(() => {
    if (!filteredPeriods.length) {
      const now = new Date();
      return {
        min: new Date(now.getFullYear(), 0, 1).getTime(),
        max: new Date(now.getFullYear(), 11, 31).getTime(),
        now: now.getTime(),
      };
    }
    const dates = filteredPeriods.flatMap((p) => [
      p.startDate ? new Date(p.startDate).getTime() : NaN,
      p.endDate ? new Date(p.endDate).getTime() : NaN,
      p.submissionDeadline ? new Date(p.submissionDeadline).getTime() : NaN,
    ]).filter((d) => !isNaN(d));

    const now = Date.now();
    dates.push(now);

    const min = Math.min(...dates) - 86400000 * 7; // 7 days padding
    const max = Math.max(...dates) + 86400000 * 7;
    return { min, max: Math.max(max, min + 86400000 * 30), now };
  }, [filteredPeriods]);

  const getDaysDiff = (targetDateStr) => {
    if (!targetDateStr) return null;
    const target = new Date(targetDateStr).getTime();
    const diff = Math.ceil((target - Date.now()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <PageHeader
        title={t('periods.title')}
        description={t('periods.desc')}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportExcel}
              disabled={exportLoading || periods.length === 0}
              className={buttonClass.secondary}
              title={t('periods.exportExcel')}
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>{exportLoading ? t('common.loading') : t('periods.exportExcel')}</span>
            </button>

            {canManage && (
              <button
                onClick={() =>
                  setForm({
                    name: '',
                    academicYear: '2025-2026',
                    semester: 1,
                    startDate: '',
                    endDate: '',
                    submissionDeadline: '',
                    status: 'DRAFT',
                    facultyIds: faculties.map((f) => f.id),
                    cohortIds: cohorts.map((c) => c.id),
                  })
                }
                className={buttonClass.primary}
              >
                <Plus className="w-4 h-4" />
                <span>{t('periods.addPeriod')}</span>
              </button>
            )}
          </div>
        }
      />

      <Banner error={error} success={success} />

      {/* Filter and View Mode Toolbar */}
      <FilterCard
        onReset={() => {
          setStatusFilter('');
          setSearchQuery('');
        }}
      >
        <FilterField label={t('periods.periodName')}>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={t('periods.periodName') + '...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${inputClass} pl-8.5`}
            />
          </div>
        </FilterField>

        <FilterField label={t('periods.filterStatus')}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={selectClass}
          >
            <option value="">{t('periods.allStatuses')}</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {t(`enums.status.${status}`) || status}
              </option>
            ))}
          </select>
        </FilterField>
      </FilterCard>

      {/* View Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setViewMode('timeline')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'timeline'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <GanttChart className="w-3.5 h-3.5" />
            <span>{t('periods.viewTimeline')}</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('milestones')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'milestones'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Milestone className="w-3.5 h-3.5" />
            <span>{t('periods.viewMilestones')}</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'table'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" />
            <span>{t('periods.viewTable')}</span>
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-500 font-medium px-2">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-500"></span>
            {t('periods.registrationPhase')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500"></span>
            {t('periods.submissionPhase')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-rose-200"></span>
            {t('periods.todayMarker')}
          </span>
        </div>
      </div>

      {/* VIEW 1: TIMELINE / GANTT VIEW */}
      {viewMode === 'timeline' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <GanttChart className="w-4 h-4 text-blue-600" />
                <span>Trực quan hóa lịch trình các đợt đăng ký (Gantt Timeline)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Admin Khoa CNTT dễ dàng theo dõi thời gian gối đầu, hạn chót và trạng thái của nhiều đợt đăng ký cùng lúc.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {filteredPeriods.length} đợt đăng ký
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400 text-sm">{t('common.loading')}</div>
          ) : filteredPeriods.length === 0 ? (
            <EmptyState icon={CalendarRange} message={t('periods.noPeriodsFound')} />
          ) : (
            <div className="space-y-4 pt-2">
              {/* Timeline Header (Relative Scale Bar with Today Line) */}
              <div className="relative h-6 bg-slate-50 rounded-lg border border-slate-200/70 text-[11px] text-slate-400 font-mono flex items-center px-3 justify-between select-none">
                <span>{new Date(timelineBounds.min).toLocaleDateString('vi-VN')}</span>
                <span>{new Date((timelineBounds.min + timelineBounds.max) / 2).toLocaleDateString('vi-VN')}</span>
                <span>{new Date(timelineBounds.max).toLocaleDateString('vi-VN')}</span>

                {/* Today vertical marker line in header */}
                {timelineBounds.now >= timelineBounds.min && timelineBounds.now <= timelineBounds.max && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10"
                    style={{
                      left: `${((timelineBounds.now - timelineBounds.min) / (timelineBounds.max - timelineBounds.min)) * 100}%`,
                    }}
                    title={`${t('periods.todayMarker')}: ${new Date().toLocaleDateString('vi-VN')}`}
                  >
                    <span className="absolute -top-3 -translate-x-1/2 text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1 rounded shadow-2xs">
                      Hôm nay
                    </span>
                  </div>
                )}
              </div>

              {/* Periods Gantt Rows */}
              <div className="space-y-3">
                {filteredPeriods.map((period) => {
                  const startTime = period.startDate ? new Date(period.startDate).getTime() : timelineBounds.min;
                  const endTime = period.endDate ? new Date(period.endDate).getTime() : startTime;
                  const deadlineTime = period.submissionDeadline ? new Date(period.submissionDeadline).getTime() : endTime;

                  const totalDuration = timelineBounds.max - timelineBounds.min;
                  const leftPercent = Math.max(0, Math.min(100, ((startTime - timelineBounds.min) / totalDuration) * 100));
                  const regWidthPercent = Math.max(1, Math.min(100 - leftPercent, ((endTime - startTime) / totalDuration) * 100));
                  const submitWidthPercent = Math.max(1, Math.min(100 - leftPercent - regWidthPercent, ((deadlineTime - endTime) / totalDuration) * 100));

                  const diffDays = getDaysDiff(period.submissionDeadline);
                  const regDiff = getDaysDiff(period.endDate);

                  return (
                    <div
                      key={period.id}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-xs transition bg-slate-50/50"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{period.name}</span>
                          <span className="text-xs text-slate-500 font-mono">
                            ({period.academicYear} · HK{period.semester})
                          </span>
                          <StatusBadge value={period.status} type="status" />
                        </div>

                        <div className="flex items-center gap-2">
                          {regDiff !== null && regDiff > 0 && period.status === 'OPEN' && (
                            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              Còn {regDiff} ngày đăng ký
                            </span>
                          )}
                          {diffDays !== null && diffDays > 0 && period.status !== 'COMPLETED' && (
                            <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                              Còn {diffDays} ngày nộp khóa luận
                            </span>
                          )}

                          {canManage && (
                            <div className="inline-flex items-center gap-1 ml-2">
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  setForm({
                                    ...period,
                                    startDate: period.startDate?.slice(0, 16) || '',
                                    endDate: period.endDate?.slice(0, 16) || '',
                                    submissionDeadline: period.submissionDeadline?.slice(0, 16) || '',
                                  })
                                }
                                className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                                title={t('common.edit')}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleRemove(period)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                title={t('common.delete')}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Interactive Gantt Bar */}
                      <div className="relative h-7 bg-white rounded-lg border border-slate-200 overflow-hidden flex items-center">
                        {/* Today Marker */}
                        {timelineBounds.now >= timelineBounds.min && timelineBounds.now <= timelineBounds.max && (
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-20 pointer-events-none"
                            style={{
                              left: `${((timelineBounds.now - timelineBounds.min) / totalDuration) * 100}%`,
                            }}
                          />
                        )}

                        {/* Combined Period Bar */}
                        <div
                          className="absolute h-full flex rounded shadow-2xs overflow-hidden"
                          style={{
                            left: `${leftPercent}%`,
                            width: `${Math.max(4, regWidthPercent + submitWidthPercent)}%`,
                          }}
                        >
                          {/* Registration Window */}
                          <div
                            className="h-full bg-blue-500 hover:bg-blue-600 transition flex items-center justify-center text-white text-[10px] font-bold px-1 select-none"
                            style={{ width: `${(regWidthPercent / (regWidthPercent + submitWidthPercent)) * 100}%` }}
                            title={`Đăng ký: ${period.startDate ? period.startDate.replace('T', ' ') : ''} -> ${period.endDate ? period.endDate.replace('T', ' ') : ''}`}
                          >
                            <span className="truncate">ĐK</span>
                          </div>

                          {/* Submission Window */}
                          <div
                            className="h-full bg-indigo-500 hover:bg-indigo-600 transition flex items-center justify-center text-white text-[10px] font-bold px-1 select-none border-l border-white/20"
                            style={{ width: `${(submitWidthPercent / (regWidthPercent + submitWidthPercent)) * 100}%` }}
                            title={`Nộp báo cáo: ${period.endDate ? period.endDate.replace('T', ' ') : ''} -> ${period.submissionDeadline ? period.submissionDeadline.replace('T', ' ') : ''}`}
                          >
                            <span className="truncate">Nộp bài</span>
                          </div>
                        </div>
                      </div>

                      {/* Period Metadata footer */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mt-2 text-[11px] text-slate-500">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 font-mono">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {period.startDate ? period.startDate.split('T')[0] : '—'} →{' '}
                            {period.submissionDeadline ? period.submissionDeadline.split('T')[0] : '—'}
                          </span>
                          <span className="text-slate-300">|</span>
                          <span className="truncate max-w-xs">
                            <strong className="text-slate-700">Khoa:</strong>{' '}
                            {faculties
                              .filter((f) => period.facultyIds?.includes(f.id))
                              .map((f) => f.code || f.name)
                              .join(', ') || 'Tất cả'}
                          </span>
                        </div>
                        <div className="truncate max-w-xs text-right">
                          <strong className="text-slate-700">Khóa SV:</strong>{' '}
                          {cohorts
                            .filter((c) => period.cohortIds?.includes(c.id))
                            .map((c) => c.code || c.name)
                            .join(', ') || 'Tất cả'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: MILESTONES / PHASE TRACKER CARDS */}
      {viewMode === 'milestones' && (
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400 text-sm">
              {t('common.loading')}
            </div>
          ) : filteredPeriods.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8">
              <EmptyState icon={CalendarRange} message={t('periods.noPeriodsFound')} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPeriods.map((period) => {
                const now = Date.now();
                const start = period.startDate ? new Date(period.startDate).getTime() : now;
                const deadline = period.submissionDeadline ? new Date(period.submissionDeadline).getTime() : now;
                const progress = Math.min(100, Math.max(0, Math.round(((now - start) / (deadline - start || 1)) * 100)));

                // Milestone step determination
                const isStep1Active = period.status === 'DRAFT';
                const isStep2Active = period.status === 'OPEN';
                const isStep3Active = period.status === 'CLOSED';
                const isStep4Active = period.status === 'DEFENSE' || period.status === 'COMPLETED';

                return (
                  <div
                    key={period.id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4 hover:border-blue-200 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-base">{period.name}</h4>
                          <StatusBadge value={period.status} type="status" />
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          {period.academicYear} · Học kỳ {period.semester}
                        </p>
                      </div>

                      {canManage && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setForm({
                                ...period,
                                startDate: period.startDate?.slice(0, 16) || '',
                                endDate: period.endDate?.slice(0, 16) || '',
                                submissionDeadline: period.submissionDeadline?.slice(0, 16) || '',
                              })
                            }
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                            title={t('common.edit')}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemove(period)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title={t('common.delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 4-Step Milestone Pipeline */}
                    <div className="grid grid-cols-4 gap-1 text-center select-none pt-1">
                      <div
                        className={`p-2 rounded-xl text-xs font-semibold border ${
                          isStep1Active
                            ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        <span className="block text-[10px] opacity-80">Bước 1</span>
                        <span>Chuẩn bị</span>
                      </div>
                      <div
                        className={`p-2 rounded-xl text-xs font-semibold border ${
                          isStep2Active
                            ? 'bg-blue-600 text-white border-blue-700 shadow-xs ring-2 ring-blue-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        <span className="block text-[10px] opacity-80">Bước 2</span>
                        <span>Mở ĐK</span>
                      </div>
                      <div
                        className={`p-2 rounded-xl text-xs font-semibold border ${
                          isStep3Active
                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        <span className="block text-[10px] opacity-80">Bước 3</span>
                        <span>Nộp bài</span>
                      </div>
                      <div
                        className={`p-2 rounded-xl text-xs font-semibold border ${
                          isStep4Active
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        <span className="block text-[10px] opacity-80">Bước 4</span>
                        <span>Hội đồng</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">Tiến độ thời gian thực:</span>
                        <span className="font-bold text-blue-600 font-mono">{progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
                        <div
                          className="bg-linear-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Dates List */}
                    <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Mở nhận đăng ký:</span>
                        <span className="font-mono font-medium">
                          {formatDateTime(period.startDate)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Đóng nhận đăng ký:</span>
                        <span className="font-mono font-medium">
                          {formatDateTime(period.endDate)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Hạn chót nộp báo cáo:</span>
                        <span className="font-mono font-bold text-slate-900">
                          {formatDateTime(period.submissionDeadline)}
                        </span>
                      </div>
                    </div>

                    {/* Target Scope Badges */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-xs text-slate-500 font-medium">Áp dụng:</span>
                      {faculties
                        .filter((f) => period.facultyIds?.includes(f.id))
                        .map((f) => (
                          <span
                            key={f.id}
                            className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200"
                          >
                            Khoa {f.code || f.name}
                          </span>
                        ))}
                      {cohorts
                        .filter((c) => period.cohortIds?.includes(c.id))
                        .map((c) => (
                          <span
                            key={c.id}
                            className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            Khóa {c.code || c.name}
                          </span>
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: TRADITIONAL TABLE VIEW */}
      {viewMode === 'table' && (
        <TableCard>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/70 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-4">{t('periods.periodName')}</th>
                  <th className="py-3.5 px-4">{t('periods.academicYear')}</th>
                  <th className="py-3.5 px-4">{t('periods.registrationTime')}</th>
                  <th className="py-3.5 px-4">{t('periods.deadline')}</th>
                  <th className="py-3.5 px-4">{t('common.status')}</th>
                  {canManage && <th className="py-3.5 px-4 text-right">{t('common.actions')}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      {t('common.loading')}
                    </td>
                  </tr>
                ) : filteredPeriods.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <EmptyState
                        icon={CalendarRange}
                        message={t('periods.noPeriodsFound')}
                      />
                    </td>
                  </tr>
                ) : (
                  filteredPeriods.map((period) => (
                    <tr key={period.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900 block">{period.name}</span>
                        <span className="text-xs text-slate-400">
                          {faculties
                            .filter((f) => period.facultyIds?.includes(f.id))
                            .map((f) => f.code || f.name)
                            .join(', ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        {period.academicYear} · {t('periods.semesterLabel', { num: period.semester })}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                        {formatDateTime(period.startDate)}
                        <span className="block text-slate-400">→ {formatDateTime(period.endDate)}</span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                        {formatDateTime(period.submissionDeadline)}
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge value={period.status} type="status" />
                      </td>

                      {canManage && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                setForm({
                                  ...period,
                                  startDate: period.startDate?.slice(0, 16) || '',
                                  endDate: period.endDate?.slice(0, 16) || '',
                                  submissionDeadline: period.submissionDeadline?.slice(0, 16) || '',
                                })
                              }
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
                              title={t('common.edit')}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleRemove(period)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                              title={t('common.delete')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TableCard>
      )}

      {/* Edit / Create Modal Form */}
      <Modal
        isOpen={Boolean(form)}
        onClose={() => setForm(null)}
        title={form?.id ? t('periods.editPeriod') : t('periods.addPeriod')}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">{t('periods.periodName')} *</label>
            <input
              type="text"
              required
              value={form?.name || ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('periods.academicYear')} *</label>
              <input
                type="text"
                required
                value={form?.academicYear || ''}
                onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('periods.semester')} *</label>
              <input
                type="number"
                min="1"
                max="3"
                required
                value={form?.semester || 1}
                onChange={(e) => setForm({ ...form, semester: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('periods.regStarts')} *</label>
              <input
                type="datetime-local"
                required
                value={form?.startDate || ''}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                onClick={(e) => { try { e.target.showPicker?.(); } catch(_) {} }}
                className={`${inputClass} cursor-pointer`}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('periods.regEnds')} *</label>
              <input
                type="datetime-local"
                required
                value={form?.endDate || ''}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                onClick={(e) => { try { e.target.showPicker?.(); } catch(_) {} }}
                className={`${inputClass} cursor-pointer`}
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">{t('periods.submissionDeadline')} *</label>
            <input
              type="datetime-local"
              required
              value={form?.submissionDeadline || ''}
              onChange={(e) => setForm({ ...form, submissionDeadline: e.target.value })}
              onClick={(e) => { try { e.target.showPicker?.(); } catch(_) {} }}
              className={`${inputClass} cursor-pointer`}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">{t('common.status')} *</label>
            <select
              value={form?.status || 'DRAFT'}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className={selectClass}
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {t(`enums.status.${status}`) || status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">{t('periods.targetFaculties')} *</label>
            <MultiSelectDropdown
              options={faculties}
              value={form?.facultyIds || []}
              onChange={(selected) => setForm({ ...form, facultyIds: selected })}
              placeholder={t('periods.targetFaculties')}
              allLabel={t('notifications.allFaculties') || 'Tất cả các khoa'}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">{t('periods.targetCohorts')} *</label>
            <MultiSelectDropdown
              options={cohorts}
              value={form?.cohortIds || []}
              onChange={(selected) => setForm({ ...form, cohortIds: selected })}
              placeholder={t('periods.targetCohorts')}
              allLabel="Tất cả các khóa"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={busy}
              onClick={() => setForm(null)}
              className={buttonClass.secondary}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={busy}
              className={buttonClass.primary}
            >
              {busy ? t('common.loading') : t('common.save')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default PeriodsPage;

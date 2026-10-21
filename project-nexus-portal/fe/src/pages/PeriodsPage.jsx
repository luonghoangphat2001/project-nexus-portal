import React, { useEffect, useState } from 'react';
import { periodService } from '../services/periodService';
import { academicService } from '../services/academicService';
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
import { Plus, Edit2, Trash2, CalendarRange, Search } from 'lucide-react';

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

  const filteredPeriods = periods.filter((p) => {
    const matchStatus = !statusFilter || p.status === statusFilter;
    const matchSearch =
      !searchQuery ||
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.academicYear?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <PageHeader
        title={t('periods.title')}
        description={t('periods.desc')}
        action={
          canManage && (
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
          )
        }
      />

      <Banner error={error} success={success} />

      {/* Filter Section Matching Image 1 */}
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

      {/* Clean Table Card matching Image 1 */}
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
                      {period.startDate ? period.startDate.replace('T', ' ') : '—'}
                      <span className="block text-slate-400">→ {period.endDate ? period.endDate.replace('T', ' ') : '—'}</span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                      {period.submissionDeadline ? period.submissionDeadline.replace('T', ' ') : '—'}
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
                            className={buttonClass.actionRow}
                            title={t('common.edit')}
                            aria-label={t('common.edit')}
                          >
                            <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                          </button>

                          {hasRole('ROLE_ADMIN') && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleRemove(period)}
                              className={buttonClass.actionRowDanger}
                              title={t('common.delete')}
                              aria-label={t('common.delete')}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            </button>
                          )}
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

      {/* Edit / Create Period Modal */}
      <Modal
        isOpen={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? t('periods.editPeriod') : t('periods.addPeriod')}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">{t('periods.periodName')} *</label>
            <input
              type="text"
              required
              maxLength={150}
              value={form?.name || ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('periods.academicYear')} *</label>
              <input
                type="text"
                required
                pattern="\d{4}-\d{4}"
                placeholder="2025-2026"
                value={form?.academicYear || ''}
                onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('periods.semester')} *</label>
              <input
                type="number"
                min={1}
                max={3}
                required
                value={form?.semester || 1}
                onChange={(e) => setForm({ ...form, semester: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

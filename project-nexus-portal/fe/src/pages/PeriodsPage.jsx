import React, { useEffect, useState } from 'react';
import { periodService } from '../services/periodService';
import { academicService } from '../services/academicService';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import { ModuleShell, RecordForm, buttonClass, inputClass } from '../components/common/ModuleUi';

export function PeriodsPage() {
  const { hasRole } = useAuth();
  const { t } = useTranslation();
  const canManage = hasRole('ROLE_ADMIN') || hasRole('ROLE_PRINCIPAL');
  const [periods, setPeriods] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [form, setForm] = useState(null);
  const [filter, setFilter] = useState('');
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
      setPeriods(items);
      setFaculties(facultyItems);
      setCohorts(cohortItems);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const fields = [
    { name: 'name', label: t('periods.periodName'), maxLength: 150 },
    { name: 'academicYear', label: t('periods.academicYear'), pattern: '\\d{4}-\\d{4}' },
    { name: 'semester', label: t('periods.semester'), type: 'number', min: 1, max: 3 },
    { name: 'startDate', label: t('periods.regStarts'), type: 'datetime-local' },
    { name: 'endDate', label: t('periods.regEnds'), type: 'datetime-local' },
    { name: 'submissionDeadline', label: t('periods.submissionDeadline'), type: 'datetime-local' },
    {
      name: 'status',
      label: t('common.status'),
      options: statuses.map((id) => ({ id, name: t(`enums.status.${id}`) || id })),
    },
    { name: 'facultyIds', label: t('periods.targetFaculties'), options: faculties, multiple: true },
    { name: 'cohortIds', label: t('periods.targetCohorts'), options: cohorts, multiple: true },
  ];

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const payload = { ...form, name: form.name.trim(), semester: Number(form.semester) };
      if (!payload.facultyIds?.length || !payload.cohortIds?.length) {
        throw new Error(t('periods.facultyCohortError'));
      }
      if (payload.startDate >= payload.endDate || payload.endDate > payload.submissionDeadline) {
        throw new Error(t('periods.dateError'));
      }
      if (form.id) await periodService.update(form.id, payload);
      else await periodService.create(payload);
      setForm(null);
      setSuccess(t('periods.savedSuccess'));
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(period) {
    if (!window.confirm(t('periods.confirmDelete', { name: period.name }))) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await periodService.delete(period.id);
      setSuccess(t('periods.deletedSuccess'));
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModuleShell
      title={t('periods.title')}
      description={t('periods.desc')}
      {...{ error, success, loading }}
    >
      <div className="flex gap-3">
        <select
          className={inputClass}
          aria-label={t('periods.filterStatus')}
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="">{t('periods.allStatuses')}</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {t(`enums.status.${status}`) || status}
            </option>
          ))}
        </select>
        {canManage && (
          <button
            className={`${buttonClass} shrink-0`}
            disabled={loading || busy}
            onClick={() => setForm({ status: 'DRAFT', semester: 1, facultyIds: [], cohortIds: [] })}
          >
            {t('periods.addPeriod')}
          </button>
        )}
      </div>

      {form && (
        <RecordForm
          {...{ fields, busy }}
          value={form}
          onChange={setForm}
          onSubmit={save}
          onCancel={() => setForm(null)}
          editing={!!form.id}
        />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {periods
          .filter((period) => !filter || period.status === filter)
          .map((period) => (
            <article key={period.id} className="space-y-3 rounded-xl border bg-white p-5">
              <div className="flex justify-between gap-3">
                <h2 className="font-semibold">{period.name}</h2>
                <span className="rounded bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">
                  {t(`enums.status.${period.status}`) || period.status}
                </span>
              </div>
              <p className="text-sm">
                {period.academicYear} · {t('periods.semesterLabel', { num: period.semester })}
              </p>
              <p className="text-sm text-slate-600">
                {t('periods.registrationTime')} {period.startDate.replace('T', ' ')} — {period.endDate.replace('T', ' ')}
              </p>
              <p className="text-sm text-slate-600">
                {t('periods.deadline')} {period.submissionDeadline.replace('T', ' ')}
              </p>
              <p className="text-sm">
                {t('periods.faculties')}{' '}
                {faculties
                  .filter((item) => period.facultyIds?.includes(item.id))
                  .map((item) => item.name)
                  .join(', ')}
              </p>
              <p className="text-sm">
                {t('periods.cohorts')}{' '}
                {cohorts
                  .filter((item) => period.cohortIds?.includes(item.id))
                  .map((item) => item.name)
                  .join(', ')}
              </p>
              <div className="flex gap-3">
                {canManage && (
                  <button
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    disabled={busy}
                    onClick={() =>
                      setForm({
                        ...period,
                        startDate: period.startDate.slice(0, 16),
                        endDate: period.endDate.slice(0, 16),
                        submissionDeadline: period.submissionDeadline.slice(0, 16),
                      })
                    }
                  >
                    {t('common.edit')}
                  </button>
                )}
                {hasRole('ROLE_ADMIN') && (
                  <button
                    className="text-sm font-medium text-red-600 hover:text-red-800"
                    disabled={busy}
                    onClick={() => remove(period)}
                  >
                    {t('common.delete')}
                  </button>
                )}
              </div>
            </article>
          ))}
      </div>

      {!loading && !periods.some((period) => !filter || period.status === filter) && (
        <p className="text-slate-500">{t('periods.noPeriodsFound')}</p>
      )}
    </ModuleShell>
  );
}

export default PeriodsPage;

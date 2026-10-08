import React, { useEffect, useState } from 'react';
import { periodService } from '../services/periodService';
import { academicService } from '../services/academicService';
import { useAuth } from '../context/AuthContext';
import { ModuleShell, RecordForm, buttonClass, inputClass } from '../components/common/ModuleUi';

export function PeriodsPage() {
  const { hasRole } = useAuth();
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
  async function load() {
    setLoading(true);
    try { const [items, facultyItems, cohortItems] = await Promise.all([periodService.getAll(), academicService.getAllFaculties(), academicService.getAllCohorts()]);
      setPeriods(items); setFaculties(facultyItems); setCohorts(cohortItems);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  const fields = [{ name: 'name', label: 'Period name', maxLength: 150 },
    { name: 'academicYear', label: 'Academic year (2026-2027)', pattern: '\\d{4}-\\d{4}' },
    { name: 'semester', label: 'Semester', type: 'number', min: 1, max: 3 },
    ...['startDate', 'endDate', 'submissionDeadline'].map((name, index) => ({ name, label: ['Registration starts', 'Registration ends', 'Submission deadline'][index], type: 'datetime-local' })),
    { name: 'status', label: 'Status', options: ['DRAFT', 'OPEN', 'CLOSED', 'DEFENSE', 'COMPLETED'].map(id => ({ id, name: id })) },
    { name: 'facultyIds', label: 'Target faculties', options: faculties, multiple: true },
    { name: 'cohortIds', label: 'Target cohorts', options: cohorts, multiple: true }];
  async function save(event) {
    event.preventDefault(); setBusy(true); setError(''); setSuccess('');
    try {
      const payload = { ...form, name: form.name.trim(), semester: Number(form.semester) };
      if (!payload.facultyIds?.length || !payload.cohortIds?.length) throw new Error('Select at least one faculty and cohort.');
      if (payload.startDate >= payload.endDate || payload.endDate > payload.submissionDeadline) throw new Error('Check registration dates and submission deadline.');
      if (form.id) await periodService.update(form.id, payload); else await periodService.create(payload);
      setForm(null); setSuccess('Registration period saved.'); await load();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  async function remove(period) {
    if (!window.confirm(`Delete ${period.name}?`)) return;
    setBusy(true); setError(''); setSuccess('');
    try { await periodService.delete(period.id); setSuccess('Registration period deleted.'); await load(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <ModuleShell title="Registration Periods" description="Plan capstone registration by academic year, semester, faculty and cohort. Dates use Vietnam local time." {...{ error, success, loading }}>
    <div className="flex gap-3"><select className={inputClass} aria-label="Filter by status" value={filter} onChange={event => setFilter(event.target.value)}>
      <option value="">All statuses</option>{['DRAFT', 'OPEN', 'CLOSED', 'DEFENSE', 'COMPLETED'].map(status => <option key={status}>{status}</option>)}</select>
      {canManage && <button className={`${buttonClass} shrink-0`} disabled={loading || busy} onClick={() => setForm({ status: 'DRAFT', semester: 1, facultyIds: [], cohortIds: [] })}>Add Period</button>}</div>
    {form && <RecordForm {...{ fields, busy }} value={form} onChange={setForm} onSubmit={save} onCancel={() => setForm(null)} editing={!!form.id} />}
    <div className="grid gap-4 lg:grid-cols-2">{periods.filter(period => !filter || period.status === filter).map(period => <article key={period.id} className="space-y-3 rounded-xl border bg-white p-5">
      <div className="flex justify-between gap-3"><h2 className="font-semibold">{period.name}</h2><span className="rounded bg-indigo-50 px-2 py-1 text-xs text-indigo-700">{period.status}</span></div>
      <p className="text-sm">{period.academicYear} · Semester {period.semester}</p>
      <p className="text-sm text-slate-600">Registration: {period.startDate.replace('T', ' ')} — {period.endDate.replace('T', ' ')}</p>
      <p className="text-sm text-slate-600">Submission deadline: {period.submissionDeadline.replace('T', ' ')}</p>
      <p className="text-sm">Faculties: {faculties.filter(item => period.facultyIds.includes(item.id)).map(item => item.name).join(', ')}</p>
      <p className="text-sm">Cohorts: {cohorts.filter(item => period.cohortIds.includes(item.id)).map(item => item.name).join(', ')}</p>
      <div className="flex gap-3">{canManage && <button className="text-sm text-indigo-600" disabled={busy} onClick={() => setForm({ ...period,
        startDate: period.startDate.slice(0, 16), endDate: period.endDate.slice(0, 16), submissionDeadline: period.submissionDeadline.slice(0, 16) })}>Edit</button>}
        {hasRole('ROLE_ADMIN') && <button className="text-sm text-red-600" disabled={busy} onClick={() => remove(period)}>Delete</button>}</div>
    </article>)}</div>
    {!loading && !periods.some(period => !filter || period.status === filter) && <p className="text-slate-500">No registration periods found.</p>}
  </ModuleShell>;
}

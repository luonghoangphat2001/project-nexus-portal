import React, { useEffect, useState } from 'react';
import { academicService } from '../services/academicService';
import { useAuth } from '../context/AuthContext';
import { ModuleShell, RecordForm, inputClass, buttonClass } from '../components/common/ModuleUi';

const sections = {
  faculties: { label: 'Faculties', singular: 'Faculty' },
  departments: { label: 'Departments', singular: 'Department', parent: 'facultyId', parentLabel: 'Faculty', parentSection: 'faculties' },
  majors: { label: 'Majors', singular: 'Major', parent: 'departmentId', parentLabel: 'Department', parentSection: 'departments' },
  cohorts: { label: 'Cohorts', singular: 'Cohort' },
};

export function AcademicPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole('ROLE_ADMIN') || hasRole('ROLE_PRINCIPAL');
  const [section, setSection] = useState('faculties');
  const [data, setData] = useState({ faculties: [], departments: [], majors: [], cohorts: [] });
  const [form, setForm] = useState(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const config = sections[section];
  async function load() {
    setLoading(true);
    try {
      const [faculties, departments, majors, cohorts] = await Promise.all([
        academicService.getAllFaculties(), academicService.getAllDepartments(), academicService.getAllMajors(), academicService.getAllCohorts(),
      ]);
      setData({ faculties, departments, majors, cohorts });
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  const fields = [{ name: 'code', label: 'Code', maxLength: 20 }, { name: 'name', label: 'Name', maxLength: 100 },
    ...(config.parent ? [{ name: config.parent, label: config.parentLabel, options: data[config.parentSection] }] : []),
    ...(section === 'cohorts' ? [{ name: 'admissionYear', label: 'Admission year', type: 'number', min: 2000, max: 2100 },
      { name: 'graduationYear', label: 'Graduation year', type: 'number', min: 2000, max: 2100 }] : [])];
  async function save(event) {
    event.preventDefault(); setBusy(true); setError(''); setSuccess('');
    try {
      const payload = { code: form.code.trim(), name: form.name.trim(),
        ...(config.parent ? { [config.parent]: Number(form[config.parent]) } : {}),
        ...(section === 'cohorts' ? { admissionYear: Number(form.admissionYear), graduationYear: Number(form.graduationYear) } : {}) };
      if (form.id) await academicService[`update${config.singular}`](form.id, payload);
      else await academicService[`create${config.singular}`](payload);
      setForm(null); setSuccess(`${config.singular} saved successfully.`); await load();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  async function remove(row) {
    if (!window.confirm(`Delete ${row.name}?`)) return;
    setBusy(true); setError(''); setSuccess('');
    try { await academicService[`delete${config.singular}`](row.id); setSuccess(`${config.singular} deleted.`); await load(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  const rows = data[section].filter(row => `${row.code} ${row.name}`.toLowerCase().includes(query.toLowerCase()));
  return <ModuleShell title="Academic Structure" description="Manage faculties, departments, majors and student cohorts for capstone projects." {...{ error, success, loading }}>
    <div className="flex flex-wrap gap-2">{Object.entries(sections).map(([key, value]) => <button key={key}
      className={section === key ? buttonClass : 'rounded-lg border bg-white px-4 py-2 text-sm'} disabled={busy}
      onClick={() => { setSection(key); setForm(null); setQuery(''); setError(''); setSuccess(''); }}>{value.label}</button>)}</div>
    <div className="flex gap-3"><input aria-label="Search academic records" className={inputClass} placeholder="Search by code or name" value={query} onChange={event => setQuery(event.target.value)} />
      {canManage && <button className={`${buttonClass} shrink-0`} onClick={() => setForm({})} disabled={busy || loading}>Add {config.singular}</button>}</div>
    {form && <RecordForm {...{ fields, busy }} value={form} onChange={setForm} onSubmit={save} onCancel={() => setForm(null)} editing={!!form.id} />}
    <div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-50"><tr>
      <th className="p-3">Code</th><th className="p-3">Name</th><th className="p-3">{config.parentLabel || (section === 'cohorts' ? 'Academic years' : '')}</th><th className="p-3">Actions</th>
    </tr></thead><tbody>{rows.map(row => <tr key={row.id} className="border-t"><td className="p-3">{row.code}</td><td className="p-3">{row.name}</td>
      <td className="p-3">{config.parent ? data[config.parentSection].find(parent => parent.id === row[config.parent])?.name : section === 'cohorts' ? `${row.admissionYear} - ${row.graduationYear}` : ''}</td>
      <td className="space-x-3 p-3">{canManage && <button className="text-indigo-600" onClick={() => setForm({ ...row })} disabled={busy}>Edit</button>}
        {hasRole('ROLE_ADMIN') && <button className="text-red-600" onClick={() => remove(row)} disabled={busy}>Delete</button>}</td></tr>)}</tbody></table>
      {!loading && rows.length === 0 && <p className="p-5 text-slate-500">No records found.</p>}</div>
  </ModuleShell>;
}

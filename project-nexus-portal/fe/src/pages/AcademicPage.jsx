import React, { useEffect, useState } from 'react';
import { academicService } from '../services/academicService';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import { ModuleShell, RecordForm, inputClass, buttonClass } from '../components/common/ModuleUi';

export function AcademicPage() {
  const { hasRole } = useAuth();
  const { t } = useTranslation();
  const canManage = hasRole('ROLE_ADMIN') || hasRole('ROLE_PRINCIPAL');
  const [section, setSection] = useState('faculties');
  const [data, setData] = useState({ faculties: [], departments: [], majors: [], cohorts: [] });
  const [form, setForm] = useState(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const sections = {
    faculties: {
      label: t('academic.faculties'),
      singular: t('academic.faculty'),
      serviceSingular: 'Faculty',
    },
    departments: {
      label: t('academic.departments'),
      singular: t('academic.department'),
      serviceSingular: 'Department',
      parent: 'facultyId',
      parentLabel: t('academic.parentFaculty'),
      parentSection: 'faculties',
    },
    majors: {
      label: t('academic.majors'),
      singular: t('academic.major'),
      serviceSingular: 'Major',
      parent: 'departmentId',
      parentLabel: t('academic.parentDepartment'),
      parentSection: 'departments',
    },
    cohorts: {
      label: t('academic.cohorts'),
      singular: t('academic.cohort'),
      serviceSingular: 'Cohort',
    },
  };

  const config = sections[section];

  async function load() {
    setLoading(true);
    try {
      const [faculties, departments, majors, cohorts] = await Promise.all([
        academicService.getAllFaculties(),
        academicService.getAllDepartments(),
        academicService.getAllMajors(),
        academicService.getAllCohorts(),
      ]);
      setData({ faculties, departments, majors, cohorts });
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
    { name: 'code', label: t('academic.code'), maxLength: 20 },
    { name: 'name', label: t('academic.name'), maxLength: 100 },
    ...(config.parent
      ? [{ name: config.parent, label: config.parentLabel, options: data[config.parentSection] }]
      : []),
    ...(section === 'cohorts'
      ? [
          { name: 'admissionYear', label: t('academic.admissionYear'), type: 'number', min: 2000, max: 2100 },
          { name: 'graduationYear', label: t('academic.graduationYear'), type: 'number', min: 2000, max: 2100 },
        ]
      : []),
  ];

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        ...(config.parent ? { [config.parent]: Number(form[config.parent]) } : {}),
        ...(section === 'cohorts'
          ? { admissionYear: Number(form.admissionYear), graduationYear: Number(form.graduationYear) }
          : {}),
      };
      if (form.id) await academicService[`update${config.serviceSingular}`](form.id, payload);
      else await academicService[`create${config.serviceSingular}`](payload);
      setForm(null);
      setSuccess(t('academic.savedSuccess', { item: config.singular }));
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(row) {
    if (!window.confirm(t('academic.confirmDelete', { name: row.name }))) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await academicService[`delete${config.serviceSingular}`](row.id);
      setSuccess(t('academic.deletedSuccess', { item: config.singular }));
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const rows = data[section].filter((row) =>
    `${row.code} ${row.name}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <ModuleShell
      title={t('academic.title')}
      description={t('academic.desc')}
      {...{ error, success, loading }}
    >
      <div className="flex flex-wrap gap-2">
        {Object.entries(sections).map(([key, value]) => (
          <button
            key={key}
            className={section === key ? buttonClass : 'rounded-lg border bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors'}
            disabled={busy}
            onClick={() => {
              setSection(key);
              setForm(null);
              setQuery('');
              setError('');
              setSuccess('');
            }}
          >
            {value.label}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <input
          aria-label={t('academic.searchPlaceholder')}
          className={inputClass}
          placeholder={t('academic.searchPlaceholder')}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {canManage && (
          <button
            className={`${buttonClass} shrink-0`}
            onClick={() => setForm({})}
            disabled={busy || loading}
          >
            {t('academic.add', { item: config.singular })}
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

      <div className="overflow-x-auto rounded-xl border bg-white shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="p-3">{t('academic.code')}</th>
              <th className="p-3">{t('academic.name')}</th>
              <th className="p-3">
                {config.parentLabel || (section === 'cohorts' ? t('academic.academicYears') : '')}
              </th>
              <th className="p-3">{t('academic.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t hover:bg-slate-50/50 transition-colors">
                <td className="p-3 font-mono font-medium text-slate-800">{row.code}</td>
                <td className="p-3 text-slate-700">{row.name}</td>
                <td className="p-3 text-slate-600">
                  {config.parent
                    ? data[config.parentSection].find((parent) => parent.id === row[config.parent])?.name
                    : section === 'cohorts'
                    ? `${row.admissionYear} - ${row.graduationYear}`
                    : ''}
                </td>
                <td className="space-x-3 p-3">
                  {canManage && (
                    <button
                      className="text-indigo-600 hover:text-indigo-800 font-medium"
                      onClick={() => setForm({ ...row })}
                      disabled={busy}
                    >
                      {t('common.edit')}
                    </button>
                  )}
                  {hasRole('ROLE_ADMIN') && (
                    <button
                      className="text-red-600 hover:text-red-800 font-medium"
                      onClick={() => remove(row)}
                      disabled={busy}
                    >
                      {t('common.delete')}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && rows.length === 0 && (
          <p className="p-5 text-slate-500 text-center">{t('academic.noRecordsFound')}</p>
        )}
      </div>
    </ModuleShell>
  );
}

export default AcademicPage;

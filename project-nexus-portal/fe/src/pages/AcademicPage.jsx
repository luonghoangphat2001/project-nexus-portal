import React, { useEffect, useState } from 'react';
import { academicService } from '../services/academicService';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import {
  PageHeader,
  FilterCard,
  FilterField,
  TableCard,
  Modal,
  EmptyState,
  Banner,
  buttonClass,
  inputClass,
  selectClass,
} from '../components/common/CommonUi';
import { Plus, Edit2, Trash2, Search, Building, Layers, GraduationCap, Calendar } from 'lucide-react';

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
      icon: Building,
    },
    departments: {
      label: t('academic.departments'),
      singular: t('academic.department'),
      serviceSingular: 'Department',
      parent: 'facultyId',
      parentLabel: t('academic.parentFaculty'),
      parentSection: 'faculties',
      icon: Layers,
    },
    majors: {
      label: t('academic.majors'),
      singular: t('academic.major'),
      serviceSingular: 'Major',
      parent: 'departmentId',
      parentLabel: t('academic.parentDepartment'),
      parentSection: 'departments',
      icon: GraduationCap,
    },
    cohorts: {
      label: t('academic.cohorts'),
      singular: t('academic.cohort'),
      serviceSingular: 'Cohort',
      icon: Calendar,
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
      setData({
        faculties: faculties || [],
        departments: departments || [],
        majors: majors || [],
        cohorts: cohorts || [],
      });
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
        code: form.code.trim(),
        name: form.name.trim(),
        ...(config.parent ? { [config.parent]: Number(form[config.parent]) } : {}),
        ...(section === 'cohorts'
          ? { admissionYear: Number(form.admissionYear), graduationYear: Number(form.graduationYear) }
          : {}),
      };
      if (form.id) {
        await academicService[`update${config.serviceSingular}`](form.id, payload);
      } else {
        await academicService[`create${config.serviceSingular}`](payload);
      }
      setForm(null);
      setSuccess(t('academic.savedSuccess', { item: config.singular }));
      await load();
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(row) {
    if (!window.confirm(t('academic.confirmDelete', { name: row.name }))) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await academicService[`delete${config.serviceSingular}`](row.id);
      setSuccess(t('academic.deletedSuccess', { item: config.singular }));
      await load();
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setBusy(false);
    }
  }

  const rows = (data[section] || []).filter((row) =>
    `${row.code} ${row.name}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <PageHeader
        title={t('academic.title')}
        description={t('academic.desc')}
        action={
          canManage && (
            <button
              onClick={() => {
                const initialForm = { code: '', name: '' };
                if (config.parent) {
                  initialForm[config.parent] = data[config.parentSection]?.[0]?.id || '';
                }
                if (section === 'cohorts') {
                  initialForm.admissionYear = 2026;
                  initialForm.graduationYear = 2030;
                }
                setForm(initialForm);
              }}
              className={buttonClass.primary}
            >
              <Plus className="w-4 h-4" />
              <span>{t('common.add')} {config.singular}</span>
            </button>
          )
        }
      />

      <Banner error={error} success={success} />

      {/* Navigation Tabs for Sections */}
      <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
        {Object.entries(sections).map(([key, value]) => {
          const Icon = value.icon;
          const isActive = section === key;
          return (
            <button
              key={key}
              disabled={busy}
              onClick={() => {
                setSection(key);
                setForm(null);
                setQuery('');
                setError('');
                setSuccess('');
              }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{value.label} ({data[key]?.length || 0})</span>
            </button>
          );
        })}
      </div>

      {/* Filter Card */}
      <FilterCard onReset={() => setQuery('')}>
        <FilterField label={t('common.search') || 'Search'}>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={`${t('academic.code')}, ${t('academic.name')}...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`${inputClass} pl-8.5`}
            />
          </div>
        </FilterField>
      </FilterCard>

      {/* Clean Table Card */}
      <TableCard>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/70 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">{t('academic.code')}</th>
                <th className="py-3 px-4">{t('academic.name')}</th>
                {config.parent && <th className="py-3 px-4">{config.parentLabel}</th>}
                {section === 'cohorts' && (
                  <>
                    <th className="py-3 px-4">{t('academic.admissionYear')}</th>
                    <th className="py-3 px-4">{t('academic.graduationYear')}</th>
                  </>
                )}
                {canManage && <th className="py-3 px-4 text-right">{t('common.actions')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <EmptyState
                      icon={config.icon}
                      message={t('academic.noEntriesFound', { section: config.label })}
                    />
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const parentItem = config.parent
                    ? data[config.parentSection]?.find((item) => item.id === row[config.parent])
                    : null;

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                        {row.code}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {row.name}
                      </td>
                      {config.parent && (
                        <td className="py-3.5 px-4 text-slate-600">
                          {parentItem?.name || '—'}
                        </td>
                      )}
                      {section === 'cohorts' && (
                        <>
                          <td className="py-3.5 px-4 font-mono text-slate-600">
                            {row.admissionYear}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-600">
                            {row.graduationYear}
                          </td>
                        </>
                      )}
                      {canManage && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => setForm({ ...row })}
                              className={buttonClass.actionRow}
                            >
                              <Edit2 className="w-3 h-3 text-slate-500" />
                              <span>{t('common.edit')}</span>
                            </button>

                            {hasRole('ROLE_ADMIN') && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleRemove(row)}
                                className={buttonClass.actionRowDanger}
                              >
                                <Trash2 className="w-3 h-3 text-rose-500" />
                                <span>{t('common.delete')}</span>
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </TableCard>

      {/* Edit / Create Modal */}
      <Modal
        isOpen={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? `${t('common.edit')} ${config.singular}` : `${t('common.add')} ${config.singular}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">{t('academic.code')} *</label>
            <input
              type="text"
              required
              maxLength={20}
              value={form?.code || ''}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">{t('academic.name')} *</label>
            <input
              type="text"
              required
              maxLength={100}
              value={form?.name || ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
            />
          </div>

          {config.parent && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{config.parentLabel} *</label>
              <select
                required
                value={form?.[config.parent] || ''}
                onChange={(e) => setForm({ ...form, [config.parent]: e.target.value })}
                className={selectClass}
              >
                {data[config.parentSection]?.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>
          )}

          {section === 'cohorts' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('academic.admissionYear')} *</label>
                <input
                  type="number"
                  min={2000}
                  max={2100}
                  required
                  value={form?.admissionYear || 2026}
                  onChange={(e) => setForm({ ...form, admissionYear: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('academic.graduationYear')} *</label>
                <input
                  type="number"
                  min={2000}
                  max={2100}
                  required
                  value={form?.graduationYear || 2030}
                  onChange={(e) => setForm({ ...form, graduationYear: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
          )}

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

export default AcademicPage;

import React, { useEffect, useState } from 'react';
import { systemService } from '../services/systemService';
import { academicService } from '../services/academicService';
import { useTranslation } from '../i18n/LanguageContext';
import {
  Server,
  Database,
  Cpu,
  Activity,
  Layers,
  Sliders,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Building,
  GraduationCap,
  Calendar,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { Modal, buttonClass, inputClass, selectClass } from '../components/common/CommonUi';

export const SystemAdminPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('academic'); // 'academic', 'settings', 'health'
  const [academicSubTab, setAcademicSubTab] = useState('faculties'); // 'faculties', 'departments', 'majors', 'cohorts'

  // States for Academic Data
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [majors, setMajors] = useState([]);
  const [cohorts, setCohorts] = useState([]);

  // States for Settings
  const [settings, setSettings] = useState([]);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // States for Health & Metrics
  const [metrics, setMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  // Messages
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Modals for Academic Data
  const [modalType, setModalType] = useState(null); // 'faculty', 'department', 'major', 'cohort'
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [formLoading, setFormLoading] = useState(false);

  const showNotification = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const fetchAcademicData = async () => {
    setErrorMessage('');
    try {
      const [f, d, m, c] = await Promise.all([
        academicService.getAllFaculties(),
        academicService.getAllDepartments(),
        academicService.getAllMajors(),
        academicService.getAllCohorts(),
      ]);
      setFaculties(Array.isArray(f) ? f : []);
      setDepartments(Array.isArray(d) ? d : []);
      setMajors(Array.isArray(m) ? m : []);
      setCohorts(Array.isArray(c) ? c : []);
    } catch (err) {
      setErrorMessage(err.message || t('common.error'));
    }
  };

  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await systemService.getSettings();
      if (res && res.data) {
        setSettings(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      setErrorMessage(err.message || t('common.error'));
    } finally {
      setSettingsLoading(false);
    }
  };

  const fetchMetrics = async () => {
    setMetricsLoading(true);
    try {
      const res = await systemService.getSystemMetrics();
      if (res && res.data) {
        setMetrics(res.data);
      }
    } catch (err) {
      setErrorMessage(err.message || t('common.error'));
    } finally {
      setMetricsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'academic') {
      fetchAcademicData();
    } else if (activeTab === 'settings') {
      fetchSettings();
    } else if (activeTab === 'health') {
      fetchMetrics();
    }
  }, [activeTab]);

  // Handle Academic Form Submit
  const handleAcademicSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setErrorMessage('');
    try {
      if (modalType === 'faculty') {
        if (editingItem) {
          await academicService.updateFaculty(editingItem.id, formData);
        } else {
          await academicService.createFaculty(formData);
        }
      } else if (modalType === 'department') {
        const payload = { ...formData, facultyId: Number(formData.facultyId) };
        if (editingItem) {
          await academicService.updateDepartment(editingItem.id, payload);
        } else {
          await academicService.createDepartment(payload);
        }
      } else if (modalType === 'major') {
        const payload = { ...formData, departmentId: Number(formData.departmentId) };
        if (editingItem) {
          await academicService.updateMajor(editingItem.id, payload);
        } else {
          await academicService.createMajor(payload);
        }
      } else if (modalType === 'cohort') {
        const payload = {
          ...formData,
          admissionYear: Number(formData.admissionYear),
          graduationYear: Number(formData.graduationYear),
        };
        if (editingItem) {
          await academicService.updateCohort(editingItem.id, payload);
        } else {
          await academicService.createCohort(payload);
        }
      }
      showNotification(t('systemAdmin.successMsg'));
      setModalType(null);
      setEditingItem(null);
      fetchAcademicData();
    } catch (err) {
      setErrorMessage(err.message || t('common.error'));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteAcademic = async (type, id, name) => {
    if (!window.confirm(`${t('systemAdmin.confirmDelete')} (${name})`)) return;
    try {
      if (type === 'faculty') await academicService.deleteFaculty(id);
      else if (type === 'department') await academicService.deleteDepartment(id);
      else if (type === 'major') await academicService.deleteMajor(id);
      else if (type === 'cohort') await academicService.deleteCohort(id);
      showNotification(t('systemAdmin.successMsg'));
      fetchAcademicData();
    } catch (err) {
      setErrorMessage(err.message || t('common.error'));
    }
  };

  const handleUpdateSetting = async (key, val, desc) => {
    try {
      await systemService.updateSetting(key, { settingValue: val, description: desc });
      showNotification(t('systemAdmin.successMsg'));
      fetchSettings();
    } catch (err) {
      setErrorMessage(err.message || t('common.error'));
    }
  };

  const openCreateModal = (type) => {
    setModalType(type);
    setEditingItem(null);
    if (type === 'faculty') setFormData({ code: '', name: '' });
    else if (type === 'department') setFormData({ facultyId: faculties[0]?.id || '', code: '', name: '' });
    else if (type === 'major') setFormData({ departmentId: departments[0]?.id || '', code: '', name: '' });
    else if (type === 'cohort') setFormData({ code: '', name: '', admissionYear: 2026, graduationYear: 2030 });
  };

  const openEditModal = (type, item) => {
    setModalType(type);
    setEditingItem(item);
    setFormData({ ...item });
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb > 1024) return `${(mb / 1024).toFixed(2)} GB`;
    return `${mb.toFixed(1)} MB`;
  };

  const formatUptime = (seconds) => {
    if (!seconds) return '0s';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2 tracking-tight">
            <Server className="w-7 h-7 text-[#b66dff]" />
            {t('systemAdmin.title')}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t('systemAdmin.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('academic')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeTab === 'academic' ? 'bg-white text-[#b66dff] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('systemAdmin.tabAcademic')}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeTab === 'settings' ? 'bg-white text-[#b66dff] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('systemAdmin.tabSettings')}
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeTab === 'health' ? 'bg-white text-[#b66dff] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('systemAdmin.tabHealth')}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl flex items-center gap-2">
          <CheckCircle className="w-5 h-5 shrink-0" />
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* TAB 1: ACADEMIC MASTER DATA */}
      {activeTab === 'academic' && (
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
            {/* Subtabs */}
            <div className="flex items-center gap-2">
              {[
                { id: 'faculties', label: `${t('systemAdmin.faculties')} (${faculties.length})`, icon: <Building className="w-4 h-4" /> },
                { id: 'departments', label: `${t('systemAdmin.departments')} (${departments.length})`, icon: <Layers className="w-4 h-4" /> },
                { id: 'majors', label: `${t('systemAdmin.majors')} (${majors.length})`, icon: <GraduationCap className="w-4 h-4" /> },
                { id: 'cohorts', label: `${t('systemAdmin.cohorts')} (${cohorts.length})`, icon: <Calendar className="w-4 h-4" /> },
              ].map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setAcademicSubTab(sub.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                    academicSubTab === sub.id
                      ? 'bg-brand-50 text-[#b66dff] border border-[#e1c2ff]'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {sub.icon}
                  {sub.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                if (academicSubTab === 'faculties') openCreateModal('faculty');
                else if (academicSubTab === 'departments') openCreateModal('department');
                else if (academicSubTab === 'majors') openCreateModal('major');
                else if (academicSubTab === 'cohorts') openCreateModal('cohort');
              }}
              className={buttonClass.primary}
            >
              <Plus className="w-4 h-4" />
              <span>
                {academicSubTab === 'faculties'
                  ? t('systemAdmin.addFaculty')
                  : academicSubTab === 'departments'
                  ? t('systemAdmin.addDepartment')
                  : academicSubTab === 'majors'
                  ? t('systemAdmin.addMajor')
                  : t('systemAdmin.addCohort')}
              </span>
            </button>
          </div>

          {/* Subtab Content: Faculties */}
          {academicSubTab === 'faculties' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 font-bold text-slate-400 uppercase text-[11px]">
                    <th className="py-3 px-4">{t('systemAdmin.colCode')}</th>
                    <th className="py-3 px-4">{t('systemAdmin.colName')}</th>
                    <th className="py-3 px-4 text-right">{t('systemAdmin.colActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {faculties.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-[#b66dff]">{f.code}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{f.name}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openEditModal('faculty', f)}
                            className="p-1.5 text-[#b66dff] hover:bg-brand-50 rounded-lg cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAcademic('faculty', f.id, f.name)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Subtab Content: Departments */}
          {academicSubTab === 'departments' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 font-bold text-slate-400 uppercase text-[11px]">
                    <th className="py-3 px-4">{t('systemAdmin.colCode')}</th>
                    <th className="py-3 px-4">{t('systemAdmin.colName')}</th>
                    <th className="py-3 px-4">{t('systemAdmin.colParentFaculty')}</th>
                    <th className="py-3 px-4 text-right">{t('systemAdmin.colActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {departments.map((d) => {
                    const faculty = faculties.find((f) => f.id === d.facultyId);
                    return (
                      <tr key={d.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-mono font-bold text-[#b66dff]">{d.code}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{d.name}</td>
                        <td className="py-3 px-4 text-slate-600">{faculty ? faculty.name : '—'}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => openEditModal('department', d)}
                              className="p-1.5 text-[#b66dff] hover:bg-brand-50 rounded-lg cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteAcademic('department', d.id, d.name)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Subtab Content: Majors */}
          {academicSubTab === 'majors' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 font-bold text-slate-400 uppercase text-[11px]">
                    <th className="py-3 px-4">{t('systemAdmin.colCode')}</th>
                    <th className="py-3 px-4">{t('systemAdmin.colName')}</th>
                    <th className="py-3 px-4">{t('systemAdmin.colManagingDept')}</th>
                    <th className="py-3 px-4 text-right">{t('systemAdmin.colActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {majors.map((m) => {
                    const dept = departments.find((d) => d.id === m.departmentId);
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-mono font-bold text-[#b66dff]">{m.code}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{m.name}</td>
                        <td className="py-3 px-4 text-slate-600">{dept ? dept.name : '—'}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => openEditModal('major', m)}
                              className="p-1.5 text-[#b66dff] hover:bg-brand-50 rounded-lg cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteAcademic('major', m.id, m.name)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Subtab Content: Cohorts */}
          {academicSubTab === 'cohorts' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 font-bold text-slate-400 uppercase text-[11px]">
                    <th className="py-3 px-4">{t('systemAdmin.colCode')}</th>
                    <th className="py-3 px-4">{t('systemAdmin.colName')}</th>
                    <th className="py-3 px-4">{t('systemAdmin.colAdmissionYear')}</th>
                    <th className="py-3 px-4">{t('systemAdmin.colGraduationYear')}</th>
                    <th className="py-3 px-4 text-right">{t('systemAdmin.colActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {cohorts.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-[#b66dff]">{c.code}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{c.name}</td>
                      <td className="py-3 px-4 text-slate-600 font-mono">{c.admissionYear}</td>
                      <td className="py-3 px-4 text-slate-600 font-mono">{c.graduationYear}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openEditModal('cohort', c)}
                            className="p-1.5 text-[#b66dff] hover:bg-brand-50 rounded-lg cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAcademic('cohort', c.id, c.name)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SYSTEM SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#b66dff]" />
                {t('systemAdmin.settingsTitle')}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('systemAdmin.settingsSub')}
              </p>
            </div>
            <button
              onClick={fetchSettings}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${settingsLoading ? 'animate-spin' : ''}`} />
              {t('systemAdmin.refreshSettings')}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {settings.map((s) => (
              <div key={s.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#b66dff] bg-brand-50 px-2 py-0.5 rounded border border-[#e1c2ff]">
                      {s.settingKey}
                    </span>
                    <p className="text-xs text-slate-500 mt-1">{s.description}</p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {s.category}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  {s.settingValue === 'true' || s.settingValue === 'false' ? (
                    <button
                      onClick={() =>
                        handleUpdateSetting(s.settingKey, s.settingValue === 'true' ? 'false' : 'true', s.description)
                      }
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                        s.settingValue === 'true'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {s.settingValue === 'true' ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      {s.settingValue === 'true' ? t('systemAdmin.enabled') : t('systemAdmin.disabled')}
                    </button>
                  ) : (
                    <input
                      type="text"
                      defaultValue={s.settingValue}
                      onBlur={(e) => {
                        if (e.target.value !== s.settingValue) {
                          handleUpdateSetting(s.settingKey, e.target.value, s.description);
                        }
                      }}
                      className={inputClass}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SERVER HEALTH & METRICS */}
      {activeTab === 'health' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-xs border border-slate-200">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#b66dff]" />
              <span className="text-sm font-bold text-slate-800">{t('systemAdmin.serverHealthTitle')}</span>
            </div>
            <button
              onClick={fetchMetrics}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${metricsLoading ? 'animate-spin' : ''}`} />
              {t('systemAdmin.refreshMetrics')}
            </button>
          </div>

          {metrics ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: JVM & System Resources */}
              <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Cpu className="w-5 h-5 text-[#b66dff]" />
                  <h3 className="font-bold text-slate-800 text-sm">{t('systemAdmin.jvmTitle')}</h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-600 mb-1">
                      <span>{t('systemAdmin.usedMemory')}</span>
                      <strong className="text-slate-800 font-mono">
                        {formatBytes(metrics.usedMemoryBytes)} / {formatBytes(metrics.totalMemoryBytes)}
                      </strong>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#da8cff] to-[#9a55ff] h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round((metrics.usedMemoryBytes / (metrics.totalMemoryBytes || 1)) * 100)
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>{t('systemAdmin.maxMemory')}</span>
                    <strong className="text-slate-800 font-mono">{formatBytes(metrics.maxMemoryBytes)}</strong>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>{t('systemAdmin.cpuProcessors')}</span>
                    <strong className="text-slate-800 font-mono">{metrics.availableProcessors} Cores</strong>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>{t('systemAdmin.javaRuntime')}</span>
                    <strong className="text-[#b66dff] font-mono">JDK {metrics.jvmVersion}</strong>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>{t('systemAdmin.serverUptime')}</span>
                    <strong className="text-emerald-600 font-mono">{formatUptime(metrics.uptimeSeconds)}</strong>
                  </div>
                </div>
              </div>

              {/* Card 2: Database Connectivity */}
              <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Database className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-800 text-sm">{t('systemAdmin.dbTitle')}</h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>{t('systemAdmin.connStatus')}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                      {t('systemAdmin.connected')}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>{t('systemAdmin.totalUsers')}</span>
                    <strong className="text-slate-800 font-mono">
                      {metrics.totalUsers} ({t('systemAdmin.activeUsers')} {metrics.activeUsers})
                    </strong>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>{t('systemAdmin.totalTopics')}</span>
                    <strong className="text-slate-800 font-mono">{metrics.totalTopics}</strong>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>{t('systemAdmin.totalTeams')}</span>
                    <strong className="text-slate-800 font-mono">{metrics.totalTeams}</strong>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>{t('systemAdmin.matchmakingPosts')}</span>
                    <strong className="text-slate-800 font-mono">{metrics.totalMatchmakingPosts}</strong>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>{t('systemAdmin.recordedLogs')}</span>
                    <strong className="text-[#b66dff] font-mono">{metrics.totalAuditLogs} events</strong>
                  </div>
                </div>
              </div>

              {/* Card 3: Academic Counts */}
              <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <GraduationCap className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-slate-800 text-sm">{t('systemAdmin.academicCountsTitle')}</h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>{t('systemAdmin.faculties')}:</span>
                    <strong className="text-slate-800 font-mono">{metrics.totalFaculties}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>{t('systemAdmin.departments')}:</span>
                    <strong className="text-slate-800 font-mono">{metrics.totalDepartments}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>{t('systemAdmin.majors')}:</span>
                    <strong className="text-slate-800 font-mono">{metrics.totalMajors}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>{t('systemAdmin.cohorts')}:</span>
                    <strong className="text-slate-800 font-mono">{metrics.totalCohorts}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>{t('systemAdmin.systemRolesCount')}</span>
                    <strong className="text-slate-800 font-mono">{metrics.totalRoles}</strong>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#b66dff]" />
              {t('common.loading')}
            </div>
          )}
        </div>
      )}

      {/* Modal CRUD Academic Data */}
      <Modal
        isOpen={!!modalType}
        onClose={() => setModalType(null)}
        title={`${editingItem ? t('systemAdmin.modalEditTitle') : t('systemAdmin.modalAddTitle')} ${
          modalType === 'faculty'
            ? t('systemAdmin.faculties')
            : modalType === 'department'
            ? t('systemAdmin.departments')
            : modalType === 'major'
            ? t('systemAdmin.majors')
            : t('systemAdmin.cohorts')
        }`}
      >
        <form onSubmit={handleAcademicSubmit} className="space-y-4 text-xs">
          {modalType === 'department' && (
            <div>
              <label className="block font-semibold text-slate-600 mb-1">{t('systemAdmin.colParentFaculty')} *</label>
              <select
                required
                value={formData.facultyId || ''}
                onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
                className={selectClass}
              >
                {faculties.map((f) => (
                  <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
                ))}
              </select>
            </div>
          )}

          {modalType === 'major' && (
            <div>
              <label className="block font-semibold text-slate-600 mb-1">{t('systemAdmin.colManagingDept')} *</label>
              <select
                required
                value={formData.departmentId || ''}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className={selectClass}
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-600 mb-1">{t('systemAdmin.colCode')} *</label>
            <input
              type="text"
              required
              value={formData.code || ''}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="e.g. FIT, CS, 2026"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">{t('systemAdmin.colName')} *</label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Faculty of Information Technology"
              className={inputClass}
            />
          </div>

          {modalType === 'cohort' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">{t('systemAdmin.colAdmissionYear')} *</label>
                <input
                  type="number"
                  required
                  value={formData.admissionYear || 2026}
                  onChange={(e) => setFormData({ ...formData, admissionYear: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">{t('systemAdmin.colGraduationYear')} *</label>
                <input
                  type="number"
                  required
                  value={formData.graduationYear || 2030}
                  onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalType(null)}
              className={buttonClass.secondary}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className={buttonClass.primary}
            >
              {formLoading ? t('common.loading') : t('systemAdmin.saveBtn')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SystemAdminPage;

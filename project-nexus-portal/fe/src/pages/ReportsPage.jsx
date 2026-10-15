import React, { useEffect, useRef, useState } from 'react';
import { Download, Upload, FileText, RefreshCw, CalendarClock, GraduationCap } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import reportService from '../services/reportService';
import { useTranslation } from '../i18n/LanguageContext';
import {
  PageHeader,
  FilterCard,
  FilterField,
  TableCard,
  TableHeaderBar,
  StatusBadge,
  buttonClass,
  inputClass,
  selectClass
} from '../components/common/CommonUi';

function formatDate(date) {
  if (!date) return '—';
  try {
    return new Date(date).toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return String(date);
  }
}

export function ReportsPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const requestedId = params.get('registrationId');
  const [registrations, setRegistrations] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [values, setValues] = useState({ type: 'REPORT', title: '', note: '', file: null });
  const fileInput = useRef(null);
  const selected = registrations.find((r) => String(r.id) === selectedId);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    reportService.getRegistrations()
      .then((data) => {
        if (!active) return;
        setRegistrations(data);
        setSelectedId((id) => data.some((r) => String(r.id) === (id || requestedId)) ? (id || requestedId) : String(data[0]?.id || ''));
      })
      .catch((e) => { if (active) setError(e.message || t('common.error')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh, requestedId, t]);

  useEffect(() => {
    let active = true;
    setDocuments([]);
    if (!selectedId) { setDocumentLoading(false); return () => { active = false; }; }
    setDocumentLoading(true);
    setError('');
    reportService.getDocuments(selectedId)
      .then((data) => { if (active) setDocuments(data); })
      .catch((e) => { if (active) setError(e.message || t('common.error')); })
      .finally(() => { if (active) setDocumentLoading(false); });
    return () => { active = false; };
  }, [selectedId, refresh, t]);

  const upload = async (e) => {
    e.preventDefault();
    if (!values.file || !selected) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await reportService.uploadDocument(selected.id, values);
      setValues({ type: 'REPORT', title: '', note: '', file: null });
      if (fileInput.current) fileInput.current.value = '';
      setNotice(t('reports.successNotice'));
      setRefresh((v) => v + 1);
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  const download = async (id) => {
    setBusy(true);
    setError('');
    try {
      await reportService.downloadDocument(id);
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('reports.title')}
        description={t('reports.subtitle')}
        action={
          <button
            disabled={busy || loading}
            onClick={() => setRefresh((v) => v + 1)}
            className={buttonClass('secondary')}
          >
            <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />
            <span>{t('reports.refresh')}</span>
          </button>
        }
      />

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}
      {notice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
          {notice}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-sm text-slate-500 bg-white rounded-2xl border border-slate-200">
          {t('common.loading')}
        </div>
      ) : registrations.length === 0 ? (
        <div className="p-12 text-center text-sm text-slate-500 bg-white rounded-2xl border border-slate-200">
          {t('reports.noRegistrations')}
        </div>
      ) : (
        <>
          {/* Project & Submission Milestone Selector Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs transition-all">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
              {/* Left Column: Project / Registration Select */}
              <div className="lg:col-span-7 space-y-2">
                <label className="block text-sm font-bold text-slate-800 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <span>{t('reports.selectTeamProject')}</span>
                </label>
                <div className="relative">
                  <select
                    disabled={busy}
                    className={selectClass}
                    value={selectedId}
                    onChange={(e) => {
                      setSelectedId(e.target.value);
                      setNotice('');
                      setValues({ type: 'REPORT', title: '', note: '', file: null });
                      if (fileInput.current) fileInput.current.value = '';
                    }}
                  >
                    {registrations.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.topicTitle} — Nhóm: {r.teamName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Additional project details */}
                {selected && (
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200/60">
                      {selected.periodName}
                    </span>
                    {selected.departmentName && (
                      <span className="text-slate-600 font-medium">
                        {selected.departmentName}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Submission Deadline Milestone */}
              <div className="lg:col-span-5">
                {selected && (
                  <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/50 border border-amber-200/80 rounded-xl p-4 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-100/80 text-amber-700 shrink-0 mt-0.5">
                      <CalendarClock className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                          {t('reports.deadlineNotice', 'Hạn chót nộp tài liệu')}
                        </span>
                        {selected.canSubmit ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            {t('common.open', 'Đang mở nộp')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-700">
                            {t('common.closed', 'Chỉ xem')}
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-bold text-slate-900 font-mono">
                        {formatDate(selected.submissionDeadline)}
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {t('reports.deadlineSub', '(Vui lòng nộp đầy đủ file báo cáo/slide trước thời hạn)')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Upload Document Form */}
          {selected?.canSubmit && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-slate-900">{t('reports.submitNewVersion')}</h2>
              <form onSubmit={upload} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      {t('reports.docType')} *
                    </label>
                    <select
                      className={selectClass}
                      value={values.type}
                      disabled={busy}
                      onChange={(e) => setValues({ ...values, type: e.target.value })}
                    >
                      {['REPORT', 'SLIDES', 'SOURCE_CODE', 'OTHER'].map((type) => (
                        <option key={type} value={type}>
                          {t(`enums.docType.${type}`, type)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      {t('reports.docTitle')} *
                    </label>
                    <input
                      required
                      maxLength={200}
                      className={inputClass}
                      value={values.title}
                      disabled={busy}
                      placeholder={t('reports.docTitle')}
                      onChange={(e) => setValues({ ...values, title: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    {t('reports.fileLabel')} *
                  </label>
                  <input
                    ref={fileInput}
                    type="file"
                    required
                    accept=".pdf,.docx,.pptx,.zip,.txt"
                    disabled={busy}
                    className={inputClass}
                    onChange={(e) => setValues({ ...values, file: e.target.files[0] || null })}
                  />
                  <p className="mt-1 text-xs text-slate-500">{t('reports.fileLimitNote')}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    {t('reports.notes')}
                  </label>
                  <textarea
                    rows={2}
                    maxLength={2000}
                    className={inputClass}
                    value={values.note}
                    disabled={busy}
                    placeholder={t('reports.notes')}
                    onChange={(e) => setValues({ ...values, note: e.target.value })}
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={busy || !values.file || !values.title.trim()}
                    className={buttonClass('primary')}
                  >
                    <Upload className="w-4 h-4" />
                    <span>{busy ? t('reports.processing') : t('reports.submitDoc')}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Submission History Table */}
          <TableCard>
            <TableHeaderBar
              title={t('reports.historyTitle')}
              count={documents.length}
            />

            {documentLoading ? (
              <div className="p-8 text-center text-sm text-slate-500">
                {t('reports.loadingDocs')}
              </div>
            ) : documents.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                {t('reports.noDocs')}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold text-sm">
                      <th className="py-3.5 px-4">{t('reports.docTitle')}</th>
                      <th className="py-3.5 px-4">{t('reports.docType')}</th>
                      <th className="py-3.5 px-4">{t('reports.fileLabel')}</th>
                      <th className="py-3.5 px-4">Người nộp</th>
                      <th className="py-3.5 px-4">Thời gian</th>
                      <th className="py-3.5 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {documents.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                            <span>{d.title}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">
                              v{d.version}
                            </span>
                          </div>
                          {d.note && (
                            <p className="mt-1 text-xs text-slate-500 italic">"{d.note}"</p>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge value={d.type} type="docType" />
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                          <div>{d.fileName}</div>
                          <div className="text-slate-400">{(d.fileSize / 1024 / 1024).toFixed(2)} MB</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          {d.submittedByName}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-xs">
                          {formatDate(d.submittedAt)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            disabled={busy}
                            onClick={() => download(d.id)}
                            className={buttonClass('secondary')}
                          >
                            <Download className="w-3.5 h-3.5 text-blue-600" />
                            <span>{t('reports.download')}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TableCard>
        </>
      )}
    </div>
  );
}

export default ReportsPage;

import React, { useEffect, useRef, useState } from 'react';
import { Download, Upload, FileText, RefreshCw } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import reportService from '../services/reportService';
import { useTranslation } from '../i18n/LanguageContext';
import { Banner, Button, Empty, Field, Panel, formatDate, inputClass } from '../components/common/DefenseUi';
import { StatusBadge } from '../components/common/CommonUi';

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
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{t('reports.title')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('reports.subtitle')}</p>
        </div>
        <Button secondary disabled={busy || loading} onClick={() => setRefresh((v) => v + 1)}>
          <RefreshCw size={16} />
          <span>{t('reports.refresh')}</span>
        </Button>
      </div>

      <Banner error={error} notice={notice} />

      {loading ? (
        <Empty>{t('common.loading')}</Empty>
      ) : registrations.length === 0 ? (
        <Panel><Empty>{t('reports.noRegistrations')}</Empty></Panel>
      ) : (
        <>
          <Panel>
            <Field label={t('reports.selectTeamProject')}>
              <select
                disabled={busy}
                className={inputClass}
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
                    {r.teamName} · {r.topicTitle} · {r.periodName}
                  </option>
                ))}
              </select>
            </Field>
            {selected && (
              <p className="mt-3 text-sm text-slate-500">
                {t('reports.deadlineNotice')} <strong>{formatDate(selected.submissionDeadline)}</strong> {t('reports.deadlineSub')}
              </p>
            )}
          </Panel>

          {selected?.canSubmit && (
            <Panel>
              <form onSubmit={upload} className="space-y-4">
                <h2 className="font-semibold text-slate-800">{t('reports.submitNewVersion')}</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label={t('reports.docType')}>
                    <select
                      className={inputClass}
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
                  </Field>
                  <Field label={t('reports.docTitle')}>
                    <input
                      required
                      maxLength={200}
                      className={inputClass}
                      value={values.title}
                      disabled={busy}
                      onChange={(e) => setValues({ ...values, title: e.target.value })}
                    />
                  </Field>
                </div>
                <Field label={t('reports.fileLabel')}>
                  <input
                    ref={fileInput}
                    type="file"
                    required
                    accept=".pdf,.docx,.pptx,.zip,.txt"
                    disabled={busy}
                    className={inputClass}
                    onChange={(e) => setValues({ ...values, file: e.target.files[0] || null })}
                  />
                </Field>
                <p className="text-xs text-slate-500">{t('reports.fileLimitNote')}</p>
                <Field label={t('reports.notes')}>
                  <textarea
                    rows={2}
                    maxLength={2000}
                    className={inputClass}
                    value={values.note}
                    disabled={busy}
                    onChange={(e) => setValues({ ...values, note: e.target.value })}
                  />
                </Field>
                <Button type="submit" disabled={busy || !values.file || !values.title.trim()}>
                  <Upload size={16} />
                  <span>{busy ? t('reports.processing') : t('reports.submitDoc')}</span>
                </Button>
              </form>
            </Panel>
          )}

          <Panel>
            <h2 className="font-semibold text-slate-800">{t('reports.historyTitle')}</h2>
            {documentLoading ? (
              <Empty>{t('reports.loadingDocs')}</Empty>
            ) : documents.length === 0 ? (
              <Empty>{t('reports.noDocs')}</Empty>
            ) : (
              <div className="mt-4 divide-y divide-slate-100">
                {documents.map((d) => (
                  <div key={d.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
                    <div className="flex min-w-0 gap-3">
                      <FileText className="mt-1 shrink-0 text-[#b66dff]" size={20} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="break-words font-medium text-slate-800">{d.title}</p>
                          <span className="text-xs text-[#b66dff] font-semibold">v{d.version}</span>
                          <StatusBadge value={d.type} type="docType" />
                        </div>
                        <p className="mt-1 break-all text-xs text-slate-500 font-mono">
                          {d.fileName} · {(d.fileSize / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {d.submittedByName} · {formatDate(d.submittedAt)}
                        </p>
                        {d.note && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600 italic">"{d.note}"</p>}
                      </div>
                    </div>
                    <Button secondary disabled={busy} onClick={() => download(d.id)}>
                      <Download size={16} />
                      <span>{t('reports.download')}</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}

export default ReportsPage;

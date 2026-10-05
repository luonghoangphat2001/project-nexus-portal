import React, { useEffect, useRef, useState } from 'react';
import { Download, Upload, FileText, RefreshCw } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import reportService from '../services/reportService';
import { Banner, Button, Empty, Field, Panel, formatDate, inputClass, labels } from '../components/common/DefenseUi';

export function ReportsPage() {
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
    reportService.getRegistrations().then((data) => {
      if (!active) return;
      setRegistrations(data);
      setSelectedId((id) => data.some((r) => String(r.id) === (id || requestedId)) ? (id || requestedId) : String(data[0]?.id || ''));
    }).catch((e) => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh, requestedId]);

  useEffect(() => {
    let active = true;
    setDocuments([]);
    if (!selectedId) { setDocumentLoading(false); return () => { active = false; }; }
    setDocumentLoading(true);
    setError('');
    reportService.getDocuments(selectedId).then((data) => { if (active) setDocuments(data); })
      .catch((e) => { if (active) setError(e.message); })
      .finally(() => { if (active) setDocumentLoading(false); });
    return () => { active = false; };
  }, [selectedId, refresh]);

  const upload = async (e) => {
    e.preventDefault();
    if (!values.file || !selected) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await reportService.uploadDocument(selected.id, values);
      setValues({ type: 'REPORT', title: '', note: '', file: null });
      fileInput.current.value = '';
      setNotice('Document submitted. A new version has been saved with the previous submission history.');
      setRefresh((v) => v + 1);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  const download = async (id) => {
    setBusy(true); setError('');
    try { await reportService.downloadDocument(id); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl font-bold text-slate-800">Reports & Documents</h1>
        <p className="mt-1 text-sm text-slate-500">Module 11 · Submit and manage documents for approved team projects.</p></div>
      <Button secondary disabled={busy || loading} onClick={() => setRefresh((v) => v + 1)}><RefreshCw size={16} />Refresh</Button>
    </div>
    <Banner error={error} notice={notice} />
    {loading ? <Empty>Loading project registrations...</Empty> : registrations.length === 0
      ? <Panel><Empty>No approved project registrations are available to you.</Empty></Panel>
      : <>
        <Panel><Field label="Team / Project"><select disabled={busy} className={inputClass} value={selectedId}
          onChange={(e) => { setSelectedId(e.target.value); setNotice(''); setValues({ type: 'REPORT', title: '', note: '', file: null }); if (fileInput.current) fileInput.current.value = ''; }}>
          {registrations.map((r) => <option key={r.id} value={r.id}>{r.teamName} · {r.topicTitle} · {r.periodName}</option>)}
        </select></Field>
          {selected && <p className="mt-3 text-sm text-slate-500">Submission deadline: <strong>{formatDate(selected.submissionDeadline)}</strong> (Vietnam time, UTC+7). Only team leaders can submit documents.</p>}
        </Panel>
        {selected?.canSubmit && <Panel><form onSubmit={upload} className="space-y-4">
          <h2 className="font-semibold text-slate-800">Submit a New Version</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Document Type"><select className={inputClass} value={values.type} disabled={busy}
              onChange={(e) => setValues({ ...values, type: e.target.value })}>
              {['REPORT', 'SLIDES', 'SOURCE_CODE', 'OTHER'].map((type) => <option key={type} value={type}>{labels[type]}</option>)}
            </select></Field>
            <Field label="Title"><input required maxLength={200} className={inputClass} value={values.title} disabled={busy}
              onChange={(e) => setValues({ ...values, title: e.target.value })} /></Field>
          </div>
          <Field label="File (PDF, DOCX, PPTX, ZIP, TXT)"><input ref={fileInput} type="file" required accept=".pdf,.docx,.pptx,.zip,.txt"
            disabled={busy} className={inputClass} onChange={(e) => setValues({ ...values, file: e.target.files[0] || null })} /></Field>
          <p className="text-xs text-slate-500">Default file limit: 10 MB. Further submissions are locked after an assessment is submitted.</p>
          <Field label="Notes"><textarea rows={2} maxLength={2000} className={inputClass} value={values.note} disabled={busy}
            onChange={(e) => setValues({ ...values, note: e.target.value })} /></Field>
          <Button type="submit" disabled={busy || !values.file || !values.title.trim()}><Upload size={16} />{busy ? 'Processing...' : 'Submit Document'}</Button>
        </form></Panel>}
        <Panel><h2 className="font-semibold text-slate-800">Submission History</h2>
          {documentLoading ? <Empty>Loading documents...</Empty> : documents.length === 0 ? <Empty>No documents have been submitted.</Empty>
            : <div className="mt-4 divide-y divide-slate-100">{documents.map((d) => <div key={d.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
              <div className="flex min-w-0 gap-3"><FileText className="mt-1 shrink-0 text-indigo-500" size={20} /><div className="min-w-0">
                <p className="break-words font-medium text-slate-800">{d.title} <span className="text-xs text-indigo-600">v{d.version} · {labels[d.type]}</span></p>
                <p className="mt-1 break-all text-xs text-slate-500">{d.fileName} · {(d.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                <p className="mt-1 text-xs text-slate-500">{d.submittedByName} · {formatDate(d.submittedAt)}</p>
                {d.note && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{d.note}</p>}
              </div></div><Button secondary disabled={busy} onClick={() => download(d.id)}><Download size={16} />Download</Button>
            </div>)}</div>}
        </Panel>
      </>}
  </div>;
}

export default ReportsPage;

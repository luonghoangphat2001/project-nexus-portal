import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Plus, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import councilService from '../services/councilService';
import reportService from '../services/reportService';
import { CouncilForm } from '../components/common/CouncilForm';
import { Badge, Banner, Button, Empty, Panel, formatDate, inputClass, labels } from '../components/common/DefenseUi';

export function CouncilsPage() {
  const { user } = useAuth();
  const manager = user?.roles?.some((r) => ['ROLE_ADMIN', 'ROLE_PRINCIPAL'].includes(r));
  const [councils, setCouncils] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [options, setOptions] = useState(null);
  const [editor, setEditor] = useState(null);
  const [allocation, setAllocation] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    Promise.all([councilService.getCouncils(), reportService.getRegistrations(), manager ? councilService.getOptions() : Promise.resolve(null)])
      .then(([data, regs, opts]) => { if (active) { setCouncils(data); setRegistrations(regs); setOptions(opts); } })
      .catch((e) => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [manager, refresh]);

  const action = async (execute, message, close = false) => {
    setBusy(true); setError(''); setNotice('');
    try {
      await execute();
      if (close) setEditor(null);
      setAllocation({}); setNotice(message); setRefresh((n) => n + 1);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const assigned = new Set(councils.flatMap((c) => c.assignments.map((a) => a.registration.id)));
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div>
      <h1 className="text-2xl font-bold text-slate-800">Council Assignments</h1>
      <p className="mt-1 text-sm text-slate-500">Module 12 · Manage councils, members and defense schedules by department.</p>
    </div><div className="flex gap-2">
      <Button secondary disabled={busy || loading} onClick={() => setRefresh((n) => n + 1)}><RefreshCw size={16} />Refresh</Button>
      {manager && options?.departments.length > 0 && <Button disabled={busy || loading} onClick={() => setEditor({ mode: 'create' })}><Plus size={16} />Create Council</Button>}
    </div></div>
    <Banner error={error} notice={notice} />
    {editor && options && <Panel><CouncilForm key={editor.council?.id || 'create'} council={editor.council} options={options} busy={busy}
      onCancel={() => setEditor(null)} onSave={(data) => action(() => editor.council
        ? councilService.updateCouncil(editor.council.id, data) : councilService.createCouncil(data), 'Council saved.', true)} /></Panel>}
    {loading ? <Empty>Loading councils...</Empty> : councils.length === 0 ? <Panel><Empty>No councils are available to you.</Empty></Panel>
      : councils.map((c) => <Panel key={c.id} className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3"><div>
          <div className="flex flex-wrap items-center gap-2"><CalendarDays className="text-indigo-600" size={20} /><h2 className="font-semibold text-slate-800">{c.name}</h2><Badge value={c.status} /></div>
          <p className="mt-2 text-sm text-slate-500">{c.departmentName} · {c.periodName}</p>
          <p className="mt-1 text-sm text-slate-600">{c.room} · {formatDate(c.startsAt)} → {formatDate(c.endsAt)} (Vietnam time, UTC+7)</p>
        </div>{c.canManage && c.status === 'SCHEDULED' && <div className="flex flex-wrap gap-2">
          <Button secondary disabled={busy} onClick={() => { setEditor({ council: c }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Edit</Button>
          <Button secondary disabled={busy} onClick={() => {
            if (window.confirm('Complete this council? Further changes will be locked. All required assessments must be submitted first.')) action(() => councilService.changeStatus(c.id, 'COMPLETED'), 'Council completed.');
          }}>Complete</Button>
          <Button danger disabled={busy} onClick={() => {
            if (window.confirm('Cancel this council? Remove existing assignments before moving teams to another council.')) action(() => councilService.changeStatus(c.id, 'CANCELLED'), 'Council cancelled.');
          }}>Cancel Council</Button>
        </div>}</div>
        <div className="flex flex-wrap gap-2">{c.members.map((m) => <span key={m.lecturerId} className="px-3 py-2 rounded-xl text-xs text-slate-700 bg-slate-50 border border-slate-100">{m.fullName} · <strong>{labels[m.role]}</strong></span>)}</div>
        <div className="border-t border-slate-100 pt-4"><h3 className="text-sm font-semibold text-slate-700">Assigned Teams ({c.assignments.length})</h3>
          {c.assignments.length === 0 ? <Empty>No teams have been assigned.</Empty> : <div className="mt-3 space-y-3">{c.assignments.map((a) => <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50">
            <div><p className="text-sm font-medium text-slate-800">{a.registration.teamName} · {a.registration.topicTitle}</p>
              <p className="mt-1 text-xs text-slate-500">{a.registration.students.map((s) => `${s.fullName} (${s.studentCode || s.id})`).join(', ')}</p></div>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link className="self-center text-indigo-600 hover:underline" to={`/reports?registrationId=${a.registration.id}`}>Documents</Link>
              {(a.canReview || a.canDefense || c.canManage) && <Link className="self-center text-indigo-600 hover:underline" to={`/assessments?assignmentId=${a.id}`}>Assessments</Link>}
              {c.canManage && c.status !== 'COMPLETED' && <Button danger disabled={busy} onClick={() => {
                if (window.confirm(`Remove the assignment for ${a.registration.teamName}?`)) action(() => councilService.removeAssignment(c.id, a.id), 'Assignment removed.');
              }}>Remove Team</Button>}
            </div>
          </div>)}</div>}
        </div>
        {c.canManage && c.status === 'SCHEDULED' && <form className="flex flex-wrap gap-3" onSubmit={(e) => {
          e.preventDefault(); action(() => councilService.assignRegistration(c.id, Number(allocation[c.id])), 'Team assigned to the council.');
        }}>
          <select aria-label={`Select a team for ${c.name}`} required disabled={busy} className={`${inputClass} flex-1 min-w-48`} value={allocation[c.id] || ''}
            onChange={(e) => setAllocation({ ...allocation, [c.id]: e.target.value })}>
            <option value="">Select an approved team without a council</option>
            {registrations.filter((r) => r.canManage && r.departmentId === c.departmentId && r.periodId === c.periodId && !assigned.has(r.id))
              .map((r) => <option key={r.id} value={r.id}>{r.teamName} · {r.topicTitle}</option>)}
          </select><Button type="submit" disabled={busy || !allocation[c.id]}>Assign Team</Button>
        </form>}
      </Panel>)}
  </div>;
}

export default CouncilsPage;

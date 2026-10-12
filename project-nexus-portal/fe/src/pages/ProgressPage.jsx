import React, { useEffect, useState } from 'react';
import { progressService } from '../services/progressService';
import { useAuth } from '../context/AuthContext';
import { ModuleShell, RecordForm, Field, inputClass, buttonClass } from '../components/common/ModuleUi';

export function ProgressPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [teamId, setTeamId] = useState('');
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(null);
  const [review, setReview] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const team = teams.find(item => String(item.id) === teamId);
  useEffect(() => {
    let active = true;
    progressService.getTeams().then(items => { if (active) { setTeams(items); setTeamId(items.length ? String(items[0].id) : ''); } })
      .catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true; setTasks([]); setForm(null); setReview(null);
    if (!teamId) return () => { active = false; };
    setLoading(true); setError('');
    progressService.getTasks(teamId).then(items => { if (active) setTasks(items); }).catch(err => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [teamId]);
  async function act(action, message) {
    setBusy(true); setError(''); setSuccess('');
    try { await action(); setTasks(await progressService.getTasks(teamId)); setSuccess(message); return true; }
    catch (err) { setError(err.message); return false; } finally { setBusy(false); }
  }
  async function save(event) {
    event.preventDefault();
    const payload = { title: form.title, description: form.description || '', dueDate: form.dueDate, assigneeId: Number(form.assigneeId) };
    if (await act(() => form.id ? progressService.update(teamId, form.id, payload) : progressService.create(teamId, payload), 'Task saved.')) setForm(null);
  }
  const fields = [{ name: 'title', label: 'Task title', maxLength: 150 }, { name: 'description', label: 'Description', required: false, maxLength: 10000 },
    { name: 'dueDate', label: 'Due date', type: 'date' }, { name: 'assigneeId', label: 'Assignee', options: team?.members || [] }];
  const completed = tasks.filter(task => task.status === 'DONE').length;
  const percent = tasks.length ? Math.round(completed * 100 / tasks.length) : 0;
  return <ModuleShell title="Project Progress" description="Plan team tasks, track deadlines and receive feedback from your advisor." {...{ error, success, loading }}>
    <Field label="Team"><select className={inputClass} disabled={busy || loading} value={teamId} onChange={event => { setTeamId(event.target.value); setSuccess(''); }}>
      <option value="">Select a team</option>{teams.map(item => <option key={item.id} value={item.id}>{item.name} — {item.periodName}</option>)}</select></Field>
    {team && <>
      <div className="rounded-xl border bg-white p-5"><div className="mb-3 flex justify-between text-sm"><span>{completed}/{tasks.length} tasks completed ({percent}%)</span><span className="text-red-600">{tasks.filter(task => task.overdue).length} overdue</span></div>
        <div role="progressbar" aria-label="Completed tasks" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} className="h-2 rounded bg-slate-100"><div style={{ width: `${percent}%` }} className="h-2 rounded bg-indigo-600" /></div></div>
      {team.canManage && <button className={buttonClass} disabled={busy || loading} onClick={() => setForm({ title: '', description: '', dueDate: '', assigneeId: '' })}>Add Task</button>}
      {form && <RecordForm {...{ fields, busy }} value={form} onChange={setForm} onSubmit={save} onCancel={() => setForm(null)} editing={!!form.id} />}
      {review && <form className="space-y-3 rounded-xl border bg-white p-5" onSubmit={async event => { event.preventDefault(); if (await act(() => progressService.review(review.id, review.feedback), 'Feedback saved.')) setReview(null); }}>
        <Field label={`Advisor feedback: ${review.title}`}><textarea className={inputClass} rows={3} required maxLength={10000} value={review.feedback} onChange={event => setReview({ ...review, feedback: event.target.value })} /></Field>
        <div className="flex gap-3"><button className={buttonClass} disabled={busy}>Save feedback</button><button type="button" disabled={busy} onClick={() => setReview(null)}>Cancel</button></div></form>}
      <div className="grid gap-4 lg:grid-cols-3">{['TODO', 'IN_PROGRESS', 'DONE'].map(status => <div key={status} className="space-y-3 rounded-xl bg-slate-100 p-4">
        <h2 className="text-sm font-semibold">{status.replaceAll('_', ' ')} ({tasks.filter(task => task.status === status).length})</h2>
        {tasks.filter(task => task.status === status).map(task => <article key={task.id} className="space-y-3 rounded-lg bg-white p-4 shadow-sm">
          <h3 className="font-medium">{task.title}</h3><p className="whitespace-pre-wrap text-sm text-slate-600">{task.description}</p>
          <p className="text-xs">{task.assigneeName} · Due {task.dueDate}{task.overdue && <span className="ml-2 text-red-600">Overdue</span>}</p>
          {(team.canManage || String(task.assigneeId) === String(user?.id)) && <select aria-label={`Status for ${task.title}`} className={inputClass} value={task.status} disabled={busy || loading}
            onChange={event => act(() => progressService.updateStatus(task.id, event.target.value), 'Task status updated.')}>
            {['TODO', 'IN_PROGRESS', 'DONE'].map(value => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}</select>}
          {task.feedback && <p className="whitespace-pre-wrap rounded bg-indigo-50 p-2 text-sm">Advisor feedback: {task.feedback}</p>}
          <div className="flex flex-wrap gap-3 text-xs">{team.canManage && <><button disabled={busy} className="text-indigo-600" onClick={() => setForm({ ...task })}>Edit</button>
            <button disabled={busy} className="text-red-600" onClick={() => { if (window.confirm(`Delete ${task.title}?`)) act(() => progressService.delete(task.id), 'Task deleted.'); }}>Delete</button></>}
            {team.canReview && <button disabled={busy} className="text-indigo-600" onClick={() => setReview({ id: task.id, title: task.title, feedback: task.feedback || '' })}>Feedback</button>}</div>
        </article>)}</div>)}</div>
      {!loading && !tasks.length && <p className="text-slate-500">No tasks yet. Add a task to start tracking progress.</p>}
    </>}
    {!loading && !teams.length && <p className="text-slate-500">No teams available. Join a team or receive an advisor assignment to track project progress.</p>}
  </ModuleShell>;
}

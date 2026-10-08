import React, { useEffect, useRef, useState } from 'react';
import { subscribeNotifications } from '../services/notificationStream';
import { notificationService } from '../services/notificationService';
import { academicService } from '../services/academicService';
import { useAuth } from '../context/AuthContext';
import { ModuleShell, Field, inputClass, buttonClass } from '../components/common/ModuleUi';

export function NotificationsPage() {
  const { hasRole } = useAuth();
  const canPublish = hasRole('ROLE_ADMIN') || hasRole('ROLE_PRINCIPAL');
  const [items, setItems] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [form, setForm] = useState(null);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [connection, setConnection] = useState('reconnecting');
  const requestVersion = useRef(0);
  async function refresh() {
    const version = ++requestVersion.current;
    const notifications = await notificationService.getAll();
    if (version === requestVersion.current) setItems(notifications);
  }
  async function load() {
    setLoading(true);
    try { const [, facultyItems] = await Promise.all([refresh(), academicService.getAllFaculties()]); setFaculties(facultyItems); }
    catch (err) { setError(err.message); } finally { setLoading(false); }
  }
  useEffect(() => {
    let active = true;
    load();
    const unsubscribe = subscribeNotifications(
      () => { if (active) refresh().catch(err => { if (active) setError(err.message); }); },
      status => { if (active) setConnection(status); },
    );
    return () => { active = false; ++requestVersion.current; unsubscribe(); };
  }, []);
  async function act(action, message) {
    setBusy(true); setError(''); setSuccess('');
    try { await action(); setSuccess(message); await load(); return true; }
    catch (err) { setError(err.message); return false; } finally { setBusy(false); }
  }
  async function publish(event) {
    event.preventDefault();
    if (await act(() => notificationService.create({ ...form, facultyId: form.facultyId ? Number(form.facultyId) : null }), 'Notification published.')) setForm(null);
  }
  return <ModuleShell title="Notifications" description="Read capstone announcements for your faculty and the university." {...{ error, success, loading }}>
    <p className="text-xs text-slate-500" role="status">{connection === 'connected' ? 'Live updates connected' : connection === 'reconnecting' ? 'Connecting to live updates…' : 'Live updates disconnected'}</p>
    <div className="flex items-center justify-between"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={unreadOnly} onChange={event => setUnreadOnly(event.target.checked)} />Unread only ({items.filter(item => !item.read).length})</label>
      {canPublish && <button className={buttonClass} disabled={busy || loading} onClick={() => setForm({ title: '', content: '', facultyId: '' })}>Publish Notification</button>}</div>
    {form && <form className="space-y-4 rounded-xl border bg-white p-5" onSubmit={publish}>
      <Field label="Title"><input className={inputClass} required maxLength={150} value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} /></Field>
      <Field label="Content"><textarea className={inputClass} rows={5} required maxLength={10000} value={form.content} onChange={event => setForm({ ...form, content: event.target.value })} /></Field>
      <Field label="Audience"><select className={inputClass} value={form.facultyId} onChange={event => setForm({ ...form, facultyId: event.target.value })}>
        <option value="">All faculties</option>{faculties.map(faculty => <option key={faculty.id} value={faculty.id}>{faculty.name}</option>)}</select></Field>
      <div className="flex gap-3"><button className={buttonClass} disabled={busy}>Publish</button><button type="button" disabled={busy} onClick={() => setForm(null)}>Cancel</button></div>
    </form>}
    {items.filter(item => !unreadOnly || !item.read).map(item => <article key={item.id} className={`space-y-3 rounded-xl border bg-white p-5 ${!item.read ? 'border-l-4 border-l-indigo-500' : ''}`}>
      <div className="flex justify-between"><h2 className="font-semibold">{item.title}</h2><span className="text-xs text-slate-500">{item.read ? 'Read' : 'Unread'}</span></div>
      <p className="whitespace-pre-wrap text-sm text-slate-700">{item.content}</p>
      <p className="text-xs text-slate-500">{item.authorName} · {item.createdAt?.replace('T', ' ')} · {item.facultyId ? faculties.find(faculty => faculty.id === item.facultyId)?.name : 'All faculties'}</p>
      <div className="flex gap-4 text-sm">{!item.read && <button className="text-indigo-600" disabled={busy} onClick={() => act(() => notificationService.markRead(item.id), 'Notification marked as read.')}>Mark as read</button>}
        {canPublish && <button className="text-red-600" disabled={busy} onClick={() => { if (window.confirm(`Delete ${item.title}?`)) act(() => notificationService.delete(item.id), 'Notification deleted.'); }}>Delete</button>}</div>
    </article>)}
    {!loading && !items.some(item => !unreadOnly || !item.read) && <p className="text-slate-500">No notifications found.</p>}
  </ModuleShell>;
}

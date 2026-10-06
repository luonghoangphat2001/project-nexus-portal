import React, { useState } from 'react';
import { Button, Field, inputClass, labels } from './DefenseUi';

export function CouncilForm({ council, options, busy, onSave, onCancel }) {
  const [form, setForm] = useState(() => ({
    name: council?.name || '', departmentId: String(council?.departmentId || options.departments[0]?.id || ''),
    periodId: String(council?.periodId || options.periods[0]?.id || ''), room: council?.room || '',
    startsAt: council?.startsAt?.slice(0, 16) || '', endsAt: council?.endsAt?.slice(0, 16) || '',
    members: council ? council.members.map((m) => ({ lecturerId: String(m.lecturerId), role: m.role }))
      : ['CHAIR', 'SECRETARY', 'REVIEWER'].map((role) => ({ lecturerId: '', role })),
  }));
  const lecturers = options.lecturers.filter((l) => l.departmentIds.includes(Number(form.departmentId)));
  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const updateMember = (index, field, value) => update('members', form.members.map((m, i) => i === index ? { ...m, [field]: value } : m));

  return <form className="space-y-4" onSubmit={(e) => {
    e.preventDefault();
    onSave({ ...form, departmentId: Number(form.departmentId), periodId: Number(form.periodId),
      members: form.members.map((m) => ({ ...m, lecturerId: Number(m.lecturerId) })) });
  }}>
    <h2 className="font-semibold text-slate-800">{council ? 'Edit Council' : 'Create Defense Council'}</h2>
    <fieldset disabled={busy} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Council Name"><input required maxLength={150} className={inputClass} value={form.name} onChange={(e) => update('name', e.target.value)} /></Field>
        <Field label="Defense Room"><input required maxLength={150} className={inputClass} value={form.room} onChange={(e) => update('room', e.target.value)} /></Field>
        <Field label="Department"><select required className={inputClass} value={form.departmentId} onChange={(e) => {
          setForm({ ...form, departmentId: e.target.value, members: form.members.map((m) => ({ ...m, lecturerId: '' })) });
        }}>{options.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Field>
        <Field label="Registration Period"><select required className={inputClass} value={form.periodId} onChange={(e) => update('periodId', e.target.value)}>
          {options.periods.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select></Field>
        <Field label="Start Time (Vietnam, UTC+7)"><input type="datetime-local" required className={inputClass} value={form.startsAt} onChange={(e) => update('startsAt', e.target.value)} /></Field>
        <Field label="End Time (Vietnam, UTC+7)"><input type="datetime-local" required min={form.startsAt} className={inputClass} value={form.endsAt} onChange={(e) => update('endsAt', e.target.value)} /></Field>
      </div>
      <p className="text-xs text-slate-500">Choose at least 3 different lecturers, including exactly one chair, secretary and reviewer. Reviewers cannot assess projects they advise.</p>
      <div className="space-y-3">{form.members.map((m, index) => <div key={index} className="grid items-end gap-3 sm:grid-cols-[1fr_180px_auto]">
        <Field label={`Lecturer ${index + 1}`}><select required className={inputClass} value={m.lecturerId} onChange={(e) => updateMember(index, 'lecturerId', e.target.value)}>
          <option value="">Select a lecturer</option>{lecturers.map((l) => <option key={l.id} value={l.id}
            disabled={form.members.some((other, i) => i !== index && Number(other.lecturerId) === l.id)}>{l.fullName}</option>)}
        </select></Field>
        <Field label="Role"><select className={inputClass} value={m.role} onChange={(e) => updateMember(index, 'role', e.target.value)}>
          {['CHAIR', 'SECRETARY', 'REVIEWER', 'MEMBER'].map((role) => <option key={role} value={role}>{labels[role]}</option>)}
        </select></Field>
        <Button danger disabled={form.members.length <= 3} onClick={() => update('members', form.members.filter((_, i) => i !== index))}>Remove</Button>
      </div>)}</div>
      <Button secondary disabled={form.members.length >= 15} onClick={() => update('members', [...form.members, { lecturerId: '', role: 'MEMBER' }])}>Add Member</Button>
    </fieldset>
    <div className="flex flex-wrap gap-3"><Button type="submit" disabled={busy || !form.name.trim() || !form.room.trim()}>{busy ? 'Saving...' : 'Save Council'}</Button>
      <Button secondary disabled={busy} onClick={onCancel}>Close</Button></div>
  </form>;
}

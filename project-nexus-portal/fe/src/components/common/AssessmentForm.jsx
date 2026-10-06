import React, { useState } from 'react';
import { Button, Field, inputClass } from './DefenseUi';

export function AssessmentForm({ score, busy, onSave }) {
  const [form, setForm] = useState({ contentScore: score?.contentScore ?? '', implementationScore: score?.implementationScore ?? '',
    presentationScore: score?.presentationScore ?? '', strengths: score?.strengths || '', weaknesses: score?.weaknesses || '',
    questions: score?.questions || '', comment: score?.comment || '' });
  return <form onSubmit={(e) => { e.preventDefault(); onSave({ ...form,
    contentScore: Number(form.contentScore), implementationScore: Number(form.implementationScore), presentationScore: Number(form.presentationScore) });
  }} className="space-y-4">
    <fieldset disabled={busy} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">{[
        ['contentScore', 'Content / Theoretical Foundation'], ['implementationScore', 'Results / Implementation'], ['presentationScore', 'Documentation / Presentation'],
      ].map(([key, label]) => <Field key={key} label={`${label} (0–10)`}>
        <input type="number" min="0" max="10" step="0.01" required className={inputClass} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
      </Field>)}</div>
      <div className="grid gap-4 md:grid-cols-2">{[
        ['strengths', 'Strengths'], ['weaknesses', 'Limitations / Areas for Improvement'], ['questions', 'Review Questions'], ['comment', 'Overall Comments (required for submission)'],
      ].map(([key, label]) => <Field key={key} label={label}><textarea rows={3} maxLength={4000} className={inputClass} value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })} /></Field>)}</div>
    </fieldset>
    <p className="text-xs text-slate-500">Component scores are saved separately. Draft assessments can be edited; submitted assessments are locked.</p>
    <Button type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save Draft'}</Button>
  </form>;
}

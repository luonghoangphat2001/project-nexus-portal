import React from 'react';

export const inputClass = 'w-full rounded-lg border border-slate-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';
export const buttonClass = 'rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50';

export function ModuleShell({ title, description, error, success, loading, children }) {
  return <section className="space-y-5">
    <div><h1 className="text-2xl font-bold text-slate-800">{title}</h1><p className="mt-1 text-sm text-slate-500">{description}</p></div>
    {error && <div role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{error}</div>}
    {success && <div role="status" className="rounded-lg bg-emerald-50 p-3 text-emerald-700">{success}</div>}
    {loading && <p role="status">Loading...</p>}
    {children}
  </section>;
}

export function Field({ label, children }) {
  return <label className="block space-y-1 text-sm font-medium text-slate-700"><span>{label}</span>{children}</label>;
}

export function RecordForm({ fields, value, onChange, onSubmit, onCancel, busy, editing }) {
  return <form onSubmit={onSubmit} className="grid gap-4 rounded-xl border bg-white p-5 md:grid-cols-2">
    {fields.map(field => <Field key={field.name} label={field.label}>
      {field.options ? <select className={inputClass} required={field.required !== false} multiple={field.multiple}
        value={value[field.name] ?? (field.multiple ? [] : '')}
        onChange={event => onChange({ ...value, [field.name]: field.multiple
          ? Array.from(event.target.selectedOptions, option => Number(option.value)) : event.target.value })}>
        {!field.multiple && <option value="">Select {field.label.toLowerCase()}</option>}
        {field.options.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
      </select> : <input className={inputClass} type={field.type || 'text'} required={field.required !== false}
        maxLength={field.maxLength} min={field.min} max={field.max} pattern={field.pattern}
        value={value[field.name] ?? ''} onChange={event => onChange({ ...value, [field.name]: event.target.value })} />}
      {field.multiple && <span className="text-xs text-slate-500">Hold Ctrl or Command to select multiple entries.</span>}
    </Field>)}
    <div className="flex gap-2 md:col-span-2"><button className={buttonClass} disabled={busy}>{busy ? 'Saving...' : editing ? 'Save changes' : 'Create'}</button>
      <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={onCancel} disabled={busy}>Cancel</button></div>
  </form>;
}

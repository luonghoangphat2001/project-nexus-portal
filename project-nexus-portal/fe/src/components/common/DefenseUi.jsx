import React from 'react';
import { useTranslation } from '../../i18n/LanguageContext';

export const inputClass = 'w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100';

export const labels = {
  REPORT: 'Report', SLIDES: 'Presentation Slides', SOURCE_CODE: 'Source Code', OTHER: 'Other Documents',
  CHAIR: 'Chair', SECRETARY: 'Secretary', REVIEWER: 'Reviewer', MEMBER: 'Member',
  SCHEDULED: 'Scheduled', COMPLETED: 'Completed', CANCELLED: 'Cancelled',
  REVIEW: 'Review', DEFENSE: 'Defense Assessment', DRAFT: 'Draft', SUBMITTED: 'Submitted & Locked',
};

export const formatDate = (value) => value
  ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' })
    .format(new Date(/Z$|[+-]\d{2}:\d{2}$/.test(value) ? value : `${value}+07:00`))
  : 'Not set';

export function Banner({ error, notice }) {
  return <>
    {error && <div role="alert" className="p-4 rounded-xl text-sm text-rose-800 bg-rose-50 border border-rose-200">{error}</div>}
    {notice && <div role="status" className="p-4 rounded-xl text-sm text-emerald-800 bg-emerald-50 border border-emerald-200">{notice}</div>}
  </>;
}

export function Button({ children, secondary = false, danger = false, className = '', ...props }) {
  return <button type="button" {...props} className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${
    danger ? 'text-rose-700 bg-rose-50 hover:bg-rose-100' : secondary ? 'text-slate-700 bg-slate-100 hover:bg-slate-200' : 'text-white bg-indigo-600 hover:bg-indigo-700'
  } ${className}`}>{children}</button>;
}

export function Field({ label, children }) {
  return <label className="block space-y-1.5 text-sm font-medium text-slate-700"><span>{label}</span>{children}</label>;
}

export function Panel({ children, className = '' }) {
  return <section className={`p-5 rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</section>;
}

const labelKeyMap = {
  REPORT: 'defense.report',
  SLIDES: 'defense.slides',
  SOURCE_CODE: 'defense.sourceCode',
  OTHER: 'defense.other',
  CHAIR: 'defense.chair',
  SECRETARY: 'defense.secretary',
  REVIEWER: 'defense.reviewer',
  MEMBER: 'defense.member',
  SCHEDULED: 'defense.scheduled',
  COMPLETED: 'defense.completed',
  CANCELLED: 'defense.cancelled',
  REVIEW: 'defense.review',
  DEFENSE: 'defense.defenseAssessment',
  DRAFT: 'defense.draft',
  SUBMITTED: 'defense.submitted',
};

export {
  PageHeader,
  StatusBadge,
  Pagination,
  FilterBar,
  Modal,
  EmptyState,
} from './CommonUi';

export function Badge({ value }) {
  return <StatusBadge value={value} />;
}

export function Empty({ children }) {
  return <p className="py-6 text-sm text-center text-slate-500">{children}</p>;
}


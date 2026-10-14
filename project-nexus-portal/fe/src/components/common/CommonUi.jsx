import React from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import {
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  HelpCircle,
  Layers
} from 'lucide-react';

export const inputClass =
  'w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 transition-all';

export const selectClass =
  'w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 bg-slate-50 hover:bg-slate-100/80 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all';

export const buttonClass =
  'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed';

/**
 * Standard Page Header with Title, Description, and Actions
 */
export function PageHeader({ title, description, actions, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{title}</h1>
        {description && <p className="text-sm text-slate-500 leading-relaxed">{description}</p>}
      </div>
      {(actions || children) && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {actions}
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * StatusBadge - Inherits localization and color semantics automatically
 */
export function StatusBadge({ value, type = 'status', className = '' }) {
  const { t } = useTranslation();
  if (!value) return null;

  const upper = String(value).toUpperCase();

  // 1. Resolve translated text
  let label = value;
  if (type === 'topicType') {
    label = t(`enums.topicType.${upper}`) || value.replace('_', ' ');
  } else if (type === 'postType') {
    label = t(`enums.postType.${upper}`) || value.replace(/_/g, ' ');
  } else if (type === 'docType') {
    label = t(`enums.docType.${upper}`) || t(`defense.${value.toLowerCase()}`) || value;
  } else if (type === 'councilRole') {
    label = t(`enums.councilRole.${upper}`) || t(`defense.${value.toLowerCase()}`) || value;
  } else if (type === 'role') {
    label = t(`roles.${value}`) || value.replace('ROLE_', '');
  } else {
    // Default: status enum
    label = t(`enums.status.${upper}`) || t(`defense.${value.toLowerCase()}`) || value;
  }

  // 2. Resolve color theme based on semantic meaning
  let colorStyle = 'bg-slate-100 text-slate-700 border-slate-200'; // Neutral fallback

  // Green / Positive
  if (['OPEN', 'APPROVED', 'ACTIVE', 'DONE', 'COMPLETED', 'SUCCESS', 'SUBMITTED', 'ACCEPTED', 'PASSED'].includes(upper)) {
    colorStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
  }
  // Amber / Yellow / Pending
  else if (['PENDING', 'IN_PROGRESS', 'TODO', 'DRAFT', 'SCHEDULED', 'REVIEW', 'DEFENSE'].includes(upper)) {
    colorStyle = 'bg-amber-50 text-amber-700 border-amber-200/80';
  }
  // Red / Danger
  else if (['REJECTED', 'CLOSED', 'LOCKED', 'FAILURE', 'DENIED', 'CANCELLED', 'OVERDUE', 'FAILED', 'INACTIVE'].includes(upper)) {
    colorStyle = 'bg-rose-50 text-rose-700 border-rose-200/80';
  }
  // Indigo / Purple / Special
  else if (['CAPSTONE', 'RESEARCH', 'THESIS', 'ROLE_ADMIN', 'ROLE_PRINCIPAL', 'ROLE_TEACHER', 'PRIMARY'].includes(upper)) {
    colorStyle = 'bg-indigo-50 text-indigo-700 border-indigo-200/80';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorStyle} ${className}`}
    >
      {label}
    </span>
  );
}

/**
 * Standard Pagination Component with localization
 */
export function Pagination({ page, totalPages, onPageChange, className = '' }) {
  const { t } = useTranslation();

  if (totalPages <= 1) return null;

  return (
    <div className={`flex justify-center items-center space-x-2 pt-4 ${className}`}>
      <button
        type="button"
        disabled={page <= 0}
        onClick={() => onPageChange(page - 1)}
        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center space-x-1"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        <span>{t('common.previous')}</span>
      </button>

      <span className="text-xs text-slate-500 font-medium px-2">
        {t('common.pageOf', { current: page + 1, total: totalPages })}
      </span>

      <button
        type="button"
        disabled={page >= totalPages - 1}
        onClick={() => onPageChange(page + 1)}
        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center space-x-1"
      >
        <span>{t('common.next')}</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/**
 * Standard Filter Bar container
 */
export function FilterBar({ children, onSearch, onReset, className = '' }) {
  const { t } = useTranslation();

  return (
    <div className={`bg-white p-4 rounded-2xl border border-slate-200 shadow-xs ${className}`}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (onSearch) onSearch();
        }}
        className="flex flex-wrap items-center gap-3"
      >
        <div className="flex-1 min-w-[240px] flex flex-wrap items-center gap-3">{children}</div>

        <div className="flex items-center space-x-2 shrink-0">
          {onSearch && (
            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-medium transition-colors"
            >
              {t('common.filter')}
            </button>
          )}
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-medium transition-colors"
              title={t('common.reset')}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

/**
 * Standard Modal Dialog Component
 */
export function Modal({ isOpen, onClose, title, children, footer, maxWidth = 'max-w-xl' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div
        className={`bg-white w-full ${maxWidth} rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-base">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4">{children}</div>

        {/* Footer */}
        {footer && <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end gap-2.5">{footer}</div>}
      </div>
    </div>
  );
}

/**
 * Empty State Display
 */
export function EmptyState({ message, icon: Icon = HelpCircle, action }) {
  const { t } = useTranslation();
  return (
    <div className="py-12 bg-white rounded-2xl border border-slate-200 text-center px-4">
      <Icon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
      <p className="text-slate-500 font-medium text-sm">{message || t('common.noData')}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/**
 * Notification / Alert Banner
 */
export function Banner({ error, success, notice }) {
  const msg = error || success || notice;
  if (!msg) return null;

  const isError = !!error;
  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`p-4 rounded-xl text-sm flex items-start space-x-2.5 border ${
        isError
          ? 'bg-rose-50 text-rose-800 border-rose-200'
          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
      }`}
    >
      {isError ? (
        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
      ) : (
        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
      )}
      <span className="flex-1 leading-relaxed">{msg}</span>
    </div>
  );
}

export default {
  PageHeader,
  StatusBadge,
  Pagination,
  FilterBar,
  Modal,
  EmptyState,
  Banner,
  inputClass,
  selectClass,
  buttonClass,
};

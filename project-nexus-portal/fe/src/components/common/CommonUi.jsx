import React, { useState } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import {
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  X,
  AlertCircle,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';

export const inputClass =
  'w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-400 transition-all';

export const selectClass =
  'w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer';

export const buttonClass = {
  primary:
    'inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
  secondary:
    'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
  danger:
    'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
  actionRow:
    'inline-flex items-center justify-center gap-1 p-1.5 rounded-lg text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer',
  actionRowDanger:
    'inline-flex items-center justify-center gap-1 p-1.5 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all cursor-pointer',
};

/**
 * Standard Page Header Matching the Reference Design (Title 24px + Subtitle 14px + Action Button)
 */
export function PageHeader({ title, description, action, actions, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-1">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">{description}</p>
        )}
      </div>
      {(action || actions || children) && (
        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
          {action}
          {actions}
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Clean Enterprise Filter Card matching Image 1 & Image 3:
 * - Collapsible filter header with funnel icon + "Filters" + "Reset Filter" button
 * - Clean grid layout for filter fields with labels on top (14px)
 */
export function FilterCard({
  children,
  onReset,
  onSearch,
  title,
  defaultExpanded = true,
  className = '',
}) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs transition-all ${className}`}>
      {/* Filter Header */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-sm font-bold text-slate-800">
            <Filter className="w-4 h-4 text-slate-600" />
            <span>{title || t('common.filter') || 'Filters'}</span>
          </div>

          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>{t('common.reset') || 'Reset Filter'}</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          title={isExpanded ? 'Collapse filters' : 'Expand filters'}
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Filter Body (Inputs & Selects) */}
      {isExpanded && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (onSearch) onSearch();
          }}
          className="pt-3 border-t border-slate-100 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {children}
          </div>

          {onSearch && (
            <div className="flex justify-end pt-2">
              <button type="submit" className={buttonClass.primary}>
                {t('common.filter') || 'Search'}
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}

// Backwards compatibility alias
export const FilterBar = FilterCard;

/**
 * FilterField: Standardized field container for FilterCard with consistent 14px label
 */
export function FilterField({ label, children, className = '' }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-slate-700 tracking-tight">
          {label}
        </label>
      )}
      {children}
    </div>
  );
}

/**
 * StatusBadge - Clean, soft enterprise badges matching the design images
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
    label = t(`enums.role.${value}`) || t(`roles.${value}`) || value.replace('ROLE_', '');
  } else {
    label = t(`enums.status.${upper}`) || t(`defense.${value.toLowerCase()}`) || value;
  }

  // 2. Soft, clean Enterprise color styles
  let colorStyle = 'bg-slate-50 text-slate-600 border-slate-200'; // Default tag/pill

  // Positive / Paid / Active / Done
  if (
    ['PAID', 'OPEN', 'APPROVED', 'ACTIVE', 'DONE', 'COMPLETED', 'SUCCESS', 'SUBMITTED', 'ACCEPTED', 'PASSED'].includes(
      upper
    )
  ) {
    colorStyle = 'bg-emerald-50 text-emerald-600 border-emerald-100';
  }
  // Warning / Pending / Reviewing
  else if (
    ['PENDING', 'IN_PROGRESS', 'TODO', 'DRAFT', 'SCHEDULED', 'REVIEW', 'DEFENSE', 'CARD'].includes(
      upper
    )
  ) {
    colorStyle = 'bg-amber-50 text-amber-700 border-amber-200/80';
  }
  // Danger / Failed / Inactive
  else if (
    ['REJECTED', 'CLOSED', 'LOCKED', 'FAILURE', 'DENIED', 'CANCELLED', 'OVERDUE', 'FAILED', 'INACTIVE'].includes(
      upper
    )
  ) {
    colorStyle = 'bg-rose-50 text-rose-600 border-rose-100';
  }
  // Primary / Info / Admin
  else if (
    ['CAPSTONE', 'RESEARCH', 'THESIS', 'ROLE_ADMIN', 'ROLE_PRINCIPAL', 'ROLE_TEACHER', 'PRIMARY'].includes(
      upper
    )
  ) {
    colorStyle = 'bg-blue-50 text-blue-600 border-blue-100';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${colorStyle} ${className}`}
    >
      {label}
    </span>
  );
}

/**
 * MetricCard - Matches the Top KPI Summary Row from Image 2:
 * Label, Large bold number, Colored icon square in top right, Subtitle with trend
 */
export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg = 'bg-blue-600',
  trend,
  trendColor = 'text-emerald-600',
  className = '',
}) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-2 tracking-tight font-mono">
            {value}
          </p>
        </div>
        {Icon && (
          <div
            className={`w-9 h-9 rounded-xl ${iconBg} text-white flex items-center justify-center shrink-0 shadow-xs`}
          >
            <Icon className="w-4.5 h-4.5" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-400">{subtitle}</span>
          {trend && <span className={`font-semibold ${trendColor}`}>{trend}</span>}
        </div>
      )}
    </div>
  );
}

/**
 * TableCard: Card container for clean tables matching Image 1 & Image 3
 */
export function TableCard({ children, className = '' }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * TableHeaderBar: Header bar for tables matching Image 3 (e.g., "All Orders (367)" with actions)
 */
export function TableHeaderBar({ title, count, subtitle, actions, children }) {
  return (
    <div className="p-4 sm:px-6 sm:py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-center space-x-2">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>
        {typeof count !== 'undefined' && count !== null && (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
            {count}
          </span>
        )}
        {subtitle && <span className="text-sm text-slate-400">· {subtitle}</span>}
      </div>
      {(actions || children) && (
        <div className="flex items-center space-x-2 shrink-0">
          {actions}
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Standard Pagination matching the enterprise design (Image 1 & Image 3)
 * Supports page numbers, entries count: "Showing 1 to 10 of 367 entries"
 */
export function Pagination({
  currentPage,
  page,
  totalPages,
  totalElements,
  pageSize = 10,
  onPageChange,
  className = '',
}) {
  const { t, language } = useTranslation();
  const current = typeof currentPage === 'number' ? currentPage : typeof page === 'number' ? page : 0;

  if (!totalPages || totalPages <= 1) return null;

  const startEntry = current * pageSize + 1;
  const endEntry = typeof totalElements === 'number' ? Math.min((current + 1) * pageSize, totalElements) : (current + 1) * pageSize;

  // Generate page numbers array (showing max 5 numbered buttons)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(0, current - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible);
    if (end - start < maxVisible) {
      start = Math.max(0, end - maxVisible);
    }
    for (let i = start; i < end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className={`p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-600 ${className}`}>
      <div>
        {typeof totalElements === 'number' ? (
          language === 'vi' ? (
            <span>Hiển thị <strong className="font-semibold text-slate-900">{startEntry}</strong> đến <strong className="font-semibold text-slate-900">{endEntry}</strong> trong tổng số <strong className="font-semibold text-slate-900">{totalElements}</strong> mục</span>
          ) : (
            <span>Showing <strong className="font-semibold text-slate-900">{startEntry}</strong> to <strong className="font-semibold text-slate-900">{endEntry}</strong> of <strong className="font-semibold text-slate-900">{totalElements}</strong> entries</span>
          )
        ) : (
          <span>{t('common.pageOf', { current: current + 1, total: totalPages })}</span>
        )}
      </div>

      <div className="flex items-center space-x-1.5">
        <button
          type="button"
          disabled={current <= 0}
          onClick={() => onPageChange(current - 1)}
          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">{t('common.previous') || 'Previous'}</span>
        </button>

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center justify-center ${
              p === current
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {p + 1}
          </button>
        ))}

        <button
          type="button"
          disabled={current >= totalPages - 1}
          onClick={() => onPageChange(current + 1)}
          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <span className="hidden sm:inline">{t('common.next') || 'Next'}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
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
          <h3 className="font-bold text-slate-900 text-base">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Empty State Display
 */
export function EmptyState({ message, title, description, icon: Icon = HelpCircle, action }) {
  const { t } = useTranslation();
  return (
    <div className="py-12 bg-white rounded-2xl border border-slate-200/80 text-center px-4">
      <Icon className="w-10 h-10 text-slate-300 mx-auto mb-2.5" />
      <h3 className="text-slate-700 font-semibold text-sm">
        {title || message || t('common.noData')}
      </h3>
      {description && <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">{description}</p>}
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
      className={`p-3.5 rounded-xl text-xs flex items-start space-x-2.5 border ${
        isError
          ? 'bg-rose-50 text-rose-800 border-rose-200'
          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
      }`}
    >
      {isError ? (
        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
      ) : (
        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
      )}
      <span className="flex-1 leading-relaxed font-medium">{msg}</span>
    </div>
  );
}

export default {
  PageHeader,
  FilterCard,
  FilterBar,
  FilterField,
  TableCard,
  StatusBadge,
  MetricCard,
  Pagination,
  Modal,
  EmptyState,
  Banner,
  inputClass,
  selectClass,
  buttonClass,
};

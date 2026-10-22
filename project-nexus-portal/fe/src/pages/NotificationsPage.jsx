import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  Plus,
  RefreshCw,
  CheckCircle,
  Trash2,
  Filter,
  Radio,
  Building,
  Calendar,
  User,
  Search,
  CheckCheck,
} from 'lucide-react';
import { subscribeNotifications } from '../services/notificationStream';
import { notificationService, localizeNotification } from '../services/notificationService';
import { academicService } from '../services/academicService';
import { formatDateTime } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import {
  PageHeader,
  FilterCard,
  FilterField,
  TableCard,
  Modal,
  EmptyState,
  buttonClass,
  inputClass,
  selectClass,
} from '../components/common/CommonUi';

export function NotificationsPage() {
  const { user, hasRole } = useAuth();
  const { t, language } = useTranslation();
  const canPublish = hasRole('ROLE_ADMIN') || hasRole('ROLE_PRINCIPAL');

  const [items, setItems] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [form, setForm] = useState(null);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [facultyFilter, setFacultyFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [connection, setConnection] = useState('reconnecting');
  const requestVersion = useRef(0);

  async function refresh() {
    const version = ++requestVersion.current;
    try {
      const notifications = await notificationService.getAll();
      if (version === requestVersion.current) {
        setItems(Array.isArray(notifications) ? notifications : []);
      }
    } catch (err) {
      if (version === requestVersion.current) {
        setError(err.message || t('common.error'));
      }
    }
  }

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [, facultyItems] = await Promise.all([
        refresh(),
        academicService.getAllFaculties().catch(() => []),
      ]);
      setFaculties(Array.isArray(facultyItems) ? facultyItems : []);
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    load();
    const unsubscribe = subscribeNotifications(
      () => {
        if (active) {
          refresh().catch((err) => {
            if (active) setError(err.message || t('common.error'));
          });
        }
      },
      (status) => {
        if (active) setConnection(status);
      }
    );
    return () => {
      active = false;
      ++requestVersion.current;
      unsubscribe();
    };
  }, []);

  async function act(action) {
    setBusy(true);
    setError('');
    try {
      await action();
      await refresh();
      return true;
    } catch (err) {
      setError(err.message || t('common.error'));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function publish(event) {
    event.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;

    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      facultyId: form.facultyId ? Number(form.facultyId) : null,
    };

    if (await act(() => notificationService.create(payload))) {
      setForm(null);
    }
  }

  // Filter notifications
  const filteredItems = items.filter((item) => {
    if (unreadOnly && item.read) return false;
    if (facultyFilter && String(item.facultyId) !== String(facultyFilter)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchContent = item.content?.toLowerCase().includes(q);
      const matchAuthor = item.authorName?.toLowerCase().includes(q);
      if (!matchTitle && !matchContent && !matchAuthor) return false;
    }
    return true;
  });

  const unreadCount = items.filter((item) => !item.read).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <PageHeader
        title={t('notifications.title')}
        description={t('notifications.subtitle')}
        actions={
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={busy || loading}
              onClick={() => {
                load();
              }}
              className={buttonClass.secondary}
            >
              <RefreshCw className={`w-4 h-4 ${busy || loading ? 'animate-spin' : ''}`} />
              <span>{t('common.refresh')}</span>
            </button>

            {canPublish && (
              <button
                type="button"
                disabled={busy}
                onClick={() => setForm({ title: '', content: '', facultyId: '' })}
                className={buttonClass.primary}
              >
                <Plus className="w-4 h-4" />
                <span>{t('notifications.publishNotification')}</span>
              </button>
            )}
          </div>
        }
      />

      {/* Live Stream Status & Banners */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2 text-xs">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              connection === 'connected'
                ? 'bg-emerald-500 animate-pulse'
                : connection === 'reconnecting'
                ? 'bg-amber-500 animate-pulse'
                : 'bg-rose-500'
            }`}
          />
          <span className="font-medium text-slate-500">
            {connection === 'connected'
              ? t('notifications.liveConnected')
              : connection === 'reconnecting'
              ? t('notifications.liveReconnecting')
              : t('notifications.liveDisconnected')}
          </span>
        </div>
      </div>

      {/* Filter Card */}
      <FilterCard
        title={t('common.filter')}
        onReset={() => {
          setUnreadOnly(false);
          setFacultyFilter('');
          setSearchQuery('');
        }}
      >
        <FilterField label={t('common.search')}>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder={t('common.search') + '...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${inputClass} pl-9`}
            />
          </div>
        </FilterField>

        <FilterField label={t('notifications.audience')}>
          <select
            value={facultyFilter}
            onChange={(e) => setFacultyFilter(e.target.value)}
            className={selectClass}
          >
            <option value="">{t('notifications.allFaculties')}</option>
            {faculties.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label={t('common.status')}>
          <div className="pt-2">
            <label className="inline-flex items-center space-x-2 text-sm text-slate-700 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(e) => setUnreadOnly(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
              />
              <span>{t('notifications.unreadOnly', { count: unreadCount })}</span>
            </label>
          </div>
        </FilterField>
      </FilterCard>

      {/* Notifications List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
          <span>{t('common.loading')}</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={t('notifications.noNotifications')}
          description={
            unreadOnly
              ? t('notifications.allRead', 'Tất cả thông báo đã được đọc.')
              : t('notifications.noMatching', 'Không có thông báo nào phù hợp với bộ lọc.')
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const facultyObj = faculties.find((f) => f.id === item.facultyId);
            const audienceText = item.recipientId
              ? t('notifications.personal', 'Cá nhân')
              : (facultyObj ? facultyObj.name : t('notifications.allFaculties'));

            return (
              <article
                key={item.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs transition-all ${
                  !item.read
                    ? 'border-blue-200 bg-gradient-to-r from-blue-50/30 to-transparent ring-1 ring-blue-100'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        !item.read ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Bell className="w-4.5 h-4.5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-bold text-slate-900 tracking-tight">
                          {localizeNotification(item.title, language)}
                        </h2>
                        {item.content?.includes('[VI]') && item.content?.includes('[EN]') && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                            VI / EN
                          </span>
                        )}
                        {!item.read && (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 text-blue-700">
                            {t('notifications.unread')}
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {localizeNotification(item.content, language)}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {item.authorName || 'Administrator'}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatDateTime(item.createdAt)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          {audienceText}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 shrink-0 self-end sm:self-start pt-2 sm:pt-0">
                    {!item.read && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          act(() => notificationService.markRead(item.id))
                        }
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
                        title={t('notifications.markAsRead')}
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>{t('notifications.markAsRead')}</span>
                      </button>
                    )}

                    {(canPublish || (user && item.recipientId && String(item.recipientId) === String(user.id))) && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          if (window.confirm(t('notifications.deleteConfirm'))) {
                            act(() => notificationService.delete(item.id));
                          }
                        }}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
                        title={t('notifications.delete')}
                        aria-label={t('notifications.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Publish Notification Modal */}
      <Modal
        isOpen={!!form}
        onClose={() => setForm(null)}
        title={t('notifications.publishNotification')}
        footer={
          <div className="flex items-center justify-end space-x-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => setForm(null)}
              className={buttonClass.secondary}
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={publish}
              className={buttonClass.primary}
            >
              {t('common.submit')}
            </button>
          </div>
        }
      >
        {form && (
          <form onSubmit={publish} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                {t('notifications.formTitle')} *
              </label>
              <input
                type="text"
                required
                maxLength={150}
                placeholder={t('notifications.formTitlePlaceholder')}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                {t('notifications.formContent')} *
              </label>
              <textarea
                required
                rows={5}
                maxLength={10000}
                placeholder={t('notifications.formContentPlaceholder')}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                {t('notifications.audience')}
              </label>
              <select
                value={form.facultyId}
                onChange={(e) => setForm({ ...form, facultyId: e.target.value })}
                className={selectClass}
              >
                <option value="">{t('notifications.allFaculties')}</option>
                {faculties.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default NotificationsPage;

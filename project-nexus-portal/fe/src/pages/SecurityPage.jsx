import React, { useEffect, useState } from 'react';
import { auditLogService } from '../services/auditLogService';
import { userService } from '../services/userService';
import { emailService } from '../services/emailService';
import { useTranslation } from '../i18n/LanguageContext';
import { formatDateTimeFull } from '../utils/dateUtils';
import {
  ShieldAlert,
  ShieldCheck,
  Download,
  Search,
  RefreshCw,
  Activity,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  Mail,
  Send,
  Trash2,
} from 'lucide-react';
import {
  PageHeader,
  MetricCard,
  FilterCard,
  FilterField,
  TableCard,
  TableHeaderBar,
  StatusBadge,
  Pagination,
  buttonClass,
  inputClass,
  selectClass,
} from '../components/common/CommonUi';

export const SecurityPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('audit'); // 'audit' | 'email'

  // Audit Logs State
  const [logs, setLogs] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const [size] = useState(20);

  // Filters
  const [usernameFilter, setUsernameFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [distinctActions, setDistinctActions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [notification, setNotification] = useState('');
  const [error, setError] = useState('');

  // Email & SMTP Status
  const [emailStatus, setEmailStatus] = useState(null);
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailMsg, setTestEmailMsg] = useState('');

  // Email Logs State
  const [emailLogs, setEmailLogs] = useState([]);
  const [emailTotalElements, setEmailTotalElements] = useState(0);
  const [emailTotalPages, setEmailTotalPages] = useState(1);
  const [emailPage, setEmailPage] = useState(0);
  const [emailSearch, setEmailSearch] = useState('');
  const [emailStatusFilter, setEmailStatusFilter] = useState('ALL');
  const [emailLoading, setEmailLoading] = useState(false);
  const [clearingEmailLogs, setClearingEmailLogs] = useState(false);

  const fetchEmailStatus = async () => {
    try {
      const res = await emailService.getEmailStatus();
      if (res && res.data) {
        setEmailStatus(res.data);
      }
    } catch (_) {}
  };

  const fetchEmailLogs = async (targetPage = emailPage) => {
    setEmailLoading(true);
    try {
      const res = await emailService.getEmailLogs({
        page: targetPage,
        size: 20,
        search: emailSearch ? emailSearch.trim() : undefined,
        status: emailStatusFilter !== 'ALL' ? emailStatusFilter : undefined,
      });
      if (res && res.data) {
        setEmailLogs(res.data.content || []);
        setEmailTotalElements(res.data.totalElements || 0);
        setEmailTotalPages(res.data.totalPages || 1);
        setEmailPage(targetPage);
      }
    } catch (err) {
      console.error('Error fetching email logs', err);
    } finally {
      setEmailLoading(false);
    }
  };

  const handleClearEmailLogs = async () => {
    if (!window.confirm(t('security.clearEmailLogsConfirm'))) return;
    setClearingEmailLogs(true);
    try {
      await emailService.clearEmailLogs();
      showToast(t('security.clearEmailLogsSuccess'));
      fetchEmailLogs(0);
    } catch (err) {
      setError(err.message || 'Lỗi xóa nhật ký email');
    } finally {
      setClearingEmailLogs(false);
    }
  };

  const handleSendTestEmail = async (e) => {
    e.preventDefault();
    if (!testEmailRecipient) return;
    setSendingTestEmail(true);
    setTestEmailMsg('');
    try {
      const res = await emailService.sendTestEmail(testEmailRecipient);
      setTestEmailMsg(res.message || 'Email thử nghiệm đã được xử lý!');
      showToast('Đã gửi yêu cầu gửi email thử nghiệm thành công.');
      fetchEmailLogs(0);
    } catch (err) {
      setTestEmailMsg(err.message || 'Lỗi gửi email.');
    } finally {
      setSendingTestEmail(false);
    }
  };

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const fetchActions = async () => {
    try {
      const res = await auditLogService.getDistinctActions();
      if (res && res.data) {
        setDistinctActions(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.error('Error fetching distinct actions', err);
    }
  };

  const fetchLogs = async (targetPage = page) => {
    setLoading(true);
    setError('');
    try {
      const res = await auditLogService.getAuditLogs({
        page: targetPage,
        size,
        username: usernameFilter,
        action: actionFilter,
        status: statusFilter,
      });

      if (res && res.data) {
        setLogs(res.data.content || []);
        setTotalElements(res.data.totalElements || 0);
        setTotalPages(res.data.totalPages || 1);
        setPage(targetPage);
      }
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
    fetchLogs(0);
    fetchEmailStatus();
  }, [actionFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs(0);
  };

  const handleExportAuditLogs = async () => {
    setExportLoading(true);
    try {
      await auditLogService.exportAuditLogs({
        username: usernameFilter,
        action: actionFilter,
        status: statusFilter,
      });
      showToast(t('security.exportAuditSuccess'));
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportUsers = async () => {
    try {
      await userService.exportUsers();
      showToast(t('security.exportUsersSuccess'));
    } catch (err) {
      setError(err.message || t('common.error'));
    }
  };

  const getActionBadge = (action) => {
    if (!action) return null;
    if (action.includes('LOGIN_SUCCESS')) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">LOGIN SUCCESS</span>;
    }
    if (action.includes('LOGIN_FAILED')) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">LOGIN FAILED</span>;
    }
    if (action.includes('PASSWORD')) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">PASSWORD</span>;
    }
    if (action.includes('CREATE')) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">CREATE</span>;
    }
    if (action.includes('DELETE')) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">DELETE</span>;
    }
    if (action.includes('STATUS')) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">STATUS</span>;
    }
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 font-mono">{action}</span>;
  };

  const failedLogins = logs.filter((l) => l.action === 'AUTH_LOGIN_FAILED' || l.status === 'FAILED').length;
  const successLogins = logs.filter((l) => l.action === 'AUTH_LOGIN_SUCCESS').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <PageHeader
        title={t('security.title')}
        description={t('security.subtitle')}
        actions={
          <>
            <button
              onClick={() => fetchLogs(page)}
              className={buttonClass.secondary}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{t('security.refresh')}</span>
            </button>

            <button
              onClick={handleExportUsers}
              className={buttonClass.secondary}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>{t('security.exportUsersCsv')}</span>
            </button>

            <button
              onClick={handleExportAuditLogs}
              disabled={exportLoading}
              className={buttonClass.primary}
            >
              <Download className="w-4 h-4" />
              <span>{exportLoading ? t('security.exporting') : t('security.exportAuditCsv')}</span>
            </button>
          </>
        }
      />

      {/* Notifications */}
      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl flex items-center gap-2">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title={t('security.totalEvents')}
          value={totalElements}
          icon={Activity}
          iconBg="bg-blue-600"
          subtitle={t('security.subtitle')}
        />

        <MetricCard
          title={t('security.successfulLogins')}
          value={successLogins}
          icon={ShieldCheck}
          iconBg="bg-emerald-600"
          subtitle={t('security.authPass', 'Authentication pass')}
        />

        <MetricCard
          title={t('security.securityWarnings')}
          value={failedLogins}
          icon={ShieldAlert}
          iconBg="bg-rose-600"
          subtitle={t('security.attentionNeeded', 'Attention needed')}
        />
      </div>

      {/* SMTP & Email Notification Service Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Hệ Thống Gửi Email Tự Động (SMTP Mail Service)</h3>
              <p className="text-xs text-slate-500">
                Tự động gửi email thông báo khi: Xin gia nhập nhóm, Đăng ký đề tài, Phê duyệt đề tài, Nộp báo cáo tiến độ và Chấm điểm.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                emailStatus?.configured
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {emailStatus?.configured ? 'SMTP Đã Cấu Hình' : 'Chế độ Giả lập / Mock Mode'}
            </span>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                emailStatus?.enabled
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {emailStatus?.enabled ? 'Đang Bật' : 'Đang Tắt'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/60">
          <div>
            <span className="text-slate-400 block mb-0.5">Máy chủ SMTP:</span>
            <span className="font-mono font-semibold text-slate-700">{emailStatus?.host || 'smtp.gmail.com'}:{emailStatus?.port || 587}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Địa chỉ gửi:</span>
            <span className="font-mono font-semibold text-slate-700">{emailStatus?.sender || 'lhphat.work@gmail.com'}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Trạng thái phát thông báo:</span>
            <span className="font-semibold text-slate-700">Tích hợp SSE In-app & Email Mime HTML</span>
          </div>
        </div>

        {/* Test Email Form */}
        <form onSubmit={handleSendTestEmail} className="flex flex-wrap items-center gap-2.5 pt-1">
          <div className="relative flex-1 min-w-[240px]">
            <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="email"
              required
              placeholder="Nhập email người nhận để gửi thử nghiệm..."
              value={testEmailRecipient}
              onChange={(e) => setTestEmailRecipient(e.target.value)}
              className={`${inputClass} pl-8.5`}
            />
          </div>
          <button
            type="submit"
            disabled={sendingTestEmail || !testEmailRecipient}
            className={buttonClass.primary}
          >
            <Send className="w-3.5 h-3.5" />
            <span>{sendingTestEmail ? 'Đang gửi...' : 'Gửi Email Thử'}</span>
          </button>
        </form>

        {testEmailMsg && (
          <div className="text-xs p-2.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
            {testEmailMsg}
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <span>{t('security.emailLogsSubtitle')}</span>
          <button
            type="button"
            onClick={() => {
              setActiveTab('email');
              fetchEmailLogs(0);
            }}
            className="font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>{t('security.tabEmailLogs')} ({emailTotalElements}) &rarr;</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'audit'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>{t('security.tabAuditLogs')}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-normal">
            {totalElements}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('email');
            fetchEmailLogs(0);
          }}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'email'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>{t('security.tabEmailLogs')}</span>
          {emailTotalElements > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
              {emailTotalElements}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'email' ? (
        <>
          {/* Email Logs Filter Card */}
          <FilterCard
            onReset={() => {
              setEmailSearch('');
              setEmailStatusFilter('ALL');
            }}
            onSearch={() => fetchEmailLogs(0)}
          >
            <FilterField label={t('common.search')}>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder={t('security.searchEmailPlaceholder')}
                  value={emailSearch}
                  onChange={(e) => setEmailSearch(e.target.value)}
                  className={`${inputClass} pl-9`}
                />
              </div>
            </FilterField>

            <FilterField label={t('security.colStatus')}>
              <select
                value={emailStatusFilter}
                onChange={(e) => setEmailStatusFilter(e.target.value)}
                className={selectClass}
              >
                <option value="ALL">{t('security.allStatuses')}</option>
                <option value="SENT">SENT (Đã gửi)</option>
                <option value="MOCK">MOCK (Giả lập)</option>
                <option value="FAILED">FAILED (Thất bại)</option>
              </select>
            </FilterField>
          </FilterCard>

          {/* Email Logs Table Card */}
          <TableCard>
            <TableHeaderBar
              title={t('security.emailLogsTitle')}
              count={emailTotalElements}
              subtitle={t('security.emailLogsSubtitle')}
              actions={
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchEmailLogs(emailPage)}
                    className={buttonClass.secondary}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${emailLoading ? 'animate-spin' : ''}`} />
                    <span>{t('security.refresh')}</span>
                  </button>
                  {emailTotalElements > 0 && (
                    <button
                      onClick={handleClearEmailLogs}
                      disabled={clearingEmailLogs}
                      className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{clearingEmailLogs ? t('common.loading') : t('security.clearEmailLogs')}</span>
                    </button>
                  )}
                </div>
              }
            />

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 font-semibold text-slate-600">
                    <th className="py-3.5 px-4">{t('security.colTimestamp')}</th>
                    <th className="py-3.5 px-4">{t('security.colEmailRecipient')}</th>
                    <th className="py-3.5 px-4">{t('security.colEmailSubject')}</th>
                    <th className="py-3.5 px-4">{t('security.colEmailTemplate')}</th>
                    <th className="py-3.5 px-4">{t('security.colEmailSender')}</th>
                    <th className="py-3.5 px-4 text-center">{t('security.colStatus')}</th>
                    <th className="py-3.5 px-4">{t('security.colEmailError')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {emailLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                        <span>{t('common.loading')}</span>
                      </td>
                    </tr>
                  ) : emailLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        {t('security.noEmailLogs')}
                      </td>
                    </tr>
                  ) : (
                    emailLogs.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono text-xs">
                          {formatDateTimeFull(item.createdAt)}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{item.recipientName || '—'}</div>
                          <div className="font-mono text-xs text-slate-500">{item.recipient}</div>
                        </td>

                        <td className="py-3.5 px-4 font-medium text-slate-800 max-w-xs truncate" title={item.subject}>
                          {item.subject}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 text-slate-700 border border-slate-200">
                            {item.templateName || 'plain-text'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-xs text-slate-500 truncate max-w-[150px]" title={item.sender}>
                          {item.sender || '—'}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                              item.status === 'SENT'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : item.status === 'MOCK'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-xs max-w-xs truncate" title={item.errorMessage || ''}>
                          {item.errorMessage ? (
                            <span className="text-rose-600 font-mono">{item.errorMessage}</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={emailPage}
              totalPages={emailTotalPages}
              totalElements={emailTotalElements}
              pageSize={20}
              onPageChange={(p) => fetchEmailLogs(p)}
            />
          </TableCard>
        </>
      ) : (
        <>
          {/* Filter Card */}
          <FilterCard
            onReset={() => {
              setUsernameFilter('');
              setActionFilter('ALL');
              setStatusFilter('ALL');
            }}
            onSearch={() => fetchLogs(0)}
          >
            <FilterField label={t('common.search') || 'Actor'}>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder={t('security.searchActorPlaceholder')}
                  value={usernameFilter}
                  onChange={(e) => setUsernameFilter(e.target.value)}
                  className={`${inputClass} pl-9`}
                />
              </div>
            </FilterField>

            <FilterField label={t('security.colAction') || 'Action'}>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className={selectClass}
              >
                <option value="ALL">{t('security.allActions')}</option>
                {distinctActions.map((act) => (
                  <option key={act} value={act}>{act}</option>
                ))}
              </select>
            </FilterField>

            <FilterField label={t('security.colStatus') || 'Status'}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={selectClass}
              >
                <option value="ALL">{t('security.allStatuses')}</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="FAILED">FAILED</option>
              </select>
            </FilterField>
          </FilterCard>

          {/* Audit Logs Table Card */}
          <TableCard>
            <TableHeaderBar
              title={t('security.title')}
              count={totalElements}
              subtitle={t('security.subtitle')}
            />

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm min-w-[650px]">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 font-semibold text-slate-600">
                    <th className="py-3.5 px-4">{t('security.colTimestamp')}</th>
                    <th className="py-3.5 px-4">{t('security.colActor')}</th>
                    <th className="py-3.5 px-4">{t('security.colAction')}</th>
                    <th className="py-3.5 px-4">{t('security.colResource')}</th>
                    <th className="py-3.5 px-4">{t('security.colDetails')}</th>
                    <th className="py-3.5 px-4">{t('security.colIp')}</th>
                    <th className="py-3.5 px-4 text-center">{t('security.colStatus')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                        <span>{t('common.loading')}</span>
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        {t('security.noLogs')}
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono text-xs">
                          {formatDateTimeFull(log.createdAt)}
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {log.username ? `@${log.username}` : 'SYSTEM'}
                        </td>

                        <td className="py-3.5 px-4">
                          {getActionBadge(log.action)}
                        </td>

                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          {log.resource || '—'}
                        </td>

                        <td className="py-3.5 px-4 max-w-xs text-slate-600 truncate" title={log.details}>
                          {log.details || '—'}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                          {log.ipAddress || '127.0.0.1'}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <StatusBadge value={log.status === 'SUCCESS' ? 'SUCCESS' : 'FAILED'} type="status" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalElements={totalElements}
              pageSize={size}
              onPageChange={(p) => fetchLogs(p)}
            />
          </TableCard>
        </>
      )}
    </div>
  );
};

export default SecurityPage;

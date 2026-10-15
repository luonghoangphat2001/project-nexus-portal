import React, { useEffect, useState } from 'react';
import { auditLogService } from '../services/auditLogService';
import { userService } from '../services/userService';
import { useTranslation } from '../i18n/LanguageContext';
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
          <table className="w-full text-left border-collapse text-sm">
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
                      {log.createdAt ? log.createdAt.replace('T', ' ').slice(0, 19) : '—'}
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
    </div>
  );
};

export default SecurityPage;

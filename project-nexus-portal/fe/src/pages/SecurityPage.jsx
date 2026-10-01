import React, { useEffect, useState } from 'react';
import { auditLogService } from '../services/auditLogService';
import { userService } from '../services/userService';
import {
  ShieldAlert,
  ShieldCheck,
  Download,
  Search,
  RefreshCw,
  Activity,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';

export const SecurityPage = () => {
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
      setError(err.message || 'Failed to load audit logs');
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
      showToast('Audit logs exported to CSV successfully!');
    } catch (err) {
      setError(err.message || 'Failed to export audit logs');
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportUsers = async () => {
    try {
      await userService.exportUsers();
      showToast('User list CSV downloaded successfully!');
    } catch (err) {
      setError(err.message || 'Failed to export user list');
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
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">PASSWORD CHANGE/RESET</span>;
    }
    if (action.includes('CREATE')) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">RECORD CREATED</span>;
    }
    if (action.includes('DELETE')) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">RECORD DELETED</span>;
    }
    if (action.includes('STATUS')) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">STATUS UPDATED</span>;
    }
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 font-mono">{action}</span>;
  };

  const failedLogins = logs.filter((l) => l.action === 'AUTH_LOGIN_FAILED' || l.status === 'FAILED').length;
  const successLogins = logs.filter((l) => l.action === 'AUTH_LOGIN_SUCCESS').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-indigo-600" />
            Security & Audit Logs
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Comprehensive audit trail of authentication events, data mutations, role changes, and secure exports
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => fetchLogs(page)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleExportUsers}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Export Users CSV
          </button>

          <button
            onClick={handleExportAuditLogs}
            disabled={exportLoading}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {exportLoading ? 'Exporting...' : 'Export Audit CSV'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl flex items-center gap-2">
          <CheckCircle className="w-5 h-5 shrink-0" />
          {notification}
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Recorded Events</p>
            <p className="text-2xl font-bold text-slate-800">{totalElements}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Successful Logins (This Page)</p>
            <p className="text-2xl font-bold text-emerald-600">{successLogins}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Security Warnings / Failures</p>
            <p className="text-2xl font-bold text-rose-600">{failedLogins}</p>
          </div>
        </div>
      </div>

      {/* Filters & Audit Logs Table */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search username */}
          <div className="relative flex-1 w-full md:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Search by actor username..."
              value={usernameFilter}
              onChange={(e) => setUsernameFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Filter by Action */}
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Actions</option>
              {distinctActions.map((act) => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>

            {/* Filter by Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="FAILED">FAILED</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
            >
              Search
            </button>
          </div>
        </form>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Resource</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading audit trail records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No audit log entries match the filter criteria
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {log.createdAt ? log.createdAt.replace('T', ' ').slice(0, 19) : '—'}
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-800">
                      {log.username ? `@${log.username}` : 'SYSTEM'}
                    </td>

                    <td className="py-3 px-4">
                      {getActionBadge(log.action)}
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-600">
                      {log.resource || '—'}
                    </td>

                    <td className="py-3 px-4 max-w-xs text-slate-600 truncate" title={log.details}>
                      {log.details || '—'}
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {log.ipAddress || '127.0.0.1'}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {log.status === 'SUCCESS' ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          SUCCESS
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          FAILED
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500">
          <span>
            Page <strong>{page + 1}</strong> of <strong>{totalPages}</strong> ({totalElements} records)
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 0}
              onClick={() => fetchLogs(page - 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition font-medium"
            >
              Previous
            </button>
            <button
              disabled={page + 1 >= totalPages}
              onClick={() => fetchLogs(page + 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition font-medium"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityPage;

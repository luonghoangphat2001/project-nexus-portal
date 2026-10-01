import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { academicService } from '../services/academicService';
import { roleService } from '../services/roleService';
import {
  Users,
  UserCheck,
  UserX,
  Search,
  Shield,
  RefreshCw,
  AlertTriangle,
  Mail,
  Plus,
  Key,
  Download,
  CheckCircle,
  X,
  Trash2,
  Lock,
  Phone,
  IdCard
} from 'lucide-react';

export const UsersPage = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('ROLE_ADMIN');
  const isPrincipal = hasRole('ROLE_PRINCIPAL');

  const [activeTab, setActiveTab] = useState(isAdmin ? 'all' : 'lecturers');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: 'password123',
    fullName: '',
    studentCode: '',
    phone: '',
    roles: ['ROLE_USER'],
    facultyId: '',
    departmentId: '',
    majorId: '',
    cohortId: '',
  });

  const [editingRoles, setEditingRoles] = useState([]);
  const [newPassword, setNewPassword] = useState('password123');
  const [actionLoading, setActionLoading] = useState(false);

  // Academic Master Data for Select Options
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [majors, setMajors] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [systemRoles, setSystemRoles] = useState([]);

  const fetchAcademicData = async () => {
    try {
      const [f, d, m, c, r] = await Promise.all([
        academicService.getAllFaculties().catch(() => []),
        academicService.getAllDepartments().catch(() => []),
        academicService.getAllMajors().catch(() => []),
        academicService.getAllCohorts().catch(() => []),
        roleService.getAllRoles().catch(() => ({ data: [] })),
      ]);
      setFaculties(Array.isArray(f) ? f : []);
      setDepartments(Array.isArray(d) ? d : []);
      setMajors(Array.isArray(m) ? m : []);
      setCohorts(Array.isArray(c) ? c : []);
      if (r && r.data) {
        setSystemRoles(Array.isArray(r.data) ? r.data : []);
      }
    } catch (err) {
      console.error('Error fetching academic data for dropdowns', err);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'lecturers' || !isAdmin) {
        const res = await userService.getScopedLecturers();
        setUsers(res && res.data ? (Array.isArray(res.data) ? res.data : []) : []);
      } else {
        const res = await userService.getAllUsers(0, 100);
        if (res && res.data && res.data.content) {
          setUsers(res.data.content);
        } else if (res && res.data) {
          setUsers(Array.isArray(res.data) ? res.data : []);
        } else {
          setUsers([]);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load user directory');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchAcademicData();
  }, [activeTab]);

  const showNotification = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleToggleStatus = async (id, currentStatus) => {
    if (!isAdmin) return;
    try {
      await userService.toggleStatus(id);
      showNotification(`Account ${currentStatus ? 'locked' : 'unlocked'} successfully!`);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (id, username) => {
    if (!isAdmin) return;
    if (!window.confirm(`Are you sure you want to permanently delete user account "${username}"?`)) return;
    try {
      await userService.deleteUser(id);
      showNotification(`Account "${username}" deleted successfully!`);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      const payload = {
        ...newUser,
        facultyId: newUser.facultyId ? Number(newUser.facultyId) : null,
        departmentId: newUser.departmentId ? Number(newUser.departmentId) : null,
        majorId: newUser.majorId ? Number(newUser.majorId) : null,
        cohortId: newUser.cohortId ? Number(newUser.cohortId) : null,
      };
      await userService.createUser(payload);
      showNotification(`Account "${newUser.username}" created successfully!`);
      setShowCreateModal(false);
      setNewUser({
        username: '',
        email: '',
        password: 'password123',
        fullName: '',
        studentCode: '',
        phone: '',
        roles: ['ROLE_USER'],
        facultyId: '',
        departmentId: '',
        majorId: '',
        cohortId: '',
      });
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to create user account');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenRoleModal = (user) => {
    setSelectedUser(user);
    setEditingRoles(Array.from(user.roles || []));
    setShowRoleModal(true);
  };

  const handleSaveRoles = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await userService.updateRoles(selectedUser.id, editingRoles);
      showNotification(`Roles updated for "${selectedUser.username}" successfully!`);
      setShowRoleModal(false);
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to update roles');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenResetPasswordModal = (user) => {
    setSelectedUser(user);
    setNewPassword('password123');
    setShowResetPasswordModal(true);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await userService.resetPassword(selectedUser.id, newPassword);
      showNotification(`Password reset for "${selectedUser.username}" successfully!`);
      setShowResetPasswordModal(false);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportUsers = async () => {
    try {
      await userService.exportUsers();
      showNotification('User list CSV exported successfully!');
    } catch (err) {
      setError(err.message || 'Failed to export CSV');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.fullName && u.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.studentCode && u.studentCode.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole =
      selectedRoleFilter === 'ALL' || (u.roles && u.roles.includes(selectedRoleFilter));

    const matchesStatus =
      selectedStatusFilter === 'ALL' ||
      (selectedStatusFilter === 'ACTIVE' && u.active) ||
      (selectedStatusFilter === 'INACTIVE' && !u.active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ROLE_ADMIN':
        return <span key={role} className="px-2 py-0.5 text-xs font-semibold rounded-md bg-red-100 text-red-700">Admin</span>;
      case 'ROLE_PRINCIPAL':
        return <span key={role} className="px-2 py-0.5 text-xs font-semibold rounded-md bg-amber-100 text-amber-700">Dean / Head</span>;
      case 'ROLE_TEACHER':
        return <span key={role} className="px-2 py-0.5 text-xs font-semibold rounded-md bg-blue-100 text-blue-700">Lecturer</span>;
      case 'ROLE_COUNCIL':
        return <span key={role} className="px-2 py-0.5 text-xs font-semibold rounded-md bg-purple-100 text-purple-700">Council</span>;
      case 'ROLE_USER':
      default:
        return <span key={role} className="px-2 py-0.5 text-xs font-semibold rounded-md bg-emerald-100 text-emerald-700">Student</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-600" />
            User Management & Access Control
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Search, provision academic user accounts, assign role permissions, and govern active states
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchUsers}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {isAdmin && (
            <>
              <button
                onClick={handleExportUsers}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>

              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                Add User
              </button>
            </>
          )}
        </div>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl flex items-center gap-2">
          <CheckCircle className="w-5 h-5 shrink-0" />
          {successMessage}
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Tabs & Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Tabs */}
          {isAdmin && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                  activeTab === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Users ({users.length})
              </button>
              <button
                onClick={() => setActiveTab('lecturers')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                  activeTab === 'lecturers'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Thesis Advisors
              </button>
            </div>
          )}

          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, email, username, student code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Dropdown Filters */}
          <div className="flex items-center gap-2">
            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Roles</option>
              <option value="ROLE_ADMIN">Administrator (Admin)</option>
              <option value="ROLE_PRINCIPAL">Dean / Dept Head</option>
              <option value="ROLE_TEACHER">Lecturer (Teacher)</option>
              <option value="ROLE_COUNCIL">Evaluation Council</option>
              <option value="ROLE_USER">Student</option>
            </select>

            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Locked / Inactive</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">ID Code</th>
                <th className="py-3 px-4">Email & Phone</th>
                <th className="py-3 px-4">Roles</th>
                <th className="py-3 px-4">Status</th>
                {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading user directory...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No user accounts match the current filter criteria
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName || u.username)}&background=6366f1&color=fff`}
                          alt="Avatar"
                          className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-100"
                        />
                        <div>
                          <p className="font-bold text-slate-800">{u.fullName || u.username}</p>
                          <p className="text-[11px] text-slate-400 font-mono">@{u.username}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-medium text-slate-600">
                      {u.studentCode || '—'}
                    </td>

                    <td className="py-3 px-4 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[180px]">{u.email}</span>
                      </div>
                      {u.phone && (
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                          <Phone className="w-3 h-3 shrink-0" />
                          <span>{u.phone}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {u.roles && u.roles.length > 0 ? (
                          u.roles.map(getRoleBadge)
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {u.active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200">
                          <UserCheck className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 rounded-full border border-rose-200">
                          <UserX className="w-3 h-3" /> Locked
                        </span>
                      )}
                    </td>

                    {isAdmin && (
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            title="Assign Roles"
                            onClick={() => handleOpenRoleModal(u)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          >
                            <Shield className="w-4 h-4" />
                          </button>

                          <button
                            title="Reset Password"
                            onClick={() => handleOpenResetPasswordModal(u)}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          >
                            <Key className="w-4 h-4" />
                          </button>

                          <button
                            title={u.active ? 'Lock account' : 'Unlock account'}
                            onClick={() => handleToggleStatus(u.id, u.active)}
                            className={`p-1.5 rounded-lg transition ${
                              u.active
                                ? 'text-rose-600 hover:bg-rose-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {u.active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>

                          <button
                            title="Delete account"
                            onClick={() => handleDeleteUser(u.id, u.username)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-100 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Create New User Account
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    placeholder="johndoe"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Academic Email *</label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="johndoe@nexus.edu.vn"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Initial Password *</label>
                  <input
                    type="password"
                    required
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newUser.fullName}
                    onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Student / Staff ID</label>
                  <input
                    type="text"
                    value={newUser.studentCode}
                    onChange={(e) => setNewUser({ ...newUser, studentCode: e.target.value })}
                    placeholder="STD2026001 or LEC01"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    placeholder="+1 234 567 8900"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Roles checkboxes */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Assigned Roles *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  {['ROLE_USER', 'ROLE_TEACHER', 'ROLE_PRINCIPAL', 'ROLE_COUNCIL', 'ROLE_ADMIN'].map((r) => (
                    <label key={r} className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={newUser.roles.includes(r)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewUser({ ...newUser, roles: [...newUser.roles, r] });
                          } else {
                            setNewUser({ ...newUser, roles: newUser.roles.filter((x) => x !== r) });
                          }
                        }}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{r.replace('ROLE_', '')}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Academic affiliations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Faculty</label>
                  <select
                    value={newUser.facultyId}
                    onChange={(e) => setNewUser({ ...newUser, facultyId: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="">-- None --</option>
                    {faculties.map((f) => (
                      <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Department</label>
                  <select
                    value={newUser.departmentId}
                    onChange={(e) => setNewUser({ ...newUser, departmentId: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="">-- None --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Academic Major</label>
                  <select
                    value={newUser.majorId}
                    onChange={(e) => setNewUser({ ...newUser, majorId: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="">-- None --</option>
                    {majors.map((m) => (
                      <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Student Cohort</label>
                  <select
                    value={newUser.cohortId}
                    onChange={(e) => setNewUser({ ...newUser, cohortId: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="">-- None --</option>
                    {cohorts.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {actionLoading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Manage Roles Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                Assign Roles for @{selectedUser.username}
              </h2>
              <button
                onClick={() => setShowRoleModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Select roles to grant to <strong>{selectedUser.fullName || selectedUser.username}</strong>:
            </p>

            <form onSubmit={handleSaveRoles} className="space-y-4">
              <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                {[
                  { role: 'ROLE_ADMIN', title: 'System Administrator (Super Admin)' },
                  { role: 'ROLE_PRINCIPAL', title: 'Faculty / Department Head' },
                  { role: 'ROLE_TEACHER', title: 'Lecturer & Thesis Advisor' },
                  { role: 'ROLE_COUNCIL', title: 'Evaluation Council' },
                  { role: 'ROLE_USER', title: 'Student / Candidate' },
                ].map((item) => (
                  <label key={item.role} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white cursor-pointer transition text-xs">
                    <input
                      type="checkbox"
                      checked={editingRoles.includes(item.role)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEditingRoles([...editingRoles, item.role]);
                        } else {
                          setEditingRoles(editingRoles.filter((r) => r !== item.role));
                        }
                      }}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <p className="font-semibold text-slate-800">{item.title}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{item.role}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Roles'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Reset Password Modal */}
      {showResetPasswordModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-600" />
                Reset Password
              </h2>
              <button
                onClick={() => setShowResetPasswordModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Enter new password for <strong>@{selectedUser.username}</strong>:
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">New Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetPasswordModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;

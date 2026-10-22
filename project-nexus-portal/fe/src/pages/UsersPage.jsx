import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { academicService } from '../services/academicService';
import { roleService } from '../services/roleService';
import { useTranslation } from '../i18n/LanguageContext';
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
  Phone,
  Eye,
  Crown,
  BookOpen,
  GraduationCap,
  Building,
} from 'lucide-react';
import { formatStudentTeamMember, formatLecturerName } from '../utils/userFormatters';
import { formatDateTime } from '../utils/dateUtils';
import {
  PageHeader,
  FilterCard,
  FilterField,
  TableCard,
  TableHeaderBar,
  StatusBadge,
  Modal,
  buttonClass,
  inputClass,
  selectClass,
} from '../components/common/CommonUi';

export const UsersPage = () => {
  const { hasRole } = useAuth();
  const { t } = useTranslation();
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
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);

  const handleOpenDetailModal = async (u) => {
    setViewingUser(u);
    setShowDetailModal(true);
    try {
      const res = await userService.getUserById(u.id);
      const detail = res.data || res;
      if (detail && detail.id) {
        setViewingUser(detail);
      }
    } catch (_) {
      // fallback to row data
    }
  };

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
      setError(err.message || t('common.error'));
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
      showNotification(t('users.actionSuccess'));
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (id, username) => {
    if (!isAdmin) return;
    if (!window.confirm(`${t('users.confirmDeleteUser')} (${username})`)) return;
    try {
      await userService.deleteUser(id);
      showNotification(t('users.actionSuccess'));
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
      showNotification(t('users.actionSuccess'));
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
      setError(err.message || t('common.error'));
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
      showNotification(t('users.actionSuccess'));
      setShowRoleModal(false);
      fetchUsers();
    } catch (err) {
      setError(err.message || t('common.error'));
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
      showNotification(t('users.actionSuccess'));
      setShowResetPasswordModal(false);
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportUsers = async () => {
    try {
      await userService.exportUsers();
      showNotification(t('users.actionSuccess'));
    } catch (err) {
      setError(err.message || t('common.error'));
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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <PageHeader
        title={t('users.title')}
        description={t('users.subtitle')}
        actions={
          <>
            <button
              onClick={fetchUsers}
              className={buttonClass.secondary}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{t('users.refresh')}</span>
            </button>

            {isAdmin && (
              <>
                <button
                  onClick={handleExportUsers}
                  className={buttonClass.secondary}
                >
                  <Download className="w-4 h-4" />
                  <span>{t('users.exportCsv')}</span>
                </button>

                <button
                  onClick={() => setShowCreateModal(true)}
                  className={buttonClass.primary}
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('users.addUser')}</span>
                </button>
              </>
            )}
          </>
        }
      />

      {/* Alerts */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl flex items-center gap-2">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Card */}
      <FilterCard
        onReset={() => {
          setSearchQuery('');
          setSelectedRoleFilter('ALL');
          setSelectedStatusFilter('ALL');
        }}
      >
        <FilterField label={t('common.search') || 'Search'}>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder={t('users.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${inputClass} pl-9`}
            />
          </div>
        </FilterField>

        <FilterField label={t('users.colRoles') || 'Role'}>
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className={selectClass}
          >
            <option value="ALL">{t('users.allRoles')}</option>
            <option value="ROLE_ADMIN">{t('enums.role.ROLE_ADMIN')}</option>
            <option value="ROLE_PRINCIPAL">{t('enums.role.ROLE_PRINCIPAL')}</option>
            <option value="ROLE_TEACHER">{t('enums.role.ROLE_TEACHER')}</option>
            <option value="ROLE_COUNCIL">{t('enums.role.ROLE_COUNCIL')}</option>
            <option value="ROLE_USER">{t('enums.role.ROLE_USER')}</option>
          </select>
        </FilterField>

        <FilterField label={t('users.colStatus') || 'Status'}>
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className={selectClass}
          >
            <option value="ALL">{t('users.allStatuses')}</option>
            <option value="ACTIVE">{t('users.activeStatus')}</option>
            <option value="INACTIVE">{t('users.inactiveStatus')}</option>
          </select>
        </FilterField>
      </FilterCard>

      {/* Users Table Card */}
      <TableCard>
        <TableHeaderBar
          title={activeTab === 'all' ? t('users.allUsers') : t('users.advisors')}
          count={filteredUsers.length}
          actions={
            isAdmin && (
              <div className="flex items-center space-x-1 p-0.5 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                    activeTab === 'all'
                      ? 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t('users.allUsers')}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('lecturers')}
                  className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                    activeTab === 'lecturers'
                      ? 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t('users.advisors')}
                </button>
              </div>
            )
          }
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-sm font-semibold text-slate-600">
                <th className="py-3.5 px-4">{t('users.colUser')}</th>
                <th className="py-3.5 px-4">{t('users.colIdCode')}</th>
                <th className="py-3.5 px-4">{t('users.colEmailPhone')}</th>
                <th className="py-3.5 px-4">{t('users.colRoles')}</th>
                <th className="py-3.5 px-4">{t('users.colStatus')}</th>
                <th className="py-3.5 px-4 text-right">{t('users.colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    <span>{t('common.loading')}</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 cursor-pointer" onClick={() => handleOpenDetailModal(u)}>
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName || u.username)}&background=2563eb&color=fff`}
                          alt="Avatar"
                          className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200"
                        />
                        <div>
                          <p className="font-semibold text-slate-900 hover:text-blue-600 transition flex items-center gap-1.5">
                            <span>{formatStudentTeamMember(u.fullName || u.username, { isLeader: false })}</span>
                            {u.roleInTeam === 'LEADER' && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium inline-flex items-center gap-0.5">
                                <Crown className="w-3 h-3 text-amber-500" />
                                <span>Trưởng nhóm</span>
                              </span>
                            )}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                            <span>@{u.username}</span>
                            {u.teamName && (
                              <>
                                <span>•</span>
                                <span className="text-indigo-600 font-sans font-medium flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {u.teamName}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-medium text-slate-600">
                      {u.studentCode || '—'}
                    </td>

                    <td className="py-3.5 px-4 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[180px]">{u.email}</span>
                      </div>
                      {u.phone && (
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          <span>{u.phone}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {u.roles && u.roles.length > 0 ? (
                          u.roles.map((r) => (
                            <StatusBadge key={r} value={r} type="role" />
                          ))
                        ) : (
                          <span className="text-slate-400 italic text-xs">{t('users.unassignedRole')}</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge value={u.active ? 'ACTIVE' : 'INACTIVE'} />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          title={t('users.viewDetail', 'Xem chi tiết')}
                          onClick={() => handleOpenDetailModal(u)}
                          className={buttonClass.actionRow}
                        >
                          <Eye className="w-4 h-4 text-slate-600" />
                        </button>

                        {isAdmin && (
                          <>
                            <button
                              title="Assign Roles"
                              onClick={() => handleOpenRoleModal(u)}
                              className={buttonClass.actionRow}
                            >
                              <Shield className="w-4 h-4 text-blue-600" />
                            </button>

                            <button
                              title="Reset Password"
                              onClick={() => handleOpenResetPasswordModal(u)}
                              className={buttonClass.actionRow}
                            >
                              <Key className="w-4 h-4 text-amber-600" />
                            </button>

                            <button
                              title={u.active ? t('users.lockedBadge') : t('users.activeBadge')}
                              onClick={() => handleToggleStatus(u.id, u.active)}
                              className={buttonClass.actionRow}
                            >
                              {u.active ? <UserX className="w-4 h-4 text-rose-600" /> : <UserCheck className="w-4 h-4 text-emerald-600" />}
                            </button>

                            <button
                              title="Delete account"
                              onClick={() => handleDeleteUser(u.id, u.username)}
                              className={buttonClass.actionRowDanger}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </TableCard>

      {/* Modal 1: Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={t('users.modalCreateTitle')}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">{t('users.usernameLabel')} *</label>
              <input
                type="text"
                required
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                placeholder="johndoe"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">{t('users.emailLabel')} *</label>
              <input
                type="email"
                required
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="johndoe@nexus.edu.vn"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">{t('users.passwordLabel')} *</label>
              <input
                type="password"
                required
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">{t('users.fullNameLabel')} *</label>
              <input
                type="text"
                required
                value={newUser.fullName}
                onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                placeholder="Nguyễn Văn A"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">{t('users.idCodeLabel')}</label>
              <input
                type="text"
                value={newUser.studentCode}
                onChange={(e) => setNewUser({ ...newUser, studentCode: e.target.value })}
                placeholder="21110001"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">{t('users.phoneLabel')}</label>
              <input
                type="tel"
                value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                placeholder="0912345678"
                className={inputClass}
              />
            </div>
          </div>

          {/* Roles checkboxes */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">{t('users.assignedRolesLabel')} *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm">
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
                    className="rounded text-[#b66dff] focus:ring-[#b66dff]"
                  />
                  <span>{t(`enums.role.${r}`, r.replace('ROLE_', ''))}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Academic affiliations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">{t('users.facultyLabel')}</label>
              <select
                value={newUser.facultyId}
                onChange={(e) => setNewUser({ ...newUser, facultyId: e.target.value, departmentId: '', majorId: '' })}
                className={selectClass}
              >
                <option value="">-- {t('common.none')} --</option>
                {faculties.map((f) => (
                  <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">{t('users.departmentLabel')}</label>
              <select
                value={newUser.departmentId}
                onChange={(e) => setNewUser({ ...newUser, departmentId: e.target.value, majorId: '' })}
                className={selectClass}
              >
                <option value="">-- {t('common.none')} --</option>
                {departments
                  .filter((d) => !newUser.facultyId || d.facultyId === Number(newUser.facultyId))
                  .map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">{t('users.majorLabel')}</label>
              <select
                value={newUser.majorId}
                onChange={(e) => setNewUser({ ...newUser, majorId: e.target.value })}
                className={selectClass}
              >
                <option value="">-- {t('common.none')} --</option>
                {majors
                  .filter((m) => !newUser.departmentId || m.departmentId === Number(newUser.departmentId))
                  .map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">{t('users.cohortLabel')}</label>
              <select
                value={newUser.cohortId}
                onChange={(e) => setNewUser({ ...newUser, cohortId: e.target.value })}
                className={selectClass}
              >
                <option value="">-- {t('common.none')} --</option>
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
              className={buttonClass.secondary}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className={buttonClass.primary}
            >
              {actionLoading ? t('common.loading') : t('users.createUserBtn')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Manage Roles Modal */}
      <Modal
        isOpen={showRoleModal && !!selectedUser}
        onClose={() => setShowRoleModal(false)}
        title={`${t('users.modalRolesTitle')} @${selectedUser?.username}`}
      >
        <p className="text-xs text-slate-500 mb-3">
          {t('users.modalRolesSub')} <strong>{selectedUser?.fullName || selectedUser?.username}</strong>:
        </p>

        <form onSubmit={handleSaveRoles} className="space-y-4">
          <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
            {[
              { role: 'ROLE_ADMIN', title: t('enums.role.ROLE_ADMIN') },
              { role: 'ROLE_PRINCIPAL', title: t('enums.role.ROLE_PRINCIPAL') },
              { role: 'ROLE_TEACHER', title: t('enums.role.ROLE_TEACHER') },
              { role: 'ROLE_COUNCIL', title: t('enums.role.ROLE_COUNCIL') },
              { role: 'ROLE_USER', title: t('enums.role.ROLE_USER') },
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
                  className="rounded text-[#b66dff] focus:ring-[#b66dff]"
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
              className={buttonClass.secondary}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className={buttonClass.primary}
            >
              {actionLoading ? t('common.loading') : t('users.saveRolesBtn')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Reset Password Modal */}
      <Modal
        isOpen={showResetPasswordModal && !!selectedUser}
        onClose={() => setShowResetPasswordModal(false)}
        title={t('users.modalResetPassTitle')}
      >
        <p className="text-sm text-slate-500 mb-3">
          {t('users.modalResetPassSub')} <strong>@{selectedUser?.username}</strong>:
        </p>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">{t('users.newPasswordLabel')} *</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowResetPasswordModal(false)}
              className={buttonClass.secondary}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className={buttonClass.primary}
            >
              {actionLoading ? t('common.loading') : t('users.resetPassBtn')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 4: User Detail Modal */}
      <Modal
        isOpen={showDetailModal && !!viewingUser}
        onClose={() => setShowDetailModal(false)}
        title={t('users.userDetail', 'Chi tiết người dùng')}
      >
        {viewingUser && (
          <div className="space-y-4">
            {/* User Profile Header */}
            <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <img
                src={viewingUser.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(viewingUser.fullName || viewingUser.username)}&background=2563eb&color=fff&size=128`}
                alt="Avatar"
                className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-slate-900 truncate">
                    {formatStudentTeamMember(viewingUser.fullName || viewingUser.username, { isLeader: false })}
                  </h3>
                  <StatusBadge value={viewingUser.active ? 'ACTIVE' : 'INACTIVE'} />
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">@{viewingUser.username}</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {viewingUser.roles?.map((r) => (
                    <StatusBadge key={r} value={r} type="role" />
                  ))}
                </div>
              </div>
            </div>

            {/* Team & Position Card (Prominently Highlighted) */}
            <div className="p-3.5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/40">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5 mb-2.5">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>{t('users.teamAndRole', 'Thông tin nhóm & Chức vụ')}</span>
              </h4>

              {viewingUser.teamName ? (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-indigo-100 shadow-2xs">
                    <span className="text-slate-500 font-medium">{t('users.teamName', 'Thuộc nhóm')}:</span>
                    <span className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                      <Users className="w-4 h-4 text-indigo-600" />
                      {viewingUser.teamName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-indigo-100 shadow-2xs">
                    <span className="text-slate-500 font-medium">{t('users.roleInTeam', 'Chức vụ trong nhóm')}:</span>
                    <span className="font-semibold">
                      {viewingUser.roleInTeam === 'LEADER' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
                          <Crown className="w-3.5 h-3.5 text-amber-600" />
                          <span>{t('teams.leader', 'Trưởng nhóm (Leader)')}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          <span>{t('teams.member', 'Thành viên (Member)')}</span>
                        </span>
                      )}
                    </span>
                  </div>

                  {viewingUser.topicTitle && (
                    <div className="p-2.5 rounded-xl bg-white border border-indigo-100 shadow-2xs">
                      <span className="text-slate-500 font-medium block mb-1 flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{t('users.topic', 'Đề tài tham gia')}:</span>
                      </span>
                      <p className="font-semibold text-indigo-950 leading-snug">{viewingUser.topicTitle}</p>
                    </div>
                  )}
                </div>
              ) : viewingUser.roles?.includes('ROLE_TEACHER') || viewingUser.roles?.includes('ROLE_PRINCIPAL') ? (
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white border border-indigo-100 shadow-2xs flex items-center justify-between">
                    <span className="text-slate-500 font-medium flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{t('users.department', 'Bộ môn')}:</span>
                    </span>
                    <span className="font-semibold text-slate-800">{viewingUser.departmentName || 'Bộ môn Công nghệ thông tin'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-indigo-100 shadow-2xs flex items-center justify-between">
                    <span className="text-slate-500 font-medium flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{t('users.faculty', 'Khoa')}:</span>
                    </span>
                    <span className="font-semibold text-slate-800">{viewingUser.facultyName || 'Khoa Công nghệ thông tin'}</span>
                  </div>
                  {viewingUser.topicTitle && (
                    <div className="p-2.5 rounded-xl bg-white border border-indigo-100 shadow-2xs">
                      <span className="text-slate-500 font-medium block mb-1 flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Đề tài hướng dẫn / phụ trách:</span>
                      </span>
                      <p className="font-semibold text-indigo-950 leading-snug">{viewingUser.topicTitle}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3.5 text-center rounded-xl bg-white border border-indigo-100 text-slate-500 text-xs italic">
                  {t('users.noTeam', 'Chưa tham gia nhóm nào (Sinh viên tự do)')}
                </div>
              )}
            </div>

            {/* Academic & Contact Information */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2.5 text-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                {t('users.academicInfo', 'Thông tin học vụ & Liên hệ')}
              </h4>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200/60 shadow-2xs">
                  <span className="text-slate-400 block text-[11px] mb-0.5">{t('users.studentCode', 'Mã số SV / Cán bộ')}</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{viewingUser.studentCode || '—'}</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200/60 shadow-2xs">
                  <span className="text-slate-400 block text-[11px] mb-0.5">{t('users.phone', 'Số điện thoại')}</span>
                  <span className="font-medium text-slate-800">{viewingUser.phone || '—'}</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200/60 shadow-2xs">
                  <span className="text-slate-400 block text-[11px] mb-0.5">{t('users.major', 'Chuyên ngành')}</span>
                  <span className="font-medium text-slate-800">{viewingUser.majorName || '—'}</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200/60 shadow-2xs">
                  <span className="text-slate-400 block text-[11px] mb-0.5">{t('users.cohort', 'Khóa')}</span>
                  <span className="font-medium text-slate-800">{viewingUser.cohortName || '—'}</span>
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200/60 shadow-2xs flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">{t('users.email', 'Email')}:</span>
                <span className="font-medium text-slate-800 select-all">{viewingUser.email}</span>
              </div>

              {viewingUser.createdAt && (
                <div className="p-2.5 bg-white rounded-xl border border-slate-200/60 shadow-2xs flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">Ngày tham gia hệ thống:</span>
                  <span className="font-mono text-slate-600 text-[11px]">{formatDateTime(viewingUser.createdAt, '—')}</span>
                </div>
              )}
            </div>

            {/* Modal Close Button */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className={buttonClass.secondary}
              >
                {t('common.close', 'Đóng')}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UsersPage;

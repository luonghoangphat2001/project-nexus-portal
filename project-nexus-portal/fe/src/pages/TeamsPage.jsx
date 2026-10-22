import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Crown,
  LogOut,
  Mail,
  Check,
  X,
} from 'lucide-react';
import teamService from '../services/teamService';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import { formatApiError } from '../utils/errorHandler';
import { formatStudentTeamMember } from '../utils/userFormatters';
import {
  PageHeader,
  TableCard,
  TableHeaderBar,
  StatusBadge,
  Modal,
  Banner,
  buttonClass,
  inputClass,
} from '../components/common/CommonUi';

export const TeamsPage = () => {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const [team, setTeam] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteStudentCode, setInviteStudentCode] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [actionSuccess, setActionSuccess] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      try {
        const teamRes = await teamService.getMyTeam();
        setTeam(teamRes || null);
      } catch (err) {
        setTeam(null);
      }

      const invRes = await teamService.getMyInvitations();
      setInvitations(invRes || []);
    } catch (err) {
      setError(formatApiError(err, language));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    try {
      await teamService.createTeam({
        name: newTeamName,
        periodId: 1,
      });
      setCreateModalOpen(false);
      setNewTeamName('');
      loadData();
    } catch (err) {
      alert(formatApiError(err, language));
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteStudentCode.trim() || !team) return;
    try {
      await teamService.sendInvitation(team.id, {
        inviteeIdentifier: inviteStudentCode.trim(),
        message: inviteMessage,
      });
      setActionSuccess(t('teams.inviteSuccess'));
      setTimeout(() => {
        setInviteModalOpen(false);
        setActionSuccess(null);
        setInviteStudentCode('');
        setInviteMessage('');
      }, 1500);
    } catch (err) {
      alert(formatApiError(err, language));
    }
  };

  const handleRespondInvitation = async (invitationId, accept) => {
    try {
      await teamService.respondToInvitation(invitationId, accept);
      loadData();
    } catch (err) {
      alert(formatApiError(err, language));
    }
  };

  const handleLeaveTeam = async () => {
    if (!team) return;
    if (!window.confirm(t('teams.confirmLeave', 'Bạn có chắc chắn muốn rời khỏi nhóm này không?'))) return;
    try {
      await teamService.leaveTeam(team.id);
      loadData();
    } catch (err) {
      alert(formatApiError(err, language));
    }
  };

  const handleRemoveMember = async (memberUserId) => {
    if (!team) return;
    if (!window.confirm(t('teams.confirmRemove', 'Bạn có chắc chắn muốn xóa thành viên này khỏi nhóm?'))) return;
    try {
      await teamService.removeMember(team.id, memberUserId);
      loadData();
    } catch (err) {
      alert(formatApiError(err, language));
    }
  };

  const handleTransferLeader = async (newLeaderUserId, memberName) => {
    if (!team) return;
    if (!window.confirm(t('teams.confirmTransfer', `Bạn có chắc chắn muốn chuyển vai trò Trưởng nhóm cho ${memberName}?`))) return;
    try {
      await teamService.transferLeader(team.id, newLeaderUserId);
      loadData();
    } catch (err) {
      alert(formatApiError(err, language));
    }
  };

  const isLeader = team && (team.leaderId === user?.id || team.leader?.id === user?.id || team.members?.some((m) => m.userId === user?.id && m.roleInTeam === 'LEADER'));
  const isLocked = team?.status === 'LOCKED';

  if (loading) {
    return <div className="py-16 text-center text-slate-400">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title={t('teams.title')}
        description={t('teams.subtitle')}
        action={
          !team && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className={buttonClass.primary}
            >
              <Users className="w-4 h-4" />
              <span>{t('teams.formNewTeam')}</span>
            </button>
          )
        }
      />

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Has Team View */}
      {team ? (
        <div className="space-y-6">
          {isLocked && (
            <Banner notice={t('errors.teamLocked')} />
          )}

          {/* Team Overview Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                  {team.name?.charAt(0) || 'T'}
                </div>
                <div>
                  <div className="flex items-center space-x-2.5">
                    <h2 className="text-xl font-bold text-slate-900">{team.name}</h2>
                    <StatusBadge value={team.status || 'FORMING'} type="status" />
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {team.members?.length || 1} / 3 {t('teams.membersEnrolled')}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {isLeader && (team.members?.length || 0) < 3 && (
                  <button
                    disabled={isLocked}
                    onClick={() => setInviteModalOpen(true)}
                    className={`${buttonClass.primary} ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={isLocked ? t('errors.teamLocked') : t('teams.inviteMember')}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{t('teams.inviteMember')}</span>
                  </button>
                )}

                {!isLeader && (
                  <button
                    disabled={isLocked}
                    onClick={handleLeaveTeam}
                    className={`${buttonClass.danger} ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={isLocked ? t('errors.teamLockedLeave') : t('teams.leaveTeam')}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('teams.leaveTeam')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Members Roster */}
          <TableCard>
            <TableHeaderBar
              title={`${t('teams.teamRoster')} (${team.members?.length || 0}/3)`}
              subtitle={t('teams.allowedRange')}
            />

            <div className="divide-y divide-slate-100">
              {team.members?.map((m) => {
                const isMemberLeader = m.roleInTeam === 'LEADER';

                return (
                  <div key={m.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm">
                        {m.fullName?.charAt(0) || m.username?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-slate-900 text-sm">{formatStudentTeamMember(m.fullName || m.username, { isLeader: false })}</span>
                          {isMemberLeader && (
                            <span className="flex items-center space-x-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              <Crown className="w-3.5 h-3.5 text-amber-500" />
                              <span>{t('teams.leader')}</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-3 text-xs text-slate-400 mt-0.5 font-mono">
                          <span>{t('teams.studentCode')}: {m.studentCode || 'N/A'}</span>
                          <span>•</span>
                          <span>{m.email}</span>
                        </div>
                      </div>
                    </div>

                    {isLeader && !isMemberLeader && !isLocked && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleTransferLeader(m.userId, m.fullName || m.username)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                          title={t('teams.transferLeader', 'Chuyển quyền trưởng nhóm')}
                        >
                          <Crown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveMember(m.userId)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title={t('teams.removeMember')}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </TableCard>
        </div>
      ) : (
        /* No Team View: Empty State + Pending Invitations Inbox */
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center max-w-xl mx-auto shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">{t('teams.noTeamTitle')}</h2>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              {t('teams.noTeamDesc')}
            </p>
            <div className="mt-5 flex justify-center space-x-3">
              <button
                onClick={() => setCreateModalOpen(true)}
                className={buttonClass.primary}
              >
                {t('teams.formNewTeam')}
              </button>
            </div>
          </div>

          {/* Pending Invitations Inbox */}
          <TableCard>
            <TableHeaderBar
              title={t('teams.pendingInvitations')}
              count={invitations.length}
              subtitle={t('teams.invitationNote')}
            />

            {invitations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">{t('teams.noInvitations')}</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {invitations.map((inv) => (
                  <div key={inv.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-900 text-sm">{inv.teamName}</span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono">
                          {t('teams.invitedBy')} {inv.inviterName}
                        </span>
                      </div>
                      {inv.message && <p className="text-xs text-slate-500 mt-1 italic">"{inv.message}"</p>}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        disabled={!!team}
                        onClick={() => handleRespondInvitation(inv.id, true)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 shadow-xs transition-all ${
                          team
                            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                        }`}
                        title={team ? t('errors.alreadyInTeam') : t('teams.acceptAndJoin')}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{team ? t('teams.alreadyHasTeam', 'Đã có nhóm') : t('teams.acceptAndJoin')}</span>
                      </button>
                      <button
                        onClick={() => handleRespondInvitation(inv.id, false)}
                        className={buttonClass.secondary}
                      >
                        {t('teams.decline')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TableCard>
        </div>
      )}

      {/* Create Team Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={t('teams.modalCreateTitle')}
      >
        <form onSubmit={handleCreateTeam} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">{t('teams.teamName')}</label>
            <input
              type="text"
              required
              placeholder={t('teams.placeholderTeamName')}
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className={buttonClass.secondary}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className={buttonClass.primary}
            >
              {t('teams.formNewTeam')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Invite Member Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title={t('teams.modalInviteTitle')}
      >
        <form onSubmit={handleInviteMember} className="space-y-4">
          {actionSuccess ? (
            <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm">
              {actionSuccess}
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {t('teams.inviteIdentifier')}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('teams.placeholderIdentifier')}
                  value={inviteStudentCode}
                  onChange={(e) => setInviteStudentCode(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{t('teams.inviteMessage')}</label>
                <textarea
                  rows={3}
                  placeholder={t('teams.placeholderMessage')}
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className={buttonClass.secondary}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className={buttonClass.primary}
                >
                  {t('teams.sendInvite')}
                </button>
              </div>
            </>
          )}
        </form>
      </Modal>
    </div>
  );
};

export default TeamsPage;

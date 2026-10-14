import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Users,
} from 'lucide-react';
import registrationService from '../services/registrationService';
import topicService from '../services/topicService';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import {
  PageHeader,
  TableCard,
  TableHeaderBar,
  StatusBadge,
  Modal,
  EmptyState,
  inputClass,
  selectClass,
  buttonClass,
} from '../components/common/CommonUi';

export const RegistrationsPage = () => {
  const { user, hasRole } = useAuth();
  const { t } = useTranslation();
  const isLecturerOrAdmin = hasRole('ROLE_ADMIN') || hasRole('ROLE_TEACHER') || hasRole('ROLE_PRINCIPAL');

  const [activePeriods, setActivePeriods] = useState([]);
  const [teamRegistrations, setTeamRegistrations] = useState([]);
  const [advisorTopics, setAdvisorTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [topicRegistrations, setTopicRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedReg, setSelectedReg] = useState(null);
  const [reviewDecision, setReviewDecision] = useState('APPROVED');
  const [reviewFeedback, setReviewFeedback] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [periods, teamRegs] = await Promise.all([
        topicService.getActivePeriods().catch(() => []),
        registrationService.getMyTeamRegistrations().catch(() => []),
      ]);
      setActivePeriods(periods || []);
      setTeamRegistrations(teamRegs || []);

      if (isLecturerOrAdmin) {
        const topics = await topicService.getMyLecturerTopics().catch(() => []);
        setAdvisorTopics(topics || []);
        if (topics && topics.length > 0) {
          setSelectedTopicId(topics[0].id);
          fetchTopicRegistrations(topics[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopicRegistrations = async (topicId) => {
    if (!topicId) return;
    try {
      const res = await registrationService.getTopicRegistrations(topicId);
      setTopicRegistrations(res || []);
    } catch (err) {
      setTopicRegistrations([]);
    }
  };

  const handleCancelRegistration = async (id) => {
    if (!window.confirm(t('teams.leaveConfirm'))) return;
    try {
      await registrationService.cancelRegistration(id);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to cancel registration');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReg) return;
    try {
      await registrationService.reviewRegistration(selectedReg.id, {
        status: reviewDecision,
        feedback: reviewFeedback,
      });
      setReviewModalOpen(false);
      setSelectedReg(null);
      setReviewFeedback('');
      if (selectedTopicId) {
        fetchTopicRegistrations(selectedTopicId);
      }
    } catch (err) {
      alert(err.message || 'Failed to submit review');
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-slate-400 font-medium">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <PageHeader
        title={t('registrations.title')}
        description={t('registrations.desc')}
      />

      {/* Active Periods Banner */}
      {activePeriods.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activePeriods.map((period) => (
            <div
              key={period.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-start space-x-3.5"
            >
              <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-slate-800 text-sm truncate">{period.name}</h3>
                  <StatusBadge value={period.status} />
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {period.academicYear} • {t('periods.semesterLabel', { num: period.semester })}
                </p>
                <div className="flex items-center space-x-3 mt-2 text-xs text-slate-500 font-mono">
                  <span>{t('periods.regStarts')}: {period.startDate?.split('T')[0]}</span>
                  <span>•</span>
                  <span>{t('periods.submissionDeadline')}: {period.submissionDeadline?.split('T')[0]}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Student: My Team's Registrations */}
      <TableCard>
        <TableHeaderBar
          title={t('registrations.myTeamRegistrations')}
          count={teamRegistrations.length}
        />

        {teamRegistrations.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            {t('registrations.noTeamRegsFound')}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {teamRegistrations.map((reg) => (
              <div key={reg.id} className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                <div>
                  <div className="flex items-center space-x-2.5">
                    <span className="font-bold text-slate-900 text-base">{reg.topicTitle}</span>
                    <StatusBadge value={reg.status} />
                  </div>

                  {reg.feedback && (
                    <div className="mt-2.5 p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-700">
                      <span className="font-semibold text-slate-800">{t('registrations.feedback')}: </span>
                      <span>{reg.feedback}</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-3 mt-2 text-xs text-slate-400 font-mono">
                    <span>{t('registrations.registeredAt')}: {reg.registeredAt?.replace('T', ' ').substring(0, 16)}</span>
                    {reg.reviewedByLecturerName && <span>• {reg.reviewedByLecturerName}</span>}
                  </div>
                </div>

                {reg.status === 'PENDING' && (
                  <button
                    type="button"
                    onClick={() => handleCancelRegistration(reg.id)}
                    className={buttonClass.danger}
                  >
                    {t('common.cancel')}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </TableCard>

      {/* Lecturer: Review Applications for Topics */}
      {isLecturerOrAdmin && (
        <TableCard>
          <TableHeaderBar
            title={t('registrations.advisorReviewSection')}
            subtitle={t('registrations.desc')}
            actions={
              <div className="w-full sm:w-72">
                <select
                  value={selectedTopicId}
                  onChange={(e) => {
                    setSelectedTopicId(e.target.value);
                    fetchTopicRegistrations(e.target.value);
                  }}
                  className={selectClass}
                >
                  {advisorTopics.map((tItem) => (
                    <option key={tItem.id} value={tItem.id}>
                      {tItem.title}
                    </option>
                  ))}
                </select>
              </div>
            }
          />

          {topicRegistrations.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              {t('registrations.noTopicRegsFound')}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {topicRegistrations.map((reg) => (
                <div key={reg.id} className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-800 text-sm">{reg.teamName}</span>
                      <StatusBadge value={reg.status} />
                    </div>

                    {reg.message && (
                      <p className="text-xs text-slate-600 mt-1 italic leading-relaxed">
                        "{reg.message}"
                      </p>
                    )}

                    {/* Student Team Members List */}
                    {reg.members && reg.members.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100">
                        <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                          {t('registrations.members')} ({reg.members.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {reg.members.map((m) => (
                            <span
                              key={m.memberRecordId || m.userId}
                              className={`text-[11px] px-2 py-0.5 rounded-lg border font-medium flex items-center space-x-1 ${
                                m.roleInTeam === 'LEADER'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200 font-semibold'
                                  : 'bg-slate-50 text-slate-700 border-slate-200'
                              }`}
                            >
                              <span>{m.fullName} ({m.studentCode || 'N/A'})</span>
                              <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-black/5 font-mono">
                                {m.roleInTeam === 'LEADER' ? t('teams.leader') : t('teams.member')}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-slate-400 mt-2 font-mono">
                      {t('registrations.registeredAt')}: {reg.registeredAt?.replace('T', ' ').substring(0, 16)}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedReg(reg);
                        setReviewDecision('APPROVED');
                        setReviewModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      {t('registrations.approve')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedReg(reg);
                        setReviewDecision('REJECTED');
                        setReviewModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      {t('registrations.reject')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TableCard>
      )}

      {/* Review Modal */}
      <Modal
        isOpen={reviewModalOpen && !!selectedReg}
        onClose={() => setReviewModalOpen(false)}
        title={reviewDecision === 'APPROVED' ? t('registrations.approve') : t('registrations.reject')}
        maxWidth="max-w-md"
      >
        {selectedReg && (
          <form onSubmit={handleReviewSubmit} className="space-y-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">
                {t('registrations.team')}: <strong className="text-slate-800">{selectedReg.teamName}</strong>
              </p>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {t('registrations.reviewFeedbackLabel')}
              </label>
              <textarea
                rows={4}
                required
                placeholder={t('registrations.reviewFeedbackPlaceholder')}
                value={reviewFeedback}
                onChange={(e) => setReviewFeedback(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="pt-2 flex justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className={`px-4 py-2 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer ${
                  reviewDecision === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {t('registrations.saveDecision')}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default RegistrationsPage;

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  AlertTriangle,
  Send,
  MessageSquare,
  Users
} from 'lucide-react';
import registrationService from '../services/registrationService';
import topicService from '../services/topicService';
import { useAuth } from '../context/AuthContext';

export const RegistrationsPage = () => {
  const { user, hasRole } = useAuth();
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
    if (!window.confirm('Are you sure you want to cancel this registration?')) return;
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
    return <div className="py-16 text-center text-slate-400">Loading registrations...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Topic Registrations</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Track official registration periods, monitor approval decisions, and conduct advisor reviews.
        </p>
      </div>

      {/* Active Periods Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activePeriods.map((period) => (
          <div key={period.id} className="bg-white p-5 rounded-2xl border border-[#ebedf2] shadow-xs flex items-start space-x-3.5">
            <div className="p-2.5 rounded-xl bg-[#f8f2ff] border border-[#e1c2ff] text-[#b66dff]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-800 text-sm">{period.name}</h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700">
                  {period.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Academic Year {period.academicYear} • Semester {period.semester}
              </p>
              <div className="flex items-center space-x-3 mt-2 text-xs text-slate-500 font-mono">
                <span>Start: {period.startDate?.split('T')[0]}</span>
                <span>•</span>
                <span>Deadline: {period.submissionDeadline?.split('T')[0]}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Student: My Team's Registrations */}
      <div className="bg-white rounded-2xl border border-[#ebedf2] overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 text-base">My Team Submissions</h2>
          <p className="text-xs text-slate-400 mt-0.5">Formal registration proposals submitted by your team</p>
        </div>

        {teamRegistrations.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            Your team has not submitted any topic registrations yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {teamRegistrations.map((reg) => (
              <div key={reg.id} className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-800 text-sm">{reg.topicTitle}</span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                        reg.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : reg.status === 'REJECTED'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {reg.status}
                    </span>
                  </div>

                  {reg.feedback && (
                    <div className="mt-2 p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-600">
                      <span className="font-semibold text-slate-700">Advisor Note: </span>
                      {reg.feedback}
                    </div>
                  )}

                  <div className="flex items-center space-x-3 mt-2 text-xs text-slate-400 font-mono">
                    <span>Registered: {reg.registeredAt?.replace('T', ' ').substring(0, 16)}</span>
                    {reg.reviewedByLecturerName && <span>Reviewed by: {reg.reviewedByLecturerName}</span>}
                  </div>
                </div>

                {reg.status === 'PENDING' && (
                  <button
                    onClick={() => handleCancelRegistration(reg.id)}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold self-start md:self-center transition-colors"
                  >
                    Withdraw Registration
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lecturer: Review Applications for Topics */}
      {isLecturerOrAdmin && (
        <div className="bg-white rounded-2xl border border-[#ebedf2] overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-800 text-base">Advisor Review Portal</h2>
              <p className="text-xs text-slate-400 mt-0.5">Approve or reject student teams applying for your topics</p>
            </div>

            <div className="w-full sm:w-64">
              <select
                value={selectedTopicId}
                onChange={(e) => {
                  setSelectedTopicId(e.target.value);
                  fetchTopicRegistrations(e.target.value);
                }}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-[#b66dff]"
              >
                {advisorTopics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {topicRegistrations.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No student teams have registered for this topic yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {topicRegistrations.map((reg) => (
                <div key={reg.id} className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-800 text-sm">{reg.teamName}</span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                          reg.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : reg.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {reg.status}
                      </span>
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
                          Registered Members ({reg.members.length}):
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
                                {m.roleInTeam}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-slate-400 mt-2 font-mono">
                      Registered: {reg.registeredAt?.replace('T', ' ').substring(0, 16)}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedReg(reg);
                        setReviewDecision('APPROVED');
                        setReviewModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setSelectedReg(reg);
                        setReviewDecision('REJECTED');
                        setReviewModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Review Modal */}
      {reviewModalOpen && selectedReg && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">
                {reviewDecision === 'APPROVED' ? 'Approve Team Registration' : 'Reject Team Registration'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Team: {selectedReg.teamName}</p>
            </div>

            <form onSubmit={handleReviewSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Feedback / Advisory Guidance
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide instructions, meeting time, or feedback for the team..."
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-[#b66dff]"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white rounded-xl text-sm font-semibold shadow-xs ${
                    reviewDecision === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Confirm {reviewDecision}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationsPage;

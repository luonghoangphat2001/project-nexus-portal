import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  ArrowRightLeft,
  X,
  Users,
  Clock,
  BookOpen,
  CheckCircle,
  ExternalLink,
  GraduationCap
} from 'lucide-react';
import topicService from '../services/topicService';
import academicService from '../services/academicService';
import registrationService from '../services/registrationService';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';

export const TopicsPage = () => {
  const { user, hasRole } = useAuth();
  const { t } = useTranslation();
  const isLecturerOrAdmin = hasRole('ROLE_ADMIN') || hasRole('ROLE_TEACHER');

  // Topics list state
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedMajor, setSelectedMajor] = useState('');
  const [departments, setDepartments] = useState([]);
  const [majors, setMajors] = useState([]);

  // Comparison state (up to 3)
  const [compareList, setCompareList] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [comparing, setComparing] = useState(false);

  // Modals state
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(null);

  // Load departments and initial topics
  useEffect(() => {
    loadAcademicData();
    fetchTopics();
  }, []);

  const loadAcademicData = async () => {
    try {
      const [deptRes, majorRes] = await Promise.all([
        academicService.getAllDepartments(),
        academicService.getAllMajors(),
      ]);
      setDepartments(deptRes || []);
      setMajors(majorRes || []);
    } catch (err) {
      console.error('Failed to load academic data:', err);
    }
  };

  const fetchTopics = async (customPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        query: searchQuery || undefined,
        departmentId: selectedDept || undefined,
        majorId: selectedMajor || undefined,
        page: customPage,
        size: 9,
      };
      const res = await topicService.searchTopics(params);
      setTopics(res.content || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      setError(err.message || 'Failed to fetch topics');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchTopics(0);
  };

  const toggleCompare = (topic) => {
    if (compareList.some((t) => t.id === topic.id)) {
      setCompareList(compareList.filter((t) => t.id !== topic.id));
    } else {
      if (compareList.length >= 3) {
        alert('You can compare up to 3 topics at once.');
        return;
      }
      setCompareList([...compareList, topic]);
    }
  };

  const handleExecuteCompare = async () => {
    if (compareList.length < 2) {
      alert('Please select at least 2 topics to compare.');
      return;
    }
    try {
      const ids = compareList.map((t) => t.id);
      const res = await topicService.compareTopics(ids);
      setComparisonData(res.topics || []);
      setComparing(true);
    } catch (err) {
      alert(err.message || 'Comparison failed');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTopic) return;
    try {
      await registrationService.submitRegistration({
        topicId: selectedTopic.id,
        message: registrationMessage,
      });
      setRegisterSuccess('Registration submitted successfully for your team!');
      setTimeout(() => {
        setRegisterModalOpen(false);
        setRegisterSuccess(null);
        setRegistrationMessage('');
      }, 2000);
    } catch (err) {
      alert(err.message || 'Registration failed');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{t('topics.title')}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {t('topics.desc')}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {compareList.length > 0 && (
            <button
              onClick={handleExecuteCompare}
              className="px-4 py-2 bg-[#f8f2ff] hover:bg-[#f1e2ff] text-[#b66dff] font-semibold rounded-xl text-xs flex items-center space-x-2 transition-all shadow-xs"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>{t('topics.compareTopics')} ({compareList.length}/3)</span>
            </button>
          )}

          {isLecturerOrAdmin && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-[#da8cff] to-[#9a55ff] hover:opacity-90 text-white font-medium rounded-xl text-xs flex items-center space-x-2 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>{t('topics.proposeTopic')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#ebedf2] shadow-xs">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={t('topics.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-[#b66dff] transition-colors"
            />
          </div>

          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-[#b66dff] transition-colors"
            >
              <option value="">{t('common.all')} {t('topics.department')}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedMajor}
              onChange={(e) => setSelectedMajor(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-[#b66dff] transition-colors"
            >
              <option value="">{t('common.all')} {t('topics.major')}</option>
              {majors.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex space-x-2">
            <button
              type="submit"
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-medium transition-colors"
            >
              {t('common.filter')}
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedDept('');
                setSelectedMajor('');
                fetchTopics(0);
              }}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-medium transition-colors"
            >
              {t('common.reset')}
            </button>
          </div>
        </form>
      </div>

      {/* Topics Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">{t('common.loading')}</div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm">{error}</div>
      ) : topics.length === 0 ? (
        <div className="py-16 bg-white rounded-2xl border border-[#ebedf2] text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">{t('topics.noTopicsFound')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {topics.map((topic) => {
            const isSelectedForCompare = compareList.some((t) => t.id === topic.id);

            return (
              <div
                key={topic.id}
                className="bg-white rounded-2xl border border-[#ebedf2] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f8f2ff] text-[#b66dff] border border-[#e1c2ff]">
                      {topic.type?.replace('_', ' ') || 'CAPSTONE'}
                    </span>

                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        topic.status === 'OPEN'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {topic.status}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-slate-800 line-clamp-2 leading-snug">
                    {topic.title}
                  </h3>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                    {topic.description || 'No description provided.'}
                  </p>

                  {/* Target Majors Tags */}
                  {topic.majors && topic.majors.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {topic.majors.map((m) => (
                        <span
                          key={m.id}
                          className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-mono"
                        >
                          {m.code || m.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Advisors list */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center space-x-2 text-xs text-slate-600">
                    <GraduationCap className="w-4 h-4 text-[#b66dff] shrink-0" />
                    <div className="truncate">
                      <span className="font-medium text-slate-700">
                        {topic.advisors?.map((a) => a.lecturerName).join(', ') || 'Department Assigned'}
                      </span>
                    </div>
                  </div>

                  {/* Meta stats */}
                  <div className="flex items-center space-x-4 mt-2 text-[11px] text-slate-400">
                    <div className="flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>Max {topic.maxStudents || 3} students</span>
                    </div>
                    {topic.duration && (
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{topic.duration}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => toggleCompare(topic)}
                    className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors flex items-center space-x-1 ${
                      isSelectedForCompare
                        ? 'bg-[#f8f2ff] border-[#b66dff] text-[#b66dff]'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>{isSelectedForCompare ? 'Added' : 'Compare'}</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedTopic(topic)}
                      className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                    >
                      Details
                    </button>
                    {topic.status === 'OPEN' && (
                      <button
                        onClick={() => {
                          setSelectedTopic(topic);
                          setRegisterModalOpen(true);
                        }}
                        className="text-xs px-3 py-1.5 bg-gradient-to-r from-[#da8cff] to-[#9a55ff] hover:opacity-95 text-white rounded-lg font-medium transition-colors"
                      >
                        Register
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 pt-4">
          <button
            disabled={page === 0}
            onClick={() => {
              setPage(page - 1);
              fetchTopics(page - 1);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs text-slate-500 font-medium">
            Page {page + 1} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => {
              setPage(page + 1);
              fetchTopics(page + 1);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {/* Topic Details Modal */}
      {selectedTopic && !registerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-start justify-between">
              <div>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-[#f8f2ff] text-[#b66dff]">
                  {selectedTopic.type?.replace('_', ' ')}
                </span>
                <h2 className="text-lg font-bold text-slate-800 mt-2">{selectedTopic.title}</h2>
              </div>
              <button
                onClick={() => setSelectedTopic(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</h4>
                <p className="text-sm text-slate-700 mt-1 leading-relaxed whitespace-pre-wrap">
                  {selectedTopic.description || 'No detailed description available.'}
                </p>
              </div>

              {selectedTopic.objectives && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Objectives</h4>
                  <p className="text-sm text-slate-700 mt-1 leading-relaxed whitespace-pre-wrap">
                    {selectedTopic.objectives}
                  </p>
                </div>
              )}

              {selectedTopic.requirements && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Knowledge Requirements</h4>
                  <p className="text-sm text-slate-700 mt-1 leading-relaxed whitespace-pre-wrap">
                    {selectedTopic.requirements}
                  </p>
                </div>
              )}

              {/* Advisors section */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Advisors (GVHD)</h4>
                <div className="mt-2 space-y-1.5">
                  {selectedTopic.advisors?.map((adv, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs"
                    >
                      <div className="font-semibold text-slate-800">{adv.lecturerName}</div>
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-mono text-[10px]">
                        {adv.advisorRole === 'PRIMARY' ? 'Primary Advisor' : 'Co-Advisor'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Targeted Majors */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Eligible Majors</h4>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedTopic.majors?.map((m) => (
                    <span
                      key={m.id}
                      className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium"
                    >
                      {m.name} ({m.code})
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                onClick={() => setSelectedTopic(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50"
              >
                Close
              </button>
              {selectedTopic.status === 'OPEN' && (
                <button
                  onClick={() => setRegisterModalOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-[#da8cff] to-[#9a55ff] text-white text-sm font-medium rounded-xl hover:bg-brand-700"
                >
                  Register Team for Topic
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      {comparing && comparisonData && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Side-by-Side Topic Comparison</h2>
                <p className="text-xs text-slate-500 mt-0.5">Comparing {comparisonData.length} selected topics</p>
              </div>
              <button
                onClick={() => setComparing(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-x-auto max-h-[75vh]">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-3 px-4 text-left font-semibold text-slate-500 w-1/4">Criteria</th>
                    {comparisonData.map((t) => (
                      <th key={t.id} className="py-3 px-4 text-left font-bold text-slate-800">
                        {t.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-500">Topic Type</td>
                    {comparisonData.map((t) => (
                      <td key={t.id} className="py-3 px-4 text-slate-700">
                        {t.type}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-500">Advisors</td>
                    {comparisonData.map((t) => (
                      <td key={t.id} className="py-3 px-4 text-slate-700">
                        {t.advisors?.map((a) => a.lecturerName).join(', ') || 'N/A'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-500">Target Majors</td>
                    {comparisonData.map((t) => (
                      <td key={t.id} className="py-3 px-4 text-slate-700">
                        {t.majors?.map((m) => m.name).join(', ') || 'All'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-500">Requirements</td>
                    {comparisonData.map((t) => (
                      <td key={t.id} className="py-3 px-4 text-slate-600 text-xs leading-relaxed">
                        {t.requirements || 'N/A'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-500">Max Students</td>
                    {comparisonData.map((t) => (
                      <td key={t.id} className="py-3 px-4 text-slate-700">
                        {t.maxStudents || 3} members
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setComparing(false)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-900"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team Registration Modal */}
      {registerModalOpen && selectedTopic && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Submit Topic Registration</h3>
              <button
                onClick={() => setRegisterModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4">
              {registerSuccess ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>{registerSuccess}</span>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Topic</label>
                    <p className="text-sm font-semibold text-slate-800 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                      {selectedTopic.title}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Proposal / Motivation Note (Optional)
                    </label>
                    <textarea
                      rows={4}
                      value={registrationMessage}
                      onChange={(e) => setRegistrationMessage(e.target.value)}
                      placeholder="Explain your team's background, relevant projects, or motivation..."
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-[#b66dff]"
                    />
                  </div>

                  <div className="pt-2 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setRegisterModalOpen(false)}
                      className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-gradient-to-r from-[#da8cff] to-[#9a55ff] hover:opacity-95 text-white rounded-xl text-sm font-medium shadow-xs"
                    >
                      Submit Registration
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopicsPage;

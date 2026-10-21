import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  ArrowRightLeft,
  Users,
  Clock,
  BookOpen,
  GraduationCap,
  RotateCcw,
  CheckCircle,
} from 'lucide-react';
import topicService from '../services/topicService';
import academicService from '../services/academicService';
import registrationService from '../services/registrationService';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import {
  PageHeader,
  FilterCard,
  FilterField,
  StatusBadge,
  Pagination,
  Modal,
  EmptyState,
  inputClass,
  selectClass,
  buttonClass,
} from '../components/common/CommonUi';

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
    fetchTopics(0);
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
        alert(t('topics.selectUpTo3'));
        return;
      }
      setCompareList([...compareList, topic]);
    }
  };

  const handleExecuteCompare = async () => {
    if (compareList.length < 2) {
      alert(t('topics.selectUpTo3'));
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
      setRegisterSuccess(t('topics.registeredSuccess'));
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
      {/* Page Header with Inheritance */}
      <PageHeader
        title={t('topics.title')}
        description={t('topics.desc')}
        actions={
          <div className="flex items-center space-x-2.5">
            {compareList.length > 0 && (
              <button
                type="button"
                onClick={handleExecuteCompare}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-xl text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-xs"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>
                  {t('topics.compareTopics')} ({compareList.length}/3)
                </span>
              </button>
            )}

            {isLecturerOrAdmin && (
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className={buttonClass.primary}
              >
                <Plus className="w-4 h-4" />
                <span>{t('topics.proposeTopic')}</span>
              </button>
            )}
          </div>
        }
      />

      {/* Filter and Search Card */}
      <FilterCard
        onReset={() => {
          setSearchQuery('');
          setSelectedDept('');
          setSelectedMajor('');
          fetchTopics(0);
        }}
        onSearch={() => {
          setPage(0);
          fetchTopics(0);
        }}
      >
        <FilterField label={t('common.search') || 'Search'}>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder={t('topics.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${inputClass} pl-9`}
            />
          </div>
        </FilterField>

        <FilterField label={t('topics.allDepartments') || 'Department'}>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className={selectClass}
          >
            <option value="">{t('topics.allDepartments')}</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label={t('topics.allMajors') || 'Major'}>
          <select
            value={selectedMajor}
            onChange={(e) => setSelectedMajor(e.target.value)}
            className={selectClass}
          >
            <option value="">{t('topics.allMajors')}</option>
            {majors.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.code})
              </option>
            ))}
          </select>
        </FilterField>
      </FilterCard>

      {/* Topics Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 font-medium">{t('common.loading')}</div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm">{error}</div>
      ) : topics.length === 0 ? (
        <EmptyState message={t('topics.noTopicsFound')} icon={BookOpen} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {topics.map((topic) => {
            const isSelectedForCompare = compareList.some((t) => t.id === topic.id);

            return (
              <div
                key={topic.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <StatusBadge value={topic.type} type="topicType" />
                    <StatusBadge value={topic.status} />
                  </div>

                  <h3 className="text-base font-semibold text-slate-800 line-clamp-2 leading-snug">
                    {topic.title}
                  </h3>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                    {topic.description || t('topics.noDescription')}
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
                    <GraduationCap className="w-4 h-4 text-indigo-500 shrink-0" />
                    <div className="truncate">
                      <span className="font-medium text-slate-700">
                        {topic.advisors?.map((a) => a.lecturerName).join(', ') || t('topics.deptAssigned')}
                      </span>
                    </div>
                  </div>

                  {/* Meta stats */}
                  <div className="flex items-center space-x-4 mt-2 text-[11px] text-slate-400">
                    <div className="flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{t('topics.maxStudentsLabel', { count: topic.maxStudents || 3 })}</span>
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
                    type="button"
                    onClick={() => toggleCompare(topic)}
                    className={`text-xs px-2.5 py-1.5 rounded-xl border font-medium transition-colors flex items-center space-x-1 cursor-pointer ${
                      isSelectedForCompare
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>{isSelectedForCompare ? t('topics.added') : t('topics.compare')}</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTopic(topic)}
                      className={buttonClass.secondary}
                    >
                      {t('common.details')}
                    </button>
                    {topic.status === 'OPEN' && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTopic(topic);
                          setRegisterModalOpen(true);
                        }}
                        className={buttonClass.primary}
                      >
                        {t('topics.register')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination with Inheritance */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={(p) => {
          setPage(p);
          fetchTopics(p);
        }}
      />

      {/* Topic Details Modal */}
      <Modal
        isOpen={!!selectedTopic && !registerModalOpen}
        onClose={() => setSelectedTopic(null)}
        title={selectedTopic?.title || t('common.details')}
        maxWidth="max-w-2xl"
        footer={
          <div className="flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={() => setSelectedTopic(null)}
              className={buttonClass.secondary}
            >
              {t('common.close')}
            </button>
            {selectedTopic?.status === 'OPEN' && (
              <button
                type="button"
                onClick={() => setRegisterModalOpen(true)}
                className={buttonClass.primary}
              >
                {t('topics.registerTopic')}
              </button>
            )}
          </div>
        }
      >
        {selectedTopic && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <StatusBadge value={selectedTopic.type} type="topicType" />
              <StatusBadge value={selectedTopic.status} />
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('common.description')}</h4>
              <p className="text-sm text-slate-700 mt-1 leading-relaxed whitespace-pre-wrap">
                {selectedTopic.description || t('topics.noDescription')}
              </p>
            </div>

            {selectedTopic.requirements && (
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {t('topics.requirements')}
                </h4>
                <p className="text-sm text-slate-700 mt-1 leading-relaxed whitespace-pre-wrap">
                  {selectedTopic.requirements}
                </p>
              </div>
            )}

            {/* Advisors section */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('topics.instructor')}</h4>
              <div className="mt-2 space-y-1.5">
                {selectedTopic.advisors?.map((adv, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs"
                  >
                    <div className="font-semibold text-slate-800">{adv.lecturerName}</div>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-mono text-[10px]">
                      {adv.advisorRole === 'PRIMARY' ? t('defense.chair') : t('defense.reviewer')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Targeted Majors */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('topics.major')}</h4>
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
        )}
      </Modal>

      {/* Comparison Modal */}
      <Modal
        isOpen={comparing && !!comparisonData}
        onClose={() => setComparing(false)}
        title={t('topics.comparisonTitle')}
        maxWidth="max-w-5xl"
        footer={
          <button
            type="button"
            onClick={() => setComparing(false)}
            className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-medium hover:bg-slate-900 transition-colors cursor-pointer"
          >
            {t('common.close')}
          </button>
        }
      >
        {comparisonData && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm min-w-[650px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-3 px-4 text-left font-semibold text-slate-500 w-1/4">
                    {t('defense.rubric')}
                  </th>
                  {comparisonData.map((tItem) => (
                    <th key={tItem.id} className="py-3 px-4 text-left font-bold text-slate-800">
                      {tItem.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-500">{t('topics.topicType')}</td>
                  {comparisonData.map((tItem) => (
                    <td key={tItem.id} className="py-3 px-4 text-slate-700">
                      <StatusBadge value={tItem.type} type="topicType" />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-500">{t('topics.instructor')}</td>
                  {comparisonData.map((tItem) => (
                    <td key={tItem.id} className="py-3 px-4 text-slate-700">
                      {tItem.advisors?.map((a) => a.lecturerName).join(', ') || 'N/A'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-500">{t('topics.major')}</td>
                  {comparisonData.map((tItem) => (
                    <td key={tItem.id} className="py-3 px-4 text-slate-700">
                      {tItem.majors?.map((m) => m.name).join(', ') || t('common.all')}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-500">{t('topics.requirements')}</td>
                  {comparisonData.map((tItem) => (
                    <td key={tItem.id} className="py-3 px-4 text-slate-600 text-xs leading-relaxed">
                      {tItem.requirements || 'N/A'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-500">{t('topics.maxStudents')}</td>
                  {comparisonData.map((tItem) => (
                    <td key={tItem.id} className="py-3 px-4 text-slate-700">
                      {t('topics.maxStudentsLabel', { count: tItem.maxStudents || 3 })}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      {/* Team Registration Modal */}
      <Modal
        isOpen={registerModalOpen && !!selectedTopic}
        onClose={() => setRegisterModalOpen(false)}
        title={t('topics.confirmRegisterTitle')}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          {registerSuccess ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <span>{registerSuccess}</span>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{t('registrations.topic')}</label>
                <p className="text-sm font-semibold text-slate-800 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  {selectedTopic?.title}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {t('topics.registrationNote')}
                </label>
                <textarea
                  rows={4}
                  value={registrationMessage}
                  onChange={(e) => setRegistrationMessage(e.target.value)}
                  placeholder={t('topics.registrationNotePlaceholder')}
                  className={inputClass}
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setRegisterModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  {t('topics.submitRegistration')}
                </button>
              </div>
            </>
          )}
        </form>
      </Modal>
    </div>
  );
};

export default TopicsPage;

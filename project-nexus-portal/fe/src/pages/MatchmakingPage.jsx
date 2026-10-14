import React, { useState, useEffect } from 'react';
import {
  Compass,
  UserCheck,
  Plus,
  Send,
  Search,
} from 'lucide-react';
import matchmakingService from '../services/matchmakingService';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import {
  PageHeader,
  FilterCard,
  FilterField,
  TableCard,
  TableHeaderBar,
  StatusBadge,
  Modal,
  EmptyState,
  buttonClass,
  inputClass,
  selectClass,
} from '../components/common/CommonUi';

export const MatchmakingPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'candidates' | 'my-requests'

  // Posts State
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postTypeFilter, setPostTypeFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  // Candidates State
  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  // My Requests State
  const [myRequests, setMyRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Modals
  const [createPostModalOpen, setCreatePostModalOpen] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [applyMessage, setApplyMessage] = useState('');

  // New Post Form
  const [postTitle, setPostTitle] = useState('');
  const [postGoals, setPostGoals] = useState('');
  const [postType, setPostType] = useState('STUDENT_LOOKING_FOR_TEAM');
  const [slotsNeeded, setSlotsNeeded] = useState(1);
  const [skillsInput, setSkillsInput] = useState('');
  const [contactInfo, setContactInfo] = useState('');

  useEffect(() => {
    fetchPosts();
  }, [postTypeFilter]);

  useEffect(() => {
    if (activeTab === 'candidates') {
      fetchCandidates();
    } else if (activeTab === 'my-requests') {
      fetchMyRequests();
    }
  }, [activeTab]);

  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const res = await matchmakingService.getPosts({
        type: postTypeFilter || undefined,
        query: searchFilter || undefined,
      });
      setPosts(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPosts(false);
    }
  };

  const fetchCandidates = async () => {
    setLoadingCandidates(true);
    try {
      const res = await matchmakingService.getCandidates();
      setCandidates(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const fetchMyRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await matchmakingService.getMyJoinRequests();
      setMyRequests(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      const skillsArray = skillsInput
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      await matchmakingService.createPost({
        title: postTitle,
        goals: postGoals,
        postType,
        slotsNeeded: parseInt(slotsNeeded, 10),
        contactInfo,
        skills: skillsArray,
      });

      setCreatePostModalOpen(false);
      setPostTitle('');
      setPostGoals('');
      setSkillsInput('');
      setContactInfo('');
      fetchPosts();
    } catch (err) {
      alert(err.message || t('common.error'));
    }
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!selectedPost) return;
    try {
      await matchmakingService.submitJoinRequest(selectedPost.id, {
        message: applyMessage,
      });
      alert(t('matchmaking.applySuccess'));
      setApplyModalOpen(false);
      setSelectedPost(null);
      setApplyMessage('');
    } catch (err) {
      alert(err.message || t('common.error'));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <PageHeader
        title={t('matchmaking.title')}
        description={t('matchmaking.subtitle')}
        action={
          <button
            onClick={() => setCreatePostModalOpen(true)}
            className={buttonClass.primary}
          >
            <Plus className="w-4 h-4" />
            <span>{t('matchmaking.publishPost')}</span>
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start max-w-fit">
        <button
          onClick={() => setActiveTab('feed')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'feed'
              ? 'bg-white text-blue-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t('matchmaking.tabFeed')}
        </button>
        <button
          onClick={() => setActiveTab('candidates')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'candidates'
              ? 'bg-white text-blue-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t('matchmaking.tabCandidates')}
        </button>
        <button
          onClick={() => setActiveTab('my-requests')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'my-requests'
              ? 'bg-white text-blue-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t('matchmaking.tabMyRequests')}
        </button>
      </div>

      {/* Tab 1: Collaboration Feed */}
      {activeTab === 'feed' && (
        <div className="space-y-4">
          {/* Filter Card */}
          <FilterCard
            onReset={() => {
              setSearchFilter('');
              setPostTypeFilter('');
              fetchPosts();
            }}
            onSearch={fetchPosts}
          >
            <FilterField label={t('common.search') || 'Search'}>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder={t('matchmaking.searchPlaceholder')}
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className={`${inputClass} pl-9`}
                />
              </div>
            </FilterField>

            <FilterField label={t('matchmaking.postType') || 'Type'}>
              <select
                value={postTypeFilter}
                onChange={(e) => setPostTypeFilter(e.target.value)}
                className={selectClass}
              >
                <option value="">{t('matchmaking.allTypes')}</option>
                <option value="STUDENT_LOOKING_FOR_TEAM">{t('matchmaking.studentLooking')}</option>
                <option value="TEAM_LOOKING_FOR_MEMBER">{t('matchmaking.teamLooking')}</option>
              </select>
            </FilterField>
          </FilterCard>

          {/* Posts List */}
          {loadingPosts ? (
            <div className="py-12 text-center text-slate-400">{t('common.loading')}</div>
          ) : posts.length === 0 ? (
            <EmptyState
              icon={Compass}
              title={t('matchmaking.noPosts')}
              description={t('matchmaking.noPostsSub')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-2xl border border-[#ebedf2] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <StatusBadge value={post.postType} type="postType" />

                      <span className="text-[11px] text-slate-400 font-mono">
                        {post.createdAt?.replace('T', ' ').substring(0, 10)}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-800 text-base">{post.title}</h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{post.goals}</p>

                    {/* Skills */}
                    {post.skills && post.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {post.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-mono"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Author & Meta */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>{t('matchmaking.author')}: {post.authorName}</span>
                      <span>
                        {t('matchmaking.slots')}: {post.slotsNeeded} {t('matchmaking.slotsOpen')}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-mono truncate max-w-[200px]">
                      {t('matchmaking.contact')}: {post.contactInfo}
                    </span>

                    {post.authorId !== user?.id && post.status === 'OPEN' && (
                      <button
                        onClick={() => {
                          setSelectedPost(post);
                          setApplyModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-gradient-to-r from-[#da8cff] to-[#9a55ff] hover:opacity-95 text-white rounded-xl text-xs font-semibold flex items-center space-x-1 shadow-xs cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>{t('matchmaking.applyBtn')}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Candidates Directory */}
      {activeTab === 'candidates' && (
        <div className="space-y-4">
          {loadingCandidates ? (
            <div className="py-12 text-center text-slate-400">{t('common.loading')}</div>
          ) : candidates.length === 0 ? (
            <EmptyState
              icon={UserCheck}
              title={t('matchmaking.noCandidates')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {candidates.map((cand) => (
                <div
                  key={cand.userId}
                  className="bg-white rounded-2xl border border-[#ebedf2] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm">
                        {cand.fullName?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{cand.fullName}</h4>
                        <p className="text-xs text-slate-400 font-mono">MSSV: {cand.studentCode || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 space-y-1 mb-3">
                      <p>
                        <span className="font-semibold text-slate-600">{t('matchmaking.major')}:</span> {cand.major || 'Software Eng.'}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-600">{t('matchmaking.cohort')}:</span> {cand.cohort || 'K21'}
                      </p>
                      {cand.goals && (
                        <p className="italic text-slate-600 line-clamp-2 mt-1">"{cand.goals}"</p>
                      )}
                    </div>

                    {cand.skills && cand.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {cand.skills.map((s, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-mono"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 truncate max-w-[150px]">{cand.email}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: My Applications */}
      {activeTab === 'my-requests' && (
        <TableCard>
          <TableHeaderBar
            title={t('matchmaking.myRequestsTitle')}
            count={myRequests.length}
            subtitle={t('matchmaking.myRequestsSub')}
          />

          {loadingRequests ? (
            <div className="p-12 text-center text-slate-400">{t('common.loading')}</div>
          ) : myRequests.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              {t('matchmaking.noRequests')}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {myRequests.map((req) => (
                <div key={req.id} className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div>
                    <div className="flex items-center space-x-2.5">
                      <span className="font-bold text-slate-900 text-base">{req.postTitle}</span>
                      <StatusBadge value={req.status} type="status" />
                    </div>
                    {req.message && <p className="text-sm text-slate-600 mt-1.5 italic">"{req.message}"</p>}
                    <p className="text-xs text-slate-400 font-mono mt-1">
                      {t('matchmaking.submitted')}: {req.createdAt?.replace('T', ' ').substring(0, 16)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TableCard>
      )}

      {/* Publish Post Modal */}
      <Modal
        isOpen={createPostModalOpen}
        onClose={() => setCreatePostModalOpen(false)}
        title={t('matchmaking.modalCreateTitle')}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreatePost} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">{t('matchmaking.postType')}</label>
            <select
              value={postType}
              onChange={(e) => setPostType(e.target.value)}
              className={selectClass}
            >
              <option value="STUDENT_LOOKING_FOR_TEAM">{t('matchmaking.studentLooking')}</option>
              <option value="TEAM_LOOKING_FOR_MEMBER">{t('matchmaking.teamLooking')}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">{t('matchmaking.postTitle')}</label>
            <input
              type="text"
              required
              placeholder={t('matchmaking.placeholderTitle')}
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">{t('matchmaking.objectives')}</label>
            <textarea
              rows={3}
              required
              placeholder={t('matchmaking.placeholderObjectives')}
              value={postGoals}
              onChange={(e) => setPostGoals(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              {t('matchmaking.requiredSkills')}
            </label>
            <input
              type="text"
              placeholder="React, Spring Boot, Python, Docker"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">{t('matchmaking.slotsNeeded')}</label>
              <input
                type="number"
                min="1"
                max="3"
                value={slotsNeeded}
                onChange={(e) => setSlotsNeeded(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">{t('matchmaking.contactInfo')}</label>
              <input
                type="text"
                required
                placeholder={t('matchmaking.placeholderContact')}
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setCreatePostModalOpen(false)}
              className={buttonClass.secondary}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className={buttonClass.primary}
            >
              {t('matchmaking.publishPost')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Apply to Post Modal */}
      <Modal
        isOpen={applyModalOpen && !!selectedPost}
        onClose={() => setApplyModalOpen(false)}
        title={t('matchmaking.modalApplyTitle')}
      >
        <form onSubmit={handleApplySubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">{t('matchmaking.targetPost')}</label>
            <p className="text-sm font-semibold text-slate-800 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              {selectedPost?.title}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              {t('matchmaking.introPitch')}
            </label>
            <textarea
              rows={4}
              required
              placeholder={t('matchmaking.placeholderPitch')}
              value={applyMessage}
              onChange={(e) => setApplyMessage(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setApplyModalOpen(false)}
              className={buttonClass.secondary}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className={buttonClass.primary}
            >
              {t('matchmaking.submitApplication')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MatchmakingPage;

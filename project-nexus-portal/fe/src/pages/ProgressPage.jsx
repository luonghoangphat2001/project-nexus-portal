import React, { useEffect, useState } from 'react';
import { Plus, CheckCircle2, Clock, AlertTriangle, MessageSquare, Edit2, Trash2, Users, BarChart3, GripVertical } from 'lucide-react';
import { progressService } from '../services/progressService';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import { formatApiError } from '../utils/errorHandler';
import {
  PageHeader,
  FilterCard,
  FilterField,
  StatusBadge,
  Modal,
  Banner,
  buttonClass,
  inputClass,
  selectClass
} from '../components/common/CommonUi';

export function ProgressPage() {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const [teams, setTeams] = useState([]);
  const [teamId, setTeamId] = useState('');
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(null);
  const [review, setReview] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Drag and drop state
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  const team = teams.find(item => String(item.id) === teamId);

  useEffect(() => {
    let active = true;
    progressService.getTeams()
      .then(items => {
        if (active) {
          setTeams(items);
          setTeamId(items.length ? String(items[0].id) : '');
        }
      })
      .catch(err => {
        if (active) setError(err.message || t('common.error'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [t]);

  useEffect(() => {
    let active = true;
    setTasks([]);
    setForm(null);
    setReview(null);
    if (!teamId) return () => { active = false; };
    setLoading(true);
    setError('');
    progressService.getTasks(teamId)
      .then(items => { if (active) setTasks(items); })
      .catch(err => { if (active) setError(err.message || t('common.error')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [teamId, t]);

  async function act(action, message) {
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await action();
      setTasks(await progressService.getTasks(teamId));
      setSuccess(message);
      return true;
    } catch (err) {
      setError(err.message || t('common.error'));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function save(event) {
    event.preventDefault();
    const payload = {
      title: form.title,
      description: form.description || '',
      dueDate: form.dueDate,
      assigneeId: Number(form.assigneeId),
    };
    if (await act(() => form.id ? progressService.update(teamId, form.id, payload) : progressService.create(teamId, payload), t('progress.savedTask'))) {
      setForm(null);
    }
  }

  const canDragTask = (task) => {
    return team && (team.canManage || String(task.assigneeId) === String(user?.id));
  };

  const handleDragStart = (e, task) => {
    if (!canDragTask(task)) {
      e.preventDefault();
      return;
    }
    setDraggedTaskId(task.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(task.id));
  };

  const handleDragOver = (e, colKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== colKey) {
      setDragOverCol(colKey);
    }
  };

  const handleDragLeave = (e, colKey) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    if (dragOverCol === colKey) {
      setDragOverCol(null);
    }
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    setDragOverCol(null);

    const taskIdStr = e.dataTransfer.getData('text/plain') || String(draggedTaskId);
    const taskId = Number(taskIdStr);
    setDraggedTaskId(null);

    if (!taskId) return;

    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask || targetTask.status === targetStatus) return;

    // Optimistic UI update for smooth instant transition
    const previousTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t))
    );

    try {
      await progressService.updateStatus(taskId, targetStatus);
      setSuccess(t('progress.statusUpdated', 'Cập nhật trạng thái thành công!'));
    } catch (err) {
      setTasks(previousTasks);
      setError(formatApiError(err, language));
    }
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverCol(null);
  };

  const completed = tasks.filter(task => task.status === 'DONE').length;
  const inProgress = tasks.filter(task => task.status === 'IN_PROGRESS').length;
  const overdueCount = tasks.filter(task => task.overdue).length;
  const percent = tasks.length ? Math.round(completed * 100 / tasks.length) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('progress.title')}
        description={t('progress.subtitle')}
        action={
          team?.canManage ? (
            <button
              onClick={() => setForm({ title: '', description: '', dueDate: '', assigneeId: team?.members?.[0]?.id || '' })}
              disabled={busy || loading}
              className={buttonClass('primary')}
            >
              <Plus className="w-4 h-4" />
              <span>{t('progress.addTask')}</span>
            </button>
          ) : null
        }
      />

      <Banner error={error} success={success} />

      {/* Select Team & Overview Progress Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs transition-all">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Left Column: Team Selector */}
          <div className="lg:col-span-5 space-y-2">
            <label className="block text-sm font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>{t('progress.teamLabel')}</span>
            </label>
            <div className="relative">
              <select
                className={selectClass}
                disabled={busy || loading}
                value={teamId}
                onChange={event => { setTeamId(event.target.value); setSuccess(''); }}
              >
                <option value="">-- {t('progress.selectTeam')} --</option>
                {teams.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} — {item.periodName}
                  </option>
                ))}
              </select>
            </div>
            {team?.members && team.members.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-xs text-slate-400 font-medium mr-1">{t('common.members', 'Thành viên')}:</span>
                {team.members.map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/60"
                  >
                    {m.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Progress & Metric Strip */}
          <div className="lg:col-span-7">
            {team ? (
              <div className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-bold text-slate-800">
                      {t('progress.progressSummary', 'Tiến độ hoàn thành')}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 font-mono">
                      ({completed}/{tasks.length} {t('progress.tasksCompleted')})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {overdueCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{overdueCount} {t('progress.overdue')}</span>
                      </span>
                    )}
                    <span className="text-base font-bold font-mono text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-100">
                      {percent}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div
                  role="progressbar"
                  aria-label="Completed tasks"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={percent}
                  className="h-2.5 rounded-full bg-slate-200 overflow-hidden"
                >
                  <div
                    style={{ width: `${percent}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
                  />
                </div>

                {/* Metric chips */}
                <div className="flex flex-wrap items-center gap-3 text-xs pt-0.5 text-slate-600 font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    <span>{t('progress.status.TODO', 'Cần làm')}: {tasks.filter(t => t.status === 'TODO').length}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span>{t('progress.status.IN_PROGRESS', 'Đang làm')}: {inProgress}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>{t('progress.status.DONE', 'Hoàn thành')}: {completed}</span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[90px] flex items-center justify-center rounded-xl border border-dashed border-slate-200 p-4 text-xs text-slate-400">
                {t('progress.selectTeamPrompt', 'Vui lòng chọn nhóm để xem tiến độ và bảng công việc.')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Advisor Feedback Modal */}
      <Modal
        isOpen={!!review}
        onClose={() => setReview(null)}
        title={`${t('progress.advisorFeedback')}: ${review?.title || ''}`}
      >
        <form
          className="space-y-4"
          onSubmit={async event => {
            event.preventDefault();
            if (await act(() => progressService.review(review.id, review.feedback), t('progress.savedFeedback'))) {
              setReview(null);
            }
          }}
        >
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              {t('progress.advisorFeedback')}
            </label>
            <textarea
              className={inputClass}
              rows={4}
              required
              maxLength={10000}
              value={review?.feedback || ''}
              onChange={event => setReview({ ...review, feedback: event.target.value })}
              placeholder={t('progress.advisorFeedback')}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className={buttonClass('secondary')}
              disabled={busy}
              onClick={() => setReview(null)}
            >
              {t('common.cancel')}
            </button>
            <button type="submit" className={buttonClass('primary')} disabled={busy}>
              {t('progress.saveFeedback')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Task Form Modal */}
      <Modal
        isOpen={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? t('common.edit') : t('progress.addTask')}
      >
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              {t('progress.fieldTitle')} *
            </label>
            <input
              required
              maxLength={150}
              className={inputClass}
              value={form?.title || ''}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder={t('progress.fieldTitle')}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              {t('progress.fieldDesc')}
            </label>
            <textarea
              rows={3}
              maxLength={10000}
              className={inputClass}
              value={form?.description || ''}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder={t('progress.fieldDesc')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                {t('progress.fieldDueDate')} *
              </label>
              <input
                type="date"
                required
                className={inputClass}
                value={form?.dueDate || ''}
                onChange={e => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                {t('progress.fieldAssignee')} *
              </label>
              <select
                required
                className={selectClass}
                value={form?.assigneeId || ''}
                onChange={e => setForm({ ...form, assigneeId: e.target.value })}
              >
                <option value="">-- {t('progress.fieldAssignee')} --</option>
                {team?.members?.map(m => (
                  <option key={m.id} value={m.id}>{m.name || m.fullName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              className={buttonClass('secondary')}
              disabled={busy}
              onClick={() => setForm(null)}
            >
              {t('common.cancel')}
            </button>
            <button type="submit" className={buttonClass('primary')} disabled={busy}>
              {t('common.save')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Kanban Board Columns */}
      {team && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4 py-2.5 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900 shadow-xs">
            <span className="font-medium flex items-center gap-1.5">
              <GripVertical className="w-4 h-4 text-blue-600 shrink-0" />
              {t('progress.dragGuide', 'Bạn có thể kéo thả thẻ công việc giữa các cột để chuyển trạng thái nhanh')}
            </span>
            <span className="text-[11px] text-blue-700 font-mono font-semibold hidden sm:inline">TODO ⇄ IN_PROGRESS ⇄ DONE</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { key: 'TODO', title: t('enums.status.TODO', 'To Do'), color: 'bg-slate-50 border-slate-200' },
              { key: 'IN_PROGRESS', title: t('enums.status.IN_PROGRESS', 'In Progress'), color: 'bg-blue-50/40 border-blue-100' },
              { key: 'DONE', title: t('enums.status.DONE', 'Done'), color: 'bg-emerald-50/40 border-emerald-100' },
            ].map(col => {
              const statusTasks = tasks.filter(task => task.status === col.key);
              const isOver = dragOverCol === col.key;
              return (
                <div
                  key={col.key}
                  onDragOver={(e) => handleDragOver(e, col.key)}
                  onDragLeave={(e) => handleDragLeave(e, col.key)}
                  onDrop={(e) => handleDrop(e, col.key)}
                  className={`rounded-2xl border ${col.color} p-4 flex flex-col min-h-[450px] transition-all duration-200 ${
                    isOver ? 'ring-2 ring-blue-500 bg-blue-50/90 shadow-md scale-[1.01]' : ''
                  }`}
                >
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80">
                    <h2 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
                      {col.title}
                    </h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 font-semibold shadow-xs">
                      {statusTasks.length}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto min-h-[220px]">
                    {statusTasks.map(task => {
                      const draggable = canDragTask(task);
                      const isDragging = draggedTaskId === task.id;
                      return (
                        <article
                          key={task.id}
                          draggable={draggable}
                          onDragStart={(e) => handleDragStart(e, task)}
                          onDragEnd={handleDragEnd}
                          className={`rounded-xl bg-white border border-slate-200/90 p-4 shadow-xs hover:shadow-sm transition-all space-y-3 ${
                            draggable ? 'cursor-grab active:cursor-grabbing hover:border-blue-400' : ''
                          } ${
                            isDragging ? 'opacity-40 rotate-1 scale-95 border-dashed border-blue-500' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                              {draggable && (
                                <GripVertical className="w-3.5 h-3.5 text-slate-400 shrink-0 cursor-grab hover:text-slate-600" />
                              )}
                              <h3 className="font-semibold text-slate-900 text-sm leading-snug truncate">
                                {task.title}
                              </h3>
                            </div>
                            <StatusBadge value={task.status} type="status" />
                          </div>

                          {task.description && (
                            <p className="whitespace-pre-wrap text-sm text-slate-600 line-clamp-3 leading-relaxed">
                              {task.description}
                            </p>
                          )}

                          <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
                            <span className="font-medium text-slate-700">{task.assigneeName}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{task.dueDate}</span>
                              {task.overdue && (
                                <span className="text-rose-600 font-semibold">({t('progress.overdue')})</span>
                              )}
                            </span>
                          </div>

                          {/* Status quick select */}
                          {(team.canManage || String(task.assigneeId) === String(user?.id)) && (
                            <select
                              aria-label={`Status for ${task.title}`}
                              className={`${selectClass} py-1.5 text-xs bg-slate-50`}
                              value={task.status}
                              disabled={busy || loading}
                              onChange={event => act(() => progressService.updateStatus(task.id, event.target.value), t('progress.statusUpdated'))}
                            >
                              {['TODO', 'IN_PROGRESS', 'DONE'].map(value => (
                                <option key={value} value={value}>
                                  {t(`enums.status.${value}`, value.replaceAll('_', ' '))}
                                </option>
                              ))}
                            </select>
                          )}

                          {/* Feedback box */}
                          {task.feedback && (
                            <div className="rounded-xl bg-blue-50/70 border border-blue-200/80 p-3 text-xs text-slate-700">
                              <div className="flex items-center gap-1.5 font-semibold text-blue-700 mb-1">
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>{t('progress.advisorFeedback')}:</span>
                              </div>
                              <p className="whitespace-pre-wrap leading-relaxed">{task.feedback}</p>
                            </div>
                          )}

                          {/* Card Action buttons */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                            {team.canManage && (
                              <div className="flex items-center gap-2">
                                <button
                                  disabled={busy}
                                  className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
                                  onClick={() => setForm({ ...task })}
                                >
                                  <Edit2 className="w-3 h-3" />
                                  <span>{t('common.edit')}</span>
                                </button>
                                <button
                                  disabled={busy}
                                  className="text-rose-600 hover:text-rose-700 font-medium inline-flex items-center gap-1"
                                  onClick={() => {
                                    if (window.confirm(`${t('progress.confirmDelete')} (${task.title})`)) {
                                      act(() => progressService.delete(task.id), t('progress.taskDeleted'));
                                    }
                                  }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>{t('common.delete')}</span>
                                </button>
                              </div>
                            )}
                            {team.canReview && (
                              <button
                                disabled={busy}
                                className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1 ml-auto"
                                onClick={() => setReview({ id: task.id, title: task.title, feedback: task.feedback || '' })}
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>{t('progress.advisorFeedback')}</span>
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    })}

                    {statusTasks.length === 0 && (
                      <div
                        className={`h-32 border-2 border-dashed rounded-xl flex items-center justify-center text-xs text-center p-3 transition-colors ${
                          isOver
                            ? 'border-blue-400 bg-blue-100/50 text-blue-700 font-semibold shadow-inner'
                            : 'border-slate-200 text-slate-400'
                        }`}
                      >
                        {isOver ? t('progress.dragDropHint', 'Thả công việc vào đây') : t('progress.noTasks')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && !teams.length && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 text-sm">
          {t('progress.noTeams')}
        </div>
      )}
    </div>
  );
}

export default ProgressPage;

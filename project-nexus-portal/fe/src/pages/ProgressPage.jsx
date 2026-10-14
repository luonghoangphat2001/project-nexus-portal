import React, { useEffect, useState } from 'react';
import { progressService } from '../services/progressService';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import { ModuleShell, RecordForm, Field, inputClass, buttonClass, StatusBadge } from '../components/common/ModuleUi';

export function ProgressPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [teams, setTeams] = useState([]);
  const [teamId, setTeamId] = useState('');
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(null);
  const [review, setReview] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

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

  const fields = [
    { name: 'title', label: t('progress.fieldTitle'), maxLength: 150 },
    { name: 'description', label: t('progress.fieldDesc'), required: false, maxLength: 10000 },
    { name: 'dueDate', label: t('progress.fieldDueDate'), type: 'date' },
    { name: 'assigneeId', label: t('progress.fieldAssignee'), options: team?.members || [] },
  ];

  const completed = tasks.filter(task => task.status === 'DONE').length;
  const percent = tasks.length ? Math.round(completed * 100 / tasks.length) : 0;

  return (
    <ModuleShell
      title={t('progress.title')}
      description={t('progress.subtitle')}
      error={error}
      success={success}
      loading={loading}
    >
      <Field label={t('progress.teamLabel')}>
        <select
          className={inputClass}
          disabled={busy || loading}
          value={teamId}
          onChange={event => { setTeamId(event.target.value); setSuccess(''); }}
        >
          <option value="">{t('progress.selectTeam')}</option>
          {teams.map(item => (
            <option key={item.id} value={item.id}>
              {item.name} — {item.periodName}
            </option>
          ))}
        </select>
      </Field>

      {team && (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="mb-3 flex justify-between text-sm">
              <span className="font-medium text-slate-700">
                {completed}/{tasks.length} {t('progress.tasksCompleted')} ({percent}%)
              </span>
              <span className="text-rose-600 font-medium">
                {tasks.filter(task => task.overdue).length} {t('progress.overdue')}
              </span>
            </div>
            <div
              role="progressbar"
              aria-label="Completed tasks"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              className="h-2.5 rounded-full bg-slate-100 overflow-hidden"
            >
              <div
                style={{ width: `${percent}%` }}
                className="h-full rounded-full bg-gradient-to-r from-[#da8cff] to-[#9a55ff] transition-all duration-300"
              />
            </div>
          </div>

          {team.canManage && (
            <button
              className={buttonClass}
              disabled={busy || loading}
              onClick={() => setForm({ title: '', description: '', dueDate: '', assigneeId: '' })}
            >
              {t('progress.addTask')}
            </button>
          )}

          {form && (
            <RecordForm
              fields={fields}
              busy={busy}
              value={form}
              onChange={setForm}
              onSubmit={save}
              onCancel={() => setForm(null)}
              editing={!!form.id}
            />
          )}

          {review && (
            <form
              className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
              onSubmit={async event => {
                event.preventDefault();
                if (await act(() => progressService.review(review.id, review.feedback), t('progress.savedFeedback'))) {
                  setReview(null);
                }
              }}
            >
              <Field label={`${t('progress.advisorFeedback')}: ${review.title}`}>
                <textarea
                  className={inputClass}
                  rows={3}
                  required
                  maxLength={10000}
                  value={review.feedback}
                  onChange={event => setReview({ ...review, feedback: event.target.value })}
                />
              </Field>
              <div className="flex gap-3">
                <button className={buttonClass} disabled={busy}>
                  {t('progress.saveFeedback')}
                </button>
                <button
                  type="button"
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 cursor-pointer"
                  disabled={busy}
                  onClick={() => setReview(null)}
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            {['TODO', 'IN_PROGRESS', 'DONE'].map(status => {
              const statusTasks = tasks.filter(task => task.status === status);
              return (
                <div key={status} className="space-y-3 rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <h2 className="text-sm font-bold text-slate-800">
                      {t(`enums.status.${status}`, status.replaceAll('_', ' '))}
                    </h2>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono font-medium">
                      {statusTasks.length}
                    </span>
                  </div>

                  {statusTasks.map(task => (
                    <article key={task.id} className="space-y-3 rounded-xl bg-white border border-slate-200 p-4 shadow-xs hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-slate-800 text-sm">{task.title}</h3>
                        <StatusBadge value={task.status} type="status" />
                      </div>
                      {task.description && (
                        <p className="whitespace-pre-wrap text-xs text-slate-600 leading-relaxed">
                          {task.description}
                        </p>
                      )}
                      <div className="text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-100 flex items-center justify-between">
                        <span>{task.assigneeName}</span>
                        <span>
                          {task.dueDate}
                          {task.overdue && <span className="ml-1 text-rose-600 font-semibold font-sans">({t('progress.overdue')})</span>}
                        </span>
                      </div>

                      {(team.canManage || String(task.assigneeId) === String(user?.id)) && (
                        <select
                          aria-label={`Status for ${task.title}`}
                          className={`${inputClass} text-xs py-1.5`}
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

                      {task.feedback && (
                        <div className="whitespace-pre-wrap rounded-xl bg-brand-50 border border-[#e1c2ff] p-3 text-xs text-slate-700">
                          <span className="font-semibold text-[#b66dff] block mb-1">{t('progress.advisorFeedback')}:</span>
                          {task.feedback}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3 text-xs pt-2 border-t border-slate-100">
                        {team.canManage && (
                          <>
                            <button
                              disabled={busy}
                              className="text-[#b66dff] hover:underline font-medium cursor-pointer"
                              onClick={() => setForm({ ...task })}
                            >
                              {t('common.edit')}
                            </button>
                            <button
                              disabled={busy}
                              className="text-rose-600 hover:underline font-medium cursor-pointer"
                              onClick={() => {
                                if (window.confirm(`${t('progress.confirmDelete')} (${task.title})`)) {
                                  act(() => progressService.delete(task.id), t('progress.taskDeleted'));
                                }
                              }}
                            >
                              {t('common.delete')}
                            </button>
                          </>
                        )}
                        {team.canReview && (
                          <button
                            disabled={busy}
                            className="text-[#b66dff] hover:underline font-medium cursor-pointer"
                            onClick={() => setReview({ id: task.id, title: task.title, feedback: task.feedback || '' })}
                          >
                            {t('progress.advisorFeedback')}
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              );
            })}
          </div>

          {!loading && !tasks.length && (
            <p className="text-slate-500 text-sm text-center py-6">{t('progress.noTasks')}</p>
          )}
        </>
      )}

      {!loading && !teams.length && (
        <p className="text-slate-500 text-sm text-center py-8">{t('progress.noTeams')}</p>
      )}
    </ModuleShell>
  );
}

export default ProgressPage;

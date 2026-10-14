import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import councilService from '../services/councilService';
import assessmentService from '../services/assessmentService';
import { AssessmentForm } from '../components/common/AssessmentForm';
import { useTranslation } from '../i18n/LanguageContext';
import { Banner, Button, Empty, Field, Panel, formatDate, inputClass } from '../components/common/DefenseUi';
import { StatusBadge } from '../components/common/CommonUi';

export function AssessmentsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const requestedId = params.get('assignmentId');
  const [councils, setCouncils] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [scores, setScores] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [type, setType] = useState('DEFENSE');
  const [loading, setLoading] = useState(true);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [scoresReady, setScoresReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refresh, setRefresh] = useState(0);

  const assignments = councils.flatMap((c) => c.assignments.map((a) => ({ ...a, council: c })));
  const selected = assignments.find((a) => String(a.id) === selectedId);
  const ownScore = scores.find((s) => String(s.studentId) === studentId && s.type === type && s.evaluatorId === user?.id);
  const canEvaluate = selected && (type === 'REVIEW' ? selected.canReview : selected.canDefense);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    councilService.getCouncils()
      .then((data) => {
        if (!active) return;
        const eligible = data.filter((c) => c.canManage || c.members.some((m) => m.lecturerId === user?.id));
        setCouncils(eligible);
        const all = eligible.flatMap((c) => c.assignments);
        setSelectedId((id) => all.some((a) => String(a.id) === (id || requestedId)) ? (id || requestedId) : String(all[0]?.id || ''));
      })
      .catch((e) => {
        if (active) setError(e.message || t('common.error'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [refresh, user?.id, requestedId, t]);

  useEffect(() => {
    let active = true;
    setScores([]);
    setScoresReady(false);
    if (!selectedId) {
      setScoreLoading(false);
      return () => { active = false; };
    }
    setScoreLoading(true);
    setError('');
    assessmentService.getAssessments(selectedId)
      .then((data) => {
        if (active) {
          setScores(data);
          setScoresReady(true);
        }
      })
      .catch((e) => {
        if (active) setError(e.message || t('common.error'));
      })
      .finally(() => {
        if (active) setScoreLoading(false);
      });
    return () => { active = false; };
  }, [selectedId, refresh, t]);

  useEffect(() => {
    const current = councils.flatMap((c) => c.assignments).find((a) => String(a.id) === selectedId);
    setStudentId((id) => current?.registration.students.some((s) => String(s.id) === id) ? id : String(current?.registration.students[0]?.id || ''));
    if (!current?.canReview) setType('DEFENSE');
  }, [selectedId, councils]);

  const action = async (execute, message) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await execute();
      setNotice(message);
      setRefresh((n) => n + 1);
    } catch (e) {
      setError(e.message || t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{t('assessments.title')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('assessments.subtitle')}</p>
        </div>
        <Button secondary disabled={busy || loading} onClick={() => setRefresh((n) => n + 1)}>
          <RefreshCw size={16} />
          <span>{t('assessments.refresh')}</span>
        </Button>
      </div>

      <Banner error={error} notice={notice} />

      {loading ? (
        <Empty>{t('common.loading')}</Empty>
      ) : assignments.length === 0 ? (
        <Panel><Empty>{t('assessments.noAssignedTeams')}</Empty></Panel>
      ) : (
        <>
          <Panel>
            <Field label={t('assessments.selectCouncilTeam')}>
              <select
                className={inputClass}
                disabled={busy}
                value={selectedId}
                onChange={(e) => { setSelectedId(e.target.value); setNotice(''); }}
              >
                {assignments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.council.name} · {a.registration.teamName} · {a.registration.topicTitle}
                  </option>
                ))}
              </select>
            </Field>

            {selected && (
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <StatusBadge value={selected.council.status} type="status" />
                <span>
                  {selected.council.room} · {formatDate(selected.council.startsAt)} (Vietnam time, UTC+7)
                </span>
                <Link className="text-[#b66dff] hover:underline font-medium" to={`/reports?registrationId=${selected.registration.id}`}>
                  {t('assessments.viewDocuments')}
                </Link>
              </div>
            )}
          </Panel>

          {selected && (selected.canDefense || selected.canReview) && scoresReady && !scoreLoading && (
            <Panel className="space-y-4">
              <h2 className="font-semibold text-slate-800">{t('assessments.yourAssessment')}</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label={t('assessments.student')}>
                  <select className={inputClass} disabled={busy} value={studentId} onChange={(e) => setStudentId(e.target.value)}>
                    {selected.registration.students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} · {s.studentCode || s.id}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label={t('assessments.assessmentType')}>
                  <select className={inputClass} disabled={busy} value={type} onChange={(e) => setType(e.target.value)}>
                    {selected.canDefense && <option value="DEFENSE">{t('assessments.defenseAssessment')}</option>}
                    {selected.canReview && <option value="REVIEW">{t('assessments.reviewAssessment')}</option>}
                  </select>
                </Field>
              </div>

              {ownScore?.status === 'SUBMITTED' ? (
                <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-xl font-medium">
                  {t('assessments.submittedNotice')}
                </p>
              ) : (
                canEvaluate && studentId && (
                  <AssessmentForm
                    key={`${selectedId}-${studentId}-${type}-${ownScore?.updatedAt || 'new'}`}
                    score={ownScore}
                    busy={busy}
                    onSave={(data) =>
                      action(
                        () =>
                          assessmentService.saveDraft({
                            ...data,
                            assignmentId: Number(selectedId),
                            studentId: Number(studentId),
                            type,
                          }),
                        t('assessments.saveDraftSuccess')
                      )
                    }
                  />
                )
              )}
            </Panel>
          )}

          <Panel>
            <h2 className="font-semibold text-slate-800">{t('assessments.evaluationsList')}</h2>
            <p className="mt-1 text-xs text-slate-500">{t('assessments.evaluationsSub')}</p>

            {scoreLoading ? (
              <Empty>{t('common.loading')}</Empty>
            ) : !scoresReady ? (
              <Empty>{t('common.error')}</Empty>
            ) : scores.length === 0 ? (
              <Empty>{t('assessments.noAssessments')}</Empty>
            ) : (
              <div className="mt-4 space-y-4">
                {scores.map((s) => (
                  <article key={s.id} className="space-y-3 p-4 rounded-xl border border-slate-200 bg-white">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="font-medium text-slate-800">
                          {s.studentName} · {s.type === 'DEFENSE' ? t('assessments.defenseAssessment') : t('assessments.reviewAssessment')}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {t('assessments.evaluator')}: {s.evaluatorName} · {formatDate(s.submittedAt || s.updatedAt)}
                        </p>
                      </div>
                      <StatusBadge value={s.status} type="status" />
                    </div>

                    <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
                      <span>{t('assessments.contentScore')}: <strong>{s.contentScore}/10</strong></span>
                      <span>{t('assessments.implementationScore')}: <strong>{s.implementationScore}/10</strong></span>
                      <span>{t('assessments.presentationScore')}: <strong>{s.presentationScore}/10</strong></span>
                    </div>

                    {[
                      ['strengths', t('assessments.strengths')],
                      ['weaknesses', t('assessments.limitations')],
                      ['questions', t('assessments.questions')],
                      ['comment', t('assessments.comments')],
                    ].map(([key, label]) =>
                      s[key] ? (
                        <p key={key} className="whitespace-pre-wrap break-words text-sm text-slate-600">
                          <strong>{label}: </strong>{s[key]}
                        </p>
                      ) : null
                    )}

                    {s.canEdit && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                        <Button
                          secondary
                          disabled={busy}
                          onClick={() => {
                            setStudentId(String(s.studentId));
                            setType(s.type);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          {t('assessments.editDraft')}
                        </Button>
                        <Button
                          disabled={busy}
                          onClick={() => {
                            if (window.confirm(t('assessments.confirmSubmitLock'))) {
                              action(() => assessmentService.submitAssessment(s.id), t('common.success'));
                            }
                          }}
                        >
                          {t('assessments.submitAndLock')}
                        </Button>
                        <Button
                          danger
                          disabled={busy}
                          onClick={() => {
                            if (window.confirm(t('assessments.confirmDeleteDraft'))) {
                              action(() => assessmentService.deleteDraft(s.id), t('common.success'));
                            }
                          }}
                        >
                          {t('assessments.deleteDraft')}
                        </Button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}

export default AssessmentsPage;

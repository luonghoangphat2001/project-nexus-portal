import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import councilService from '../services/councilService';
import assessmentService from '../services/assessmentService';
import { AssessmentForm } from '../components/common/AssessmentForm';
import { Badge, Banner, Button, Empty, Field, Panel, formatDate, inputClass, labels } from '../components/common/DefenseUi';

export function AssessmentsPage() {
  const { user } = useAuth();
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
    setLoading(true); setError('');
    councilService.getCouncils().then((data) => {
      if (!active) return;
      const eligible = data.filter((c) => c.canManage || c.members.some((m) => m.lecturerId === user?.id));
      setCouncils(eligible);
      const all = eligible.flatMap((c) => c.assignments);
      setSelectedId((id) => all.some((a) => String(a.id) === (id || requestedId)) ? (id || requestedId) : String(all[0]?.id || ''));
    }).catch((e) => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh, user?.id, requestedId]);

  useEffect(() => {
    let active = true;
    setScores([]);
    setScoresReady(false);
    if (!selectedId) { setScoreLoading(false); return () => { active = false; }; }
    setScoreLoading(true); setError('');
    assessmentService.getAssessments(selectedId).then((data) => { if (active) { setScores(data); setScoresReady(true); } })
      .catch((e) => { if (active) setError(e.message); })
      .finally(() => { if (active) setScoreLoading(false); });
    return () => { active = false; };
  }, [selectedId, refresh]);

  useEffect(() => {
    const current = councils.flatMap((c) => c.assignments).find((a) => String(a.id) === selectedId);
    setStudentId((id) => current?.registration.students.some((s) => String(s.id) === id) ? id : String(current?.registration.students[0]?.id || ''));
    if (!current?.canReview) setType('DEFENSE');
  }, [selectedId, councils]);

  const action = async (execute, message) => {
    setBusy(true); setError(''); setNotice('');
    try { await execute(); setNotice(message); setRefresh((n) => n + 1); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold text-slate-800">Reviews & Grading</h1>
      <p className="mt-1 text-sm text-slate-500">Module 13 · Assess individual students in your assigned councils.</p></div>
      <Button secondary disabled={busy || loading} onClick={() => setRefresh((n) => n + 1)}><RefreshCw size={16} />Refresh</Button>
    </div>
    <Banner error={error} notice={notice} />
    {loading ? <Empty>Loading assignments...</Empty> : assignments.length === 0 ? <Panel><Empty>No teams have been assigned to your councils.</Empty></Panel>
      : <>
        <Panel><Field label="Council / Team / Project"><select className={inputClass} disabled={busy} value={selectedId}
          onChange={(e) => { setSelectedId(e.target.value); setNotice(''); }}>
          {assignments.map((a) => <option key={a.id} value={a.id}>{a.council.name} · {a.registration.teamName} · {a.registration.topicTitle}</option>)}
        </select></Field>
          {selected && <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500"><Badge value={selected.council.status} />
            <span>{selected.council.room} · {formatDate(selected.council.startsAt)} (Vietnam time, UTC+7)</span>
            <Link className="text-indigo-600 hover:underline" to={`/reports?registrationId=${selected.registration.id}`}>View Team Documents</Link>
          </div>}
        </Panel>
        {selected && (selected.canDefense || selected.canReview) && scoresReady && !scoreLoading && <Panel className="space-y-4">
          <h2 className="font-semibold text-slate-800">Your Assessment</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Student"><select className={inputClass} disabled={busy} value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              {selected.registration.students.map((s) => <option key={s.id} value={s.id}>{s.fullName} · {s.studentCode || s.id}</option>)}
            </select></Field>
            <Field label="Assessment Type"><select className={inputClass} disabled={busy} value={type} onChange={(e) => setType(e.target.value)}>
              {selected.canDefense && <option value="DEFENSE">Defense Assessment</option>}{selected.canReview && <option value="REVIEW">Review</option>}
            </select></Field>
          </div>
          {ownScore?.status === 'SUBMITTED' ? <p className="text-sm text-emerald-700">This assessment has been submitted and locked. View its details below.</p>
            : canEvaluate && studentId && <AssessmentForm key={`${selectedId}-${studentId}-${type}-${ownScore?.updatedAt || 'new'}`} score={ownScore} busy={busy}
              onSave={(data) => action(() => assessmentService.saveDraft({ ...data, assignmentId: Number(selectedId), studentId: Number(studentId), type }), 'Draft saved. Review it before submitting the final assessment.')} />}
        </Panel>}
        <Panel><h2 className="font-semibold text-slate-800">Assessments</h2>
          <p className="mt-1 text-xs text-slate-500">You can view your own drafts and submitted assessments. Scores have not been published to students.</p>
          {scoreLoading ? <Empty>Loading assessments...</Empty> : !scoresReady ? <Empty>Unable to load assessments. Refresh to continue.</Empty> : scores.length === 0 ? <Empty>No assessments are available.</Empty>
            : <div className="mt-4 space-y-4">{scores.map((s) => <article key={s.id} className="space-y-3 p-4 rounded-xl border border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-medium text-slate-800">{s.studentName} · {labels[s.type]}</h3>
                <p className="mt-1 text-xs text-slate-500">Evaluator: {s.evaluatorName} · {formatDate(s.submittedAt || s.updatedAt)}</p></div><Badge value={s.status} /></div>
              <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-3"><span>Content: <strong>{s.contentScore}/10</strong></span>
                <span>Implementation: <strong>{s.implementationScore}/10</strong></span><span>Documentation / Presentation: <strong>{s.presentationScore}/10</strong></span></div>
              {[['strengths', 'Strengths'], ['weaknesses', 'Limitations'], ['questions', 'Questions'], ['comment', 'Comments']].map(([key, label]) => s[key]
                ? <p key={key} className="whitespace-pre-wrap break-words text-sm text-slate-600"><strong>{label}: </strong>{s[key]}</p> : null)}
              {s.canEdit && <div className="flex flex-wrap gap-2"><Button secondary disabled={busy} onClick={() => { setStudentId(String(s.studentId)); setType(s.type); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Edit Draft</Button>
                <Button disabled={busy} onClick={() => { if (window.confirm('Submit the final assessment? It will be locked, and the team will no longer be able to submit new documents.'))
                  action(() => assessmentService.submitAssessment(s.id), 'Assessment submitted and locked.'); }}>Submit & Lock</Button>
                <Button danger disabled={busy} onClick={() => { if (window.confirm('Delete this draft assessment?')) action(() => assessmentService.deleteDraft(s.id), 'Draft assessment deleted.'); }}>Delete Draft</Button>
              </div>}
            </article>)}</div>}
        </Panel>
      </>}
  </div>;
}

export default AssessmentsPage;

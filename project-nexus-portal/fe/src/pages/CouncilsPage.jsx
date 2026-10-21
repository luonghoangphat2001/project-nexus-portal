import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, GraduationCap, Plus, RefreshCw, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import councilService from '../services/councilService';
import reportService from '../services/reportService';
import { CouncilForm } from '../components/common/CouncilForm';
import { useTranslation } from '../i18n/LanguageContext';
import { Banner, Button, Empty, Panel, formatDate, inputClass } from '../components/common/DefenseUi';
import { PageHeader, StatusBadge, buttonClass } from '../components/common/CommonUi';
import { formatApiError } from '../utils/errorHandler';

export function CouncilsPage() {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const manager = user?.roles?.some((r) => ['ROLE_ADMIN', 'ROLE_PRINCIPAL'].includes(r));
  const [councils, setCouncils] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [options, setOptions] = useState(null);
  const [editor, setEditor] = useState(null);
  const [allocation, setAllocation] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    Promise.all([
      councilService.getCouncils(),
      reportService.getRegistrations(),
      manager ? councilService.getOptions() : Promise.resolve(null),
    ])
      .then(([data, regs, opts]) => {
        if (active) {
          setCouncils(data);
          setRegistrations(regs);
          setOptions(opts);
        }
      })
      .catch((e) => {
        if (active) setError(formatApiError(e, language));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [manager, refresh, t]);

  const action = async (execute, message, close = false) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await execute();
      if (close) setEditor(null);
      setAllocation({});
      setNotice(message);
      setRefresh((n) => n + 1);
    } catch (e) {
      setError(formatApiError(e, language));
    } finally {
      setBusy(false);
    }
  };

  const assigned = new Set(councils.flatMap((c) => c.assignments.map((a) => a.registration.id)));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title={t('councils.title')}
        description={t('councils.subtitle')}
        actions={
          <>
            <button
              type="button"
              disabled={busy || loading}
              onClick={() => setRefresh((n) => n + 1)}
              className={buttonClass.secondary}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{t('councils.refresh')}</span>
            </button>
            {manager && options?.departments?.length > 0 && (
              <button
                type="button"
                disabled={busy || loading}
                onClick={() => setEditor({ mode: 'create' })}
                className={buttonClass.primary}
              >
                <Plus className="w-4 h-4" />
                <span>{t('councils.createCouncil')}</span>
              </button>
            )}
          </>
        }
      />

      <Banner error={error} notice={notice} />

      {editor && options && (
        <Panel>
          <CouncilForm
            key={editor.council?.id || 'create'}
            council={editor.council}
            options={options}
            busy={busy}
            onChange={() => setError('')}
            onCancel={() => setEditor(null)}
            onSave={(data) =>
              action(
                () =>
                  editor.council
                    ? councilService.updateCouncil(editor.council.id, data)
                    : councilService.createCouncil(data),
                t('common.success'),
                true
              )
            }
          />
        </Panel>
      )}

      {loading ? (
        <Empty>{t('common.loading')}</Empty>
      ) : councils.length === 0 ? (
        <Panel><Empty>{t('councils.noCouncils')}</Empty></Panel>
      ) : (
        councils.map((c) => (
          <Panel key={c.id} className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <CalendarDays className="text-blue-600" size={20} />
                  <h2 className="font-semibold text-slate-800">{c.name}</h2>
                  <StatusBadge value={c.status} type="status" />
                </div>
                <p className="mt-2 text-sm text-slate-500">{c.departmentName} · {c.periodName}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {c.room} · {formatDate(c.startsAt)} → {formatDate(c.endsAt)} (Vietnam time, UTC+7)
                </p>
              </div>

              {c.canManage && c.status === 'SCHEDULED' && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    secondary
                    disabled={busy}
                    onClick={() => {
                      setEditor({ council: c });
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    {t('common.edit')}
                  </Button>
                  <Button
                    secondary
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm(t('councils.confirmComplete'))) {
                        action(() => councilService.changeStatus(c.id, 'COMPLETED'), t('common.success'));
                      }
                    }}
                  >
                    {t('councils.completeCouncil')}
                  </Button>
                  <Button
                    danger
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm(t('councils.confirmCancel'))) {
                        action(() => councilService.changeStatus(c.id, 'CANCELLED'), t('common.success'));
                      }
                    }}
                  >
                    {t('councils.cancelCouncil')}
                  </Button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {c.members.map((m) => (
                <span
                  key={m.lecturerId}
                  className="px-3 py-1.5 rounded-xl text-xs text-slate-700 bg-slate-50 border border-slate-200"
                >
                  {m.fullName} · <strong>{t(`enums.councilRole.${m.role}`, m.role)}</strong>
                </span>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-sm font-semibold text-slate-700">
                {t('councils.assignedTeams')} ({c.assignments.length})
              </h3>

              {c.assignments.length === 0 ? (
                <Empty>{t('councils.noAssignedTeams')}</Empty>
              ) : (
                <div className="mt-3 space-y-3">
                  {c.assignments.map((a) => (
                    <div
                      key={a.id}
                      className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {a.registration.teamName} · {a.registration.topicTitle}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          {a.registration.advisors && a.registration.advisors.length > 0 && (
                            <span className="flex items-center gap-1 font-medium text-slate-700">
                              <GraduationCap className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              <span>{t('topics.instructor', 'GVHD')}: {a.registration.advisors.map((adv) => adv.fullName).join(', ')}</span>
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{a.registration.students.map((s) => `${s.fullName} (${s.studentCode || s.id})`).join(', ')}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 text-sm">
                        <Link
                          className="self-center text-blue-600 hover:underline font-semibold"
                          to={`/reports?registrationId=${a.registration.id}`}
                        >
                          {t('councils.documentsLink')}
                        </Link>
                        {(a.canReview || a.canDefense || c.canManage) && (
                          <Link
                            className="self-center text-blue-600 hover:underline font-semibold"
                            to={`/assessments?assignmentId=${a.id}`}
                          >
                            {t('councils.assessmentsLink')}
                          </Link>
                        )}
                        {c.canManage && c.status !== 'COMPLETED' && (
                          <Button
                            danger
                            disabled={busy}
                            onClick={() => {
                              if (window.confirm(`${t('councils.confirmRemoveAssignment')} (${a.registration.teamName})`)) {
                                action(() => councilService.removeAssignment(c.id, a.id), t('common.success'));
                              }
                            }}
                          >
                            {t('councils.removeTeam')}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {c.canManage && c.status === 'SCHEDULED' && (
              <form
                className="flex flex-wrap gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  action(() => councilService.assignRegistration(c.id, Number(allocation[c.id])), t('common.success'));
                }}
              >
                <select
                  aria-label={`Select a team for ${c.name}`}
                  required
                  disabled={busy}
                  className={`${inputClass} flex-1 min-w-48`}
                  value={allocation[c.id] || ''}
                  onChange={(e) => setAllocation({ ...allocation, [c.id]: e.target.value })}
                >
                  <option value="">{t('councils.selectApprovedTeam')}</option>
                  {registrations
                    .filter(
                      (r) =>
                        r.canManage &&
                        r.departmentId === c.departmentId &&
                        r.periodId === c.periodId &&
                        !assigned.has(r.id)
                    )
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.teamName} · {r.topicTitle}
                      </option>
                    ))}
                </select>
                <Button type="submit" disabled={busy || !allocation[c.id]}>
                  {t('councils.assignTeam')}
                </Button>
              </form>
            )}
          </Panel>
        ))
      )}
    </div>
  );
}

export default CouncilsPage;

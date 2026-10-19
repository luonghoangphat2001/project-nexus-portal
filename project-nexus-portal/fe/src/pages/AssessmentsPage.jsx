import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { RefreshCw, FileText, CheckCircle2, Trash2, Edit2, Lock, Eye, AlertCircle, Award, BookOpen, Clock, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import councilService from '../services/councilService';
import assessmentService from '../services/assessmentService';
import { AssessmentForm } from '../components/common/AssessmentForm';
import { useTranslation } from '../i18n/LanguageContext';
import {
  PageHeader,
  FilterCard,
  FilterField,
  TableCard,
  TableHeaderBar,
  StatusBadge,
  Modal,
  buttonClass,
  inputClass,
  selectClass
} from '../components/common/CommonUi';

function formatDate(date) {
  if (!date) return '—';
  try {
    return new Date(date).toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return String(date);
  }
}

export function AssessmentsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const requestedId = params.get('assignmentId');
  const [councils, setCouncils] = useState([]);
  const [selectedCouncilId, setSelectedCouncilId] = useState('');
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
  const [viewScoreDetail, setViewScoreDetail] = useState(null);

  const selectedCouncil = useMemo(
    () => councils.find((c) => String(c.id) === String(selectedCouncilId)) || councils[0] || null,
    [councils, selectedCouncilId]
  );

  const councilAssignments = useMemo(() => {
    if (!selectedCouncil) return [];
    return (selectedCouncil.assignments || []).map((a) => ({ ...a, council: selectedCouncil }));
  }, [selectedCouncil]);

  const selected = useMemo(
    () => councilAssignments.find((a) => String(a.id) === String(selectedId)) || councilAssignments[0] || null,
    [councilAssignments, selectedId]
  );

  const ownScore = scores.find((s) => String(s.studentId) === studentId && s.type === type && s.evaluatorId === user?.id);
  const canEvaluate = selected && (type === 'ADVISOR'
    ? selected.canAdvisor
    : type === 'REVIEW' ? selected.canReview : selected.canDefense);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    councilService.getCouncils()
      .then((data) => {
        if (!active) return;
        const eligible = data.filter((c) => c.canManage || c.members.some((m) => m.lecturerId === user?.id)
          || c.assignments.some((assignment) => assignment.canAdvisor));
        setCouncils(eligible);

        // Find initial council and assignment
        const all = eligible.flatMap((c) => (c.assignments || []).map((a) => ({ ...a, council: c })));
        if (requestedId && all.some((a) => String(a.id) === String(requestedId))) {
          const match = all.find((a) => String(a.id) === String(requestedId));
          setSelectedCouncilId(String(match.council.id));
          setSelectedId(String(requestedId));
        } else if (eligible.length > 0) {
          setSelectedCouncilId(String(eligible[0].id));
          if (eligible[0].assignments && eligible[0].assignments[0]) {
            setSelectedId(String(eligible[0].assignments[0].id));
          }
        }
      })
      .catch((e) => {
        if (active) setError(e.message || t('common.error'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [refresh, user?.id, requestedId, t]);

  // Synchronize selectedId when selectedCouncilId changes
  useEffect(() => {
    if (councilAssignments.length === 0) return;
    setSelectedId((current) =>
      councilAssignments.some((a) => String(a.id) === current) ? current : String(councilAssignments[0].id)
    );
  }, [councilAssignments]);

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
    if (!current?.canReview && !current?.canDefense && current?.canAdvisor) setType('ADVISOR');
    else if (!current?.canReview && !current?.canDefense) setType('DEFENSE');
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
    <div className="space-y-6">
      <PageHeader
        title={t('assessments.title')}
        description={t('assessments.subtitle')}
        action={
          <button
            type="button"
            disabled={busy || loading}
            onClick={() => setRefresh((n) => n + 1)}
            className={buttonClass('secondary')}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('assessments.refresh', 'Làm mới')}</span>
          </button>
        }
      />

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}
      {notice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
          {notice}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-sm text-slate-500 bg-white rounded-2xl border border-slate-200">
          {t('common.loading')}
        </div>
      ) : councils.length === 0 ? (
        <div className="p-12 text-center text-sm text-slate-500 bg-white rounded-2xl border border-slate-200">
          {t('assessments.noAssignedTeams')}
        </div>
      ) : (
        <>
          {/* KHỐI 2 BỘ LỌC TÁCH BIỆT: HỘI ĐỒNG ĐÁNH GIÁ & ĐỀ TÀI / NHÓM */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs transition-all space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bộ lọc 1: Hội đồng đánh giá */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-blue-600" />
                  <span>{t('assessments.filterCouncil', '1. Chọn Hội đồng đánh giá')}</span>
                </label>
                <div className="relative">
                  <select
                    className={selectClass}
                    disabled={busy}
                    value={selectedCouncilId}
                    onChange={(e) => {
                      setSelectedCouncilId(e.target.value);
                      setNotice('');
                    }}
                  >
                    {councils.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.room ? `— Phòng ${c.room}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bộ lọc 2: Đề tài & Nhóm sinh viên */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>{t('assessments.filterTopic', '2. Chọn Đề tài & Nhóm sinh viên')}</span>
                </label>
                <div className="relative">
                  <select
                    className={selectClass}
                    disabled={busy || councilAssignments.length === 0}
                    value={selectedId}
                    onChange={(e) => {
                      setSelectedId(e.target.value);
                      setNotice('');
                    }}
                  >
                    {councilAssignments.length === 0 ? (
                      <option value="">{t('assessments.noTopicsInCouncil', 'Hội đồng chưa có đề tài phân công')}</option>
                    ) : (
                      councilAssignments.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.registration.topicTitle} — Nhóm: {a.registration.teamName}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
            </div>

            {selected && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-sm text-slate-600 border-t border-slate-100">
                <div className="flex items-center gap-3 flex-wrap">
                  <StatusBadge value={selected.council.status} type="status" />
                  <span className="font-medium text-slate-800 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>{selected.council.room || 'Phòng hội đồng'}</span>
                  </span>
                  <span className="font-medium text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{formatDate(selected.council.startsAt)}</span>
                  </span>
                </div>
                <Link
                  className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1.5"
                  to={`/reports?registrationId=${selected.registration.id}`}
                >
                  <FileText className="w-4 h-4" />
                  <span>{t('assessments.viewDocuments')}</span>
                </Link>
              </div>
            )}
          </div>

          {/* Form đánh giá phiếu chấm điểm của bản thân (nếu có quyền chấm) */}
          {selected && (selected.canDefense || selected.canReview) && scoresReady && !scoreLoading && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">{t('assessments.yourAssessment')}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Nhập điểm số và nhận xét đánh giá chi tiết cho sinh viên</p>
                </div>
                {ownScore?.status === 'SUBMITTED' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t('assessments.submittedNotice')}</span>
                  </span>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    {t('assessments.student')} *
                  </label>
                  <select
                    className={selectClass}
                    disabled={busy}
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                  >
                    {selected.registration.students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.studentCode || s.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    {t('assessments.assessmentType')} *
                  </label>
                  <select
                    className={selectClass}
                    disabled={busy}
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    {selected.canAdvisor && <option value="ADVISOR">Đánh giá của giảng viên hướng dẫn (20%)</option>}
                    {selected.canDefense && <option value="DEFENSE">{t('assessments.defenseAssessment')}</option>}
                    {selected.canReview && <option value="REVIEW">{t('assessments.reviewAssessment')}</option>}
                  </select>
                </div>
              </div>

              {selected.canAdvisor && !selected.canDefense && (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  GVHD không được tham gia chấm hội đồng
                </p>
              )}

              {ownScore?.status !== 'SUBMITTED' && canEvaluate && studentId && (
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
              )}
            </div>
          )}

          {/* TABLE VẼ BẢNG DANH SÁCH TẤT CẢ PHIẾU CHẤM ĐIỂM CHUẨN ENTERPRISE */}
          <TableCard>
            <TableHeaderBar
              title={t('assessments.evaluationsList')}
              subtitle={t('assessments.evaluationsSub')}
              count={scores.length}
            />

            {scoreLoading ? (
              <div className="p-12 text-center text-sm text-slate-500">
                {t('common.loading')}
              </div>
            ) : !scoresReady ? (
              <div className="p-12 text-center text-sm text-rose-500">
                {t('common.error')}
              </div>
            ) : scores.length === 0 ? (
              <div className="p-12 text-center text-sm text-slate-500">
                {t('assessments.noAssessments')}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold text-sm">
                      <th className="py-3.5 px-4">{t('assessments.student')}</th>
                      <th className="py-3.5 px-4">{t('assessments.assessmentType')}</th>
                      <th className="py-3.5 px-4">{t('assessments.evaluator')}</th>
                      <th className="py-3.5 px-3 text-center">{t('assessments.contentScore')}</th>
                      <th className="py-3.5 px-3 text-center">{t('assessments.implementationScore')}</th>
                      <th className="py-3.5 px-3 text-center">{t('assessments.presentationScore')}</th>
                      <th className="py-3.5 px-3 text-center font-bold text-slate-800">Điểm TB</th>
                      <th className="py-3.5 px-4">{t('common.status')}</th>
                      <th className="py-3.5 px-4 text-center">Nhận xét</th>
                      <th className="py-3.5 px-4 text-right">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {scores.map((s) => {
                      const avg = (
                        (Number(s.contentScore || 0) +
                         Number(s.implementationScore || 0) +
                         Number(s.presentationScore || 0)) / 3
                      ).toFixed(2);

                      return (
                        <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                          {/* Sinh viên */}
                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            <div>{s.studentName}</div>
                            <div className="text-xs font-mono text-slate-400 font-normal">ID: {s.studentId}</div>
                          </td>

                          {/* Hình thức đánh giá */}
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              s.type === 'DEFENSE'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              {s.type === 'DEFENSE' ? t('assessments.defenseAssessment') : t('assessments.reviewAssessment')}
                            </span>
                          </td>

                          {/* Cán bộ chấm */}
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-slate-800">{s.evaluatorName}</div>
                            <div className="text-xs text-slate-400">{formatDate(s.submittedAt || s.updatedAt)}</div>
                          </td>

                          {/* Điểm nội dung */}
                          <td className="py-3.5 px-3 text-center font-mono font-medium">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                              {s.contentScore != null ? Number(s.contentScore).toFixed(1) : '—'}/10
                            </span>
                          </td>

                          {/* Điểm thực hiện */}
                          <td className="py-3.5 px-3 text-center font-mono font-medium">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                              {s.implementationScore != null ? Number(s.implementationScore).toFixed(1) : '—'}/10
                            </span>
                          </td>

                          {/* Điểm thuyết trình */}
                          <td className="py-3.5 px-3 text-center font-mono font-medium">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                              {s.presentationScore != null ? Number(s.presentationScore).toFixed(1) : '—'}/10
                            </span>
                          </td>

                          {/* Điểm TB */}
                          <td className="py-3.5 px-3 text-center font-mono font-bold text-blue-600 text-base">
                            {avg}
                          </td>

                          {/* Trạng thái */}
                          <td className="py-3.5 px-4">
                            <StatusBadge value={s.status} type="status" />
                          </td>

                          {/* Nhận xét popup/drawer */}
                          <td className="py-3.5 px-4 text-center">
                            {(s.comment || s.strengths || s.weaknesses || s.questions) ? (
                              <button
                                type="button"
                                onClick={() => setViewScoreDetail(s)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Chi tiết</span>
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Không có</span>
                            )}
                          </td>

                          {/* Thao tác */}
                          <td className="py-3.5 px-4 text-right">
                            {s.canEdit ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  disabled={busy}
                                  title={t('assessments.editDraft')}
                                  onClick={() => {
                                    setStudentId(String(s.studentId));
                                    setType(s.type);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                  className={buttonClass.actionRow}
                                >
                                  <Edit2 className="w-4 h-4 text-slate-600" />
                                </button>

                                <button
                                  type="button"
                                  disabled={busy}
                                  title={t('assessments.submitAndLock')}
                                  onClick={() => {
                                    if (window.confirm(t('assessments.confirmSubmitLock'))) {
                                      action(() => assessmentService.submitAssessment(s.id), t('common.success'));
                                    }
                                  }}
                                  className="inline-flex items-center justify-center p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all cursor-pointer"
                                >
                                  <Lock className="w-4 h-4" />
                                </button>

                                <button
                                  type="button"
                                  disabled={busy}
                                  title={t('assessments.deleteDraft')}
                                  onClick={() => {
                                    if (window.confirm(t('assessments.confirmDeleteDraft'))) {
                                      action(() => assessmentService.deleteDraft(s.id), t('common.success'));
                                    }
                                  }}
                                  className={buttonClass.actionRowDanger}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 font-mono">Đã khóa</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </TableCard>

          {/* Modal xem chi tiết nhận xét & câu hỏi của phiếu chấm */}
          <Modal
            isOpen={!!viewScoreDetail}
            onClose={() => setViewScoreDetail(null)}
            title={`Chi tiết phiếu chấm: ${viewScoreDetail?.studentName || ''} (${viewScoreDetail?.type === 'DEFENSE' ? t('assessments.defenseAssessment') : t('assessments.reviewAssessment')})`}
          >
            <div className="space-y-4 text-sm">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-slate-500 block">Cán bộ chấm</span>
                  <span className="font-semibold text-slate-800">{viewScoreDetail?.evaluatorName}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Trạng thái</span>
                  <StatusBadge value={viewScoreDetail?.status} type="status" />
                </div>
              </div>

              {viewScoreDetail?.strengths && (
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                  <h4 className="font-semibold text-emerald-800 mb-1">{t('assessments.strengths')}</h4>
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{viewScoreDetail.strengths}</p>
                </div>
              )}

              {viewScoreDetail?.weaknesses && (
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                  <h4 className="font-semibold text-amber-800 mb-1">{t('assessments.limitations')}</h4>
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{viewScoreDetail.weaknesses}</p>
                </div>
              )}

              {viewScoreDetail?.questions && (
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                  <h4 className="font-semibold text-blue-800 mb-1">{t('assessments.questions')}</h4>
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{viewScoreDetail.questions}</p>
                </div>
              )}

              {viewScoreDetail?.comment && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="font-semibold text-slate-800 mb-1">{t('assessments.comments')}</h4>
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{viewScoreDetail.comment}</p>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setViewScoreDetail(null)}
                  className={buttonClass('primary')}
                >
                  Đóng
                </button>
              </div>
            </div>
          </Modal>
        </>
      )}
    </div>
  );
}

export default AssessmentsPage;

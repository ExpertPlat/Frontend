import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PATHS, withParams } from '../../../../routes/paths';
import { useResource } from '../../../../services/hooks';
import { adminRenewals } from '../../../../services/admin/adminApi';
import { ADMIN_PERMISSIONS as P } from '../../../adminAuthorization/adminPermissions';
import { useUserI18n } from '../../../userDashboard/i18n/UserI18nContext';
import { Breadcrumbs, Button, Field, TextArea, TextInput } from '../../../userDashboard/components/ui';
import { useAdminSession } from '../../session/AdminSessionContext';
import { ActionDialog, KV, LoadFailed, Notice, Section, Status, Timeline, When, useAdminAction, useLabel } from '../../ui/kit';
import { DOMAINS, RENEWAL_STATUS, SCOPE_STATUS, SERVICE_TYPES } from '../../ui/statuses';

const EVENT = { created: ['أُنشئ الطلب', 'Request created'], submitted: ['قدّم الخبير الأدلة', 'Expert submitted evidence'], under_review: ['بدأت المراجعة', 'Review started'], needs_information: ['طُلبت معلومات إضافية', 'More information requested'], approved: ['اعتُمد التجديد', 'Renewal approved'], rejected: ['رُفض التجديد', 'Renewal rejected'] };
const sizeOf = (bytes) => `${Math.max(1, Math.round((bytes || 0) / 1024))} KB`;

export default function RenewalDetail() {
  const { renewalId } = useParams();
  const { tr, tx } = useUserI18n();
  const label = useLabel();
  const { can, refreshQueues } = useAdminSession();
  const detail = useResource(() => adminRenewals.get(renewalId), [renewalId]);
  const reloadAll = async (o) => { await detail.reload(o); refreshQueues(); };
  const action = useAdminAction(reloadAll);
  const [dialog, setDialog] = useState(null);
  const [reason, setReason] = useState('');
  const [approve, setApprove] = useState({ validUntil: '', nextReviewAt: '' });
  const [error, setError] = useState('');
  const r = detail.data;
  const canReview = can(P.EXPERT_RENEWALS_REVIEW);
  const close = () => { setDialog(null); setReason(''); setError(''); };

  if (detail.error) return <div className="ad-page"><LoadFailed message={detail.errorMessage} onRetry={() => detail.reload()} /></div>;
  if (!r) return <div className="ad-page"><Section icon="refresh" title={tr('جارٍ التحميل…', 'Loading…')}><div className="ad-body" aria-busy="true">…</div></Section></div>;

  const start = async () => { const res = await action.run(() => adminRenewals.startReview(r.id, r.version), { success: tr('بدأت مراجعة التجديد.', 'Renewal review started.') }); if (res.ok) reloadAll({ silent: true }); };
  const decide = async (kind) => {
    if (reason.trim().length < 3) { setError(tr('اكتب السبب (3 أحرف على الأقل).', 'Write the reason (at least 3 characters).')); return; }
    const call = kind === 'reject' ? () => adminRenewals.reject(r.id, r.version, reason.trim()) : () => adminRenewals.requestInformation(r.id, r.version, reason.trim());
    const res = await action.run(call, { success: kind === 'reject' ? tr('تم رفض التجديد.', 'Renewal rejected.') : tr('أُرسل طلب المعلومات.', 'Information request sent.') });
    if (res.ok) { close(); reloadAll({ silent: true }); } else setError(res.message);
  };
  const doApprove = async () => {
    if (approve.validUntil && approve.validUntil <= new Date().toISOString().slice(0, 10)) { setError(tr('تاريخ الصلاحية يجب أن يكون في المستقبل.', 'The validity date must be in the future.')); return; }
    const res = await action.run(() => adminRenewals.approve(r.id, r.version, { ...(approve.validUntil ? { validUntil: approve.validUntil } : {}), ...(approve.nextReviewAt ? { nextReviewAt: approve.nextReviewAt } : {}) }), { success: tr('تم اعتماد التجديد.', 'Renewal approved.') });
    if (res.ok) { close(); reloadAll({ silent: true }); } else setError(res.message);
  };

  const history = (r.history || []).slice().sort((a, b) => String(b.at).localeCompare(String(a.at)));
  return (
    <div className="ad-page">
      <Breadcrumbs items={[{ label: tr('تجديد النطاقات', 'Scope renewals'), to: PATHS.ADMIN_RENEWALS }, { label: `#${r.id}` }]} />
      <Section className="ad-hero" icon="refresh" title={tr(`طلب تجديد #${r.id}`, `Renewal request #${r.id}`)} aside={<Status map={RENEWAL_STATUS} value={r.status} />}>
        <div className="ad-body">
          <KV columns={4} items={[
            [tr('الخبير', 'Expert'), can(P.EXPERTS_VIEW) ? <Link to={withParams(PATHS.ADMIN_EXPERT_DETAIL, { expertId: r.expert.id })}>{r.expert.name}</Link> : r.expert.name],
            [tr('المجال', 'Domain'), label(DOMAINS, r.scope?.domain)], [tr('الاختصاص', 'Jurisdiction'), <span dir="auto">{r.scope?.jurisdiction}</span>], [tr('الدور', 'Role'), <span dir="auto">{r.scope?.role}</span>],
            [tr('حالة النطاق', 'Scope status'), r.scope ? <Status map={SCOPE_STATUS} value={r.scope.isEffective ? 'active' : r.scope.status} /> : null],
            [tr('ينتهي في', 'Expires'), <When value={r.scope?.validUntil} />], [tr('المراجعة التالية', 'Next review'), <When value={r.nextReviewAt} />],
            [tr('الخدمات', 'Services'), (r.scope?.serviceTypes || []).map((t) => label(SERVICE_TYPES, t)).join('، ')],
          ]} />
          {r.feedback?.reason && <Notice tone={r.status === 'rejected' ? 'danger' : 'warning'}><b>{tr('ملاحظة الفريق: ', 'Team note: ')}</b>{r.feedback.reason}</Notice>}
        </div>
      </Section>
      <div className="ad-grid">
        <div className="ad-col-7 ad-stack">
          <Section flush icon="paperclip" title={tr('أدلة التجديد المرفوعة', 'Submitted evidence')}>
            {r.submissions.length === 0 ? <div className="ad-pad ad-muted">{tr('لا أدلة.', 'No evidence.')}</div> : (
              <ul className="ad-mini">{r.submissions.map((s) => (
                <li key={s.id}><div><b dir="auto">{s.originalName}</b><small>{sizeOf(s.size)} · <When value={s.submittedAt} time /></small></div>{can(P.EXPERT_RENEWALS_VIEW_EVIDENCE) ? <Status meta={{ tone: 'olive', label: ['قابل للعرض', 'Viewable'] }} /> : <Status meta={{ tone: 'neutral', label: ['لا صلاحية للعرض', 'No access'] }} />}</li>
              ))}</ul>
            )}
          </Section>
        </div>
        <div className="ad-col-5 ad-stack">
          <Section icon="history" title={tr('السجل', 'History')}><div className="ad-body"><Timeline empty={tr('لا سجل.', 'No history.')} items={history.map((h, i) => ({ key: i, title: tx(EVENT[h.event] || [h.event, h.event]), note: h.note, at: h.at, tone: h.event === 'approved' ? 'success' : h.event === 'rejected' ? 'danger' : undefined }))} /></div></Section>
        </div>
      </div>

      {canReview && r.status === 'submitted' && <div className="ad-decide"><p>{tr('جاهز للمراجعة. عند البدء تُسجَّل كمُراجِع.', 'Ready to review. You are recorded as the reviewer when you start.')}</p><Button icon="play" loading={action.busy} onClick={start}>{tr('بدء المراجعة', 'Start review')}</Button></div>}
      {canReview && r.status === 'under_review' && (
        <div className="ad-decide"><p>{tr('راجع الأدلة ثم اتخذ القرار.', 'Check the evidence, then decide.')}</p>
          <div className="ad-actions">
            <Button variant="danger" icon="xCircle" onClick={() => setDialog('reject')}>{tr('رفض', 'Reject')}</Button>
            <Button variant="secondary" icon="message" onClick={() => setDialog('info')}>{tr('طلب معلومات', 'Request information')}</Button>
            <Button icon="badgeCheck" onClick={() => setDialog('approve')}>{tr('اعتماد التجديد', 'Approve renewal')}</Button>
          </div>
        </div>
      )}

      <ActionDialog open={dialog === 'reject'} onClose={close} icon="xCircle" tone="danger" title={tr('رفض التجديد', 'Reject the renewal')} confirmLabel={tr('رفض', 'Reject')} variant="danger" busy={action.busy} onSubmit={() => decide('reject')} error={error}>
        <Field label={tr('السبب', 'Reason')} required htmlFor="rn-reject"><TextArea id="rn-reject" value={reason} onChange={setReason} rows={4} maxLength={1000} /></Field>
      </ActionDialog>
      <ActionDialog open={dialog === 'info'} onClose={close} icon="message" tone="peach" title={tr('طلب معلومات إضافية', 'Request more information')} confirmLabel={tr('إرسال', 'Send')} busy={action.busy} onSubmit={() => decide('info')} error={error}>
        <Field label={tr('ما المطلوب من الخبير؟', 'What does the expert need to provide?')} required htmlFor="rn-info"><TextArea id="rn-info" value={reason} onChange={setReason} rows={4} maxLength={1000} /></Field>
      </ActionDialog>
      <ActionDialog open={dialog === 'approve'} onClose={close} icon="badgeCheck" tone="success" title={tr('اعتماد التجديد', 'Approve the renewal')} description={tr('اترك التواريخ فارغة لتمديد سنة كاملة.', 'Leave the dates empty to extend by a full year.')} confirmLabel={tr('اعتماد', 'Approve')} busy={action.busy} onSubmit={doApprove} error={error}>
        <div className="ad-two">
          <Field label={tr('صالح حتى', 'Valid until')} optional htmlFor="rn-valid"><TextInput id="rn-valid" type="date" value={approve.validUntil} onChange={(v) => setApprove({ ...approve, validUntil: v })} /></Field>
          <Field label={tr('المراجعة التالية', 'Next review')} optional htmlFor="rn-next"><TextInput id="rn-next" type="date" value={approve.nextReviewAt} onChange={(v) => setApprove({ ...approve, nextReviewAt: v })} /></Field>
        </div>
      </ActionDialog>
    </div>
  );
}

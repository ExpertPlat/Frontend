import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PATHS, withParams } from '../../../../routes/paths';
import { useResource } from '../../../../services/hooks';
import { adminFinance } from '../../../../services/admin/adminApi';
import { ADMIN_PERMISSIONS as P } from '../../../adminAuthorization/adminPermissions';
import { useUserI18n } from '../../../userDashboard/i18n/UserI18nContext';
import { Breadcrumbs, Button } from '../../../userDashboard/components/ui';
import { useAdminSession } from '../../session/AdminSessionContext';
import { LoadFailed, Money, Notice, Section, Status, When, useAdminAction, useLabel } from '../../ui/kit';
import { ATTEMPT_STATUS, DISPUTE_REASON, DISPUTE_STATUS, FUNDING_STATUS, LEDGER_TYPE, RECON_KIND, RECON_STATUS, REFUND_KIND, REFUND_REASON, REFUND_STATUS } from '../../ui/statuses';
import { CreateRefundDialog, RefundDecisionDialog } from './refundDialogs';

/** One payment: amounts and split, every attempt, refunds (with decisions), reconciliation, disputes and its ledger lines. */
export default function FundingDetail() {
  const { fundingId } = useParams();
  const { tr } = useUserI18n();
  const label = useLabel();
  const { can, refreshQueues } = useAdminSession();
  const detail = useResource(() => adminFinance.funding(fundingId), [fundingId]);
  const action = useAdminAction(detail.reload);
  const [dialog, setDialog] = useState(null);
  const f = detail.data;
  if (detail.error) return <div className="ad-page"><LoadFailed message={detail.errorMessage} onRetry={() => detail.reload()} /></div>;
  if (!f) return <div className="ad-page"><Section icon="card" title={tr('جارٍ التحميل…', 'Loading…')}><div className="ad-body" aria-busy="true">…</div></Section></div>;

  const { currency } = f.amounts;
  const refundable = ['funded', 'partially_refunded'].includes(f.status) && f.amounts.remainingRefundableMinor > 0;
  const openRecon = f.reconciliation.filter((r) => r.status === 'open');
  const done = () => { setDialog(null); detail.reload({ silent: true }); refreshQueues(); };
  const reconcile = async () => {
    const res = await action.run(() => adminFinance.reconcile(f.id), { success: tr('تمت التسوية.', 'Reconciled.') });
    if (res.ok) done();
  };

  return (
    <div className="ad-page">
      <Breadcrumbs items={[{ label: tr('المالية', 'Finance'), to: PATHS.ADMIN_FINANCE }, { label: tr(`الدفعة #${f.id}`, `Payment #${f.id}`) }]} />
      <Section className="ad-hero" icon="card" title={<span dir="auto">{f.caseTitle}</span>} aside={<Status map={FUNDING_STATUS} value={f.status} />}>
        <div className="ad-body">
          <div className="ad-row">
            {can(P.CASES_VIEW) && <Link className="ad-link" to={withParams(PATHS.ADMIN_CASE_DETAIL, { caseId: f.caseId })}>{tr('فتح الحالة', 'Open the case')}</Link>}
            {f.user && <span className="ad-muted">{tr('المستخدم:', 'User:')} {can(P.USERS_VIEW) ? <Link className="ad-link" to={withParams(PATHS.ADMIN_USER_DETAIL, { userId: f.user.id })}>{f.user.name}</Link> : f.user.name}</span>}
            {f.expert && <span className="ad-muted">{tr('الخبير:', 'Expert:')} {can(P.EXPERTS_VIEW) ? <Link className="ad-link" to={withParams(PATHS.ADMIN_EXPERT_DETAIL, { expertId: f.expert.id })}>{f.expert.name}</Link> : f.expert.name}</span>}
          </div>
          <div className="ad-amounts">
            <div><small>{tr('المبلغ المدفوع', 'Paid')}</small><b><Money minor={f.amounts.grossMinor} currency={currency} /></b></div>
            <div><small>{tr('المسترد', 'Refunded')}</small><b><Money minor={f.amounts.refundedMinor} currency={currency} tone={f.amounts.refundedMinor ? 'danger' : undefined} /></b></div>
            <div><small>{tr(`عمولة المنصة (${f.amounts.platformFeePercent}%)`, `Platform fee (${f.amounts.platformFeePercent}%)`)}</small><b><Money minor={f.amounts.platformFeeMinor} currency={currency} /></b></div>
            <div className="is-key"><small>{tr('صافي الخبير', 'Expert net')}</small><b><Money minor={f.amounts.expertNetMinor} currency={currency} /></b></div>
            <div><small>{tr('قابل للاسترداد', 'Refundable')}</small><b><Money minor={f.amounts.remainingRefundableMinor} currency={currency} /></b></div>
          </div>
          {openRecon.length > 0 && <Notice tone="warning" action={can(P.FINANCE_RECONCILE) ? <Button size="sm" variant="secondary" icon="check" loading={action.busy} onClick={reconcile}>{tr('تسوية', 'Reconcile')}</Button> : null}>{tr(`${openRecon.length} فرق مطابقة مفتوح على هذه الدفعة.`, `${openRecon.length} open reconciliation issue(s) on this payment.`)}</Notice>}
          {can(P.REFUNDS_APPROVE) && <div className="ad-actions"><Button icon="banknote" disabled={!refundable} onClick={() => setDialog({ kind: 'create' })}>{tr('استرداد من الإدارة', 'Issue a refund')}</Button>{!refundable && <small className="ad-muted">{f.status === 'refunded' ? tr('استُرد كامل المبلغ.', 'Fully refunded.') : tr('لا رصيد قابل للاسترداد على هذه الدفعة.', 'Nothing left to refund on this payment.')}</small>}</div>}
        </div>
      </Section>

      <div className="ad-grid">
        <div className="ad-col-6 ad-stack">
          <Section flush icon="card" title={tr('محاولات الدفع', 'Payment attempts')}>
            {f.attempts.length === 0 ? <div className="ad-pad ad-muted">{tr('لا محاولات.', 'No attempts.')}</div> : (
              <ul className="ad-mini">{f.attempts.map((a) => (
                <li key={a.id}><div><span className="ad-code">{a.paymentIntent}</span><small><When value={a.createdAt} time />{a.failure ? ` · ${a.failure}` : ''}</small></div><span className="ad-row"><Money minor={a.amountMinor} currency={currency} /><Status map={ATTEMPT_STATUS} value={a.status} /></span></li>
              ))}</ul>
            )}
          </Section>
          <Section flush icon="book" title={tr('حركات الدفتر', 'Ledger lines')}>
            {f.ledger.length === 0 ? <div className="ad-pad ad-muted">{tr('لا حركات.', 'No lines.')}</div> : (
              <ul className="ad-mini">{f.ledger.map((l) => (
                <li key={l.id}><div><Status map={LEDGER_TYPE} value={l.type} /><small dir="auto">{l.memo}</small></div><Money minor={l.direction === 'debit' ? -l.amountMinor : l.amountMinor} currency={l.currency} strong tone={l.direction === 'debit' ? 'danger' : undefined} /></li>
              ))}</ul>
            )}
          </Section>
        </div>
        <div className="ad-col-6 ad-stack">
          <Section flush icon="banknote" title={tr('الاسترداد', 'Refunds')}>
            {f.refunds.length === 0 ? <div className="ad-pad ad-muted">{tr('لا طلبات استرداد.', 'No refunds.')}</div> : (
              <ul className="ad-mini">{f.refunds.map((r) => (
                <li key={r.id}>
                  <div><b>{label(REFUND_REASON, r.reasonCode)}</b><small>{label(REFUND_KIND, r.kind)} · <Money minor={r.approvedAmountMinor ?? r.requestedAmountMinor} currency={currency} />{r.decisionReason ? ` · ${r.decisionReason}` : ''}</small></div>
                  <span className="ad-row"><Status map={REFUND_STATUS} value={r.status} />{r.status === 'pending_review' && can(P.REFUNDS_APPROVE) && <Button size="sm" onClick={() => setDialog({ kind: 'decide', refund: { ...r, currency, funding: { id: f.id, amounts: f.amounts, caseTitle: f.caseTitle } } })}>{tr('قرار', 'Decide')}</Button>}</span>
                </li>
              ))}</ul>
            )}
          </Section>
          <Section flush icon="arrowUpDown" title={tr('المطابقة', 'Reconciliation')}>
            {f.reconciliation.length === 0 ? <div className="ad-pad ad-muted">{tr('لا فروقات.', 'No differences.')}</div> : (
              <ul className="ad-mini">{f.reconciliation.map((r) => (
                <li key={r.id}><div><b>{label(RECON_KIND, r.kind)}</b><small dir="auto">{r.detail}</small></div><Status map={RECON_STATUS} value={r.status} /></li>
              ))}</ul>
            )}
          </Section>
          {f.disputes.length > 0 && (
            <Section flush icon="gavel" title={tr('النزاعات', 'Disputes')}>
              <ul className="ad-mini">{f.disputes.map((d) => (
                <li key={d.id}><div><b>{label(DISPUTE_REASON, d.reason)}</b><small><Money minor={d.amountMinor} currency={currency} /> · <span className="ad-code">{d.stripeDisputeId}</span></small></div><Status map={DISPUTE_STATUS} value={d.status} /></li>
              ))}</ul>
            </Section>
          )}
        </div>
      </div>

      {dialog?.kind === 'create' && <CreateRefundDialog funding={f} attempts={f.attempts} onClose={() => setDialog(null)} onDone={done} />}
      {dialog?.kind === 'decide' && <RefundDecisionDialog refund={dialog.refund} onClose={() => setDialog(null)} onDone={done} />}
    </div>
  );
}

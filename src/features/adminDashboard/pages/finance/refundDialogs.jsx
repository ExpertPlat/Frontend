import React, { useState } from 'react';
import { adminFinance } from '../../../../services/admin/adminApi';
import { fromMinor, toMinor } from '../../../../services/money';
import { useUserI18n } from '../../../userDashboard/i18n/UserI18nContext';
import { Field, Select, TextArea, TextInput } from '../../../userDashboard/components/ui';
import { ActionDialog, Money, useAdminAction } from '../../ui/kit';
import { REFUND_REASON } from '../../ui/statuses';

const ADMIN_REASONS = ['LATE_PAYMENT', 'DUPLICATE_CHARGE', 'SERVICE_ISSUE', 'EXPERT_NO_SHOW', 'GOODWILL'];
const NEEDS_ATTEMPT = ['LATE_PAYMENT', 'DUPLICATE_CHARGE'];

/** Decide a refund request a user made: approve in full, approve part of it, or decline. Sends the refund's `expectedVersion`. */
export function RefundDecisionDialog({ refund, onClose, onDone }) {
  const { tr, tx } = useUserI18n();
  const action = useAdminAction(onDone);
  const currency = refund.currency || refund.funding?.amounts.currency || 'AED';
  const remaining = refund.funding?.amounts.remainingRefundableMinor ?? refund.requestedAmountMinor;
  const [decision, setDecision] = useState('approve_full');
  const [amount, setAmount] = useState(fromMinor(Math.min(remaining, refund.requestedAmountMinor)));
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState({});

  const submit = async () => {
    const local = {};
    if (reason.trim().length < 5) local.reason = [tr('اكتب سببًا واضحًا (5 أحرف على الأقل).', 'Write a clear reason (at least 5 characters).')];
    let amountMinor;
    if (decision === 'approve_partial') {
      amountMinor = toMinor(amount);
      if (!amountMinor || amountMinor < 1) local.amountMinor = [tr('أدخل مبلغًا صحيحًا.', 'Enter a valid amount.')];
      else if (amountMinor > remaining) local.amountMinor = [tr('المبلغ أكبر من الرصيد القابل للاسترداد.', 'More than the refundable balance.')];
    }
    if (decision === 'approve_full' && remaining < 1) local.reason = [tr('لا رصيد قابل للاسترداد على هذه الدفعة.', 'This payment has nothing left to refund.')];
    setErrors(local);
    if (Object.keys(local).length) return;
    const res = await action.run(() => adminFinance.decideRefund(refund.id, { decision, reason: reason.trim(), expectedVersion: refund.version, ...(decision === 'approve_partial' ? { amountMinor } : {}) }), { success: decision === 'reject' ? tr('رُفض طلب الاسترداد وأُبلغ المستخدم.', 'The refund was declined and the user was notified.') : tr('تمت الموافقة على الاسترداد.', 'The refund was approved.') });
    if (res.ok) onDone(); else setErrors({ ...res.fieldErrors, _form: [res.message] });
  };

  return (
    <ActionDialog open onClose={onClose} size="lg" icon="banknote" tone={decision === 'reject' ? 'danger' : 'success'} title={tr('قرار طلب الاسترداد', 'Refund decision')} description={refund.note ? <span dir="auto">“{refund.note}”</span> : undefined} confirmLabel={decision === 'reject' ? tr('رفض الطلب', 'Decline request') : tr('اعتماد الاسترداد', 'Approve refund')} variant={decision === 'reject' ? 'danger' : 'primary'} busy={action.busy} onSubmit={submit} error={errors._form?.[0]}>
      <div className="ad-amounts">
        <div><small>{tr('المبلغ المطلوب', 'Requested')}</small><b><Money minor={refund.requestedAmountMinor} currency={currency} /></b></div>
        <div><small>{tr('قابل للاسترداد', 'Refundable')}</small><b><Money minor={remaining} currency={currency} /></b></div>
        <div><small>{tr('السبب', 'Reason')}</small><b style={{ fontSize: 15 }}>{REFUND_REASON[refund.reasonCode] ? tx(REFUND_REASON[refund.reasonCode]) : refund.reasonCode}</b></div>
      </div>
      <div className="ad-radiolist" role="radiogroup" aria-label={tr('القرار', 'Decision')}>
        {[['approve_full', tr('موافقة كاملة', 'Approve in full'), tr('يُسترد كامل الرصيد القابل للاسترداد.', 'The whole refundable balance is returned.')], ['approve_partial', tr('موافقة جزئية', 'Approve partly'), tr('تحدد المبلغ الذي يُسترد.', 'You choose the amount to return.')], ['reject', tr('رفض الطلب', 'Decline'), tr('لا يُسترد شيء ويُبلَّغ المستخدم بالسبب.', 'Nothing is returned; the user is told why.')]].map(([value, title, hint]) => (
          <label className="ad-radio" key={value}><input type="radio" name="rf-decision" checked={decision === value} onChange={() => setDecision(value)} /><span><b>{title}</b><small>{hint}</small></span></label>
        ))}
      </div>
      {decision === 'approve_partial' && <Field label={`${tr('المبلغ', 'Amount')} (${currency})`} required error={errors.amountMinor?.[0]} htmlFor="rf-amount"><TextInput id="rf-amount" dir="ltr" inputMode="decimal" value={amount} onChange={setAmount} invalid={Boolean(errors.amountMinor)} /></Field>}
      <Field label={tr('سبب القرار', 'Decision reason')} required error={errors.reason?.[0]} hint={tr('يُرسل للمستخدم ويُحفظ في سجل الدفعة.', 'Sent to the user and kept in the payment record.')} htmlFor="rf-reason"><TextArea id="rf-reason" value={reason} onChange={setReason} rows={3} maxLength={1000} invalid={Boolean(errors.reason)} /></Field>
    </ActionDialog>
  );
}

/** Start a refund from the admin side on a funded payment. */
export function CreateRefundDialog({ funding, attempts, onClose, onDone }) {
  const { tr, tx } = useUserI18n();
  const action = useAdminAction(onDone);
  const { currency, remainingRefundableMinor: remaining } = funding.amounts;
  const good = (attempts || []).filter((a) => a.status === 'succeeded');
  const [reasonCode, setReasonCode] = useState('SERVICE_ISSUE');
  const [attemptId, setAttemptId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState({});

  const submit = async () => {
    const local = {};
    if (reason.trim().length < 5) local.reason = [tr('اكتب سببًا واضحًا (5 أحرف على الأقل).', 'Write a clear reason (at least 5 characters).')];
    if (NEEDS_ATTEMPT.includes(reasonCode) && !attemptId) local.attemptId = [tr('اختر محاولة الدفع المعنية.', 'Choose the payment attempt.')];
    let amountMinor;
    if (amount.trim()) {
      amountMinor = toMinor(amount);
      if (!amountMinor || amountMinor < 1) local.amountMinor = [tr('أدخل مبلغًا صحيحًا.', 'Enter a valid amount.')];
      else if (amountMinor > remaining) local.amountMinor = [tr('المبلغ أكبر من الرصيد القابل للاسترداد.', 'More than the refundable balance.')];
    }
    setErrors(local);
    if (Object.keys(local).length) return;
    const res = await action.run(() => adminFinance.createRefund(funding.id, { reasonCode, reason: reason.trim(), ...(attemptId ? { attemptId: Number(attemptId) } : {}), ...(amountMinor ? { amountMinor } : {}) }), { success: tr('تم الاسترداد وأُبلغ المستخدم.', 'The refund was issued and the user was notified.') });
    if (res.ok) onDone(); else setErrors({ ...res.fieldErrors, _form: [res.message] });
  };

  return (
    <ActionDialog open onClose={onClose} size="lg" icon="banknote" tone="peach" title={tr('استرداد من الإدارة', 'Issue a refund')} description={tr(`الدفعة #${funding.id}`, `Payment #${funding.id}`)} confirmLabel={tr('تنفيذ الاسترداد', 'Issue refund')} busy={action.busy} onSubmit={submit} error={errors._form?.[0]}>
      <div className="ad-amounts">
        <div><small>{tr('المدفوع', 'Paid')}</small><b><Money minor={funding.amounts.grossMinor} currency={currency} /></b></div>
        <div><small>{tr('المسترد سابقًا', 'Already refunded')}</small><b><Money minor={funding.amounts.refundedMinor} currency={currency} /></b></div>
        <div className="is-key"><small>{tr('قابل للاسترداد', 'Refundable')}</small><b><Money minor={remaining} currency={currency} /></b></div>
      </div>
      <Field label={tr('سبب الاسترداد', 'Refund reason')} error={errors.reasonCode?.[0]} htmlFor="cr-code"><Select id="cr-code" value={reasonCode} onChange={setReasonCode} options={ADMIN_REASONS.map((v) => ({ value: v, label: tx(REFUND_REASON[v]) }))} /></Field>
      {NEEDS_ATTEMPT.includes(reasonCode) && (
        <Field label={tr('محاولة الدفع المعنية', 'Payment attempt')} required error={errors.attemptId?.[0]} htmlFor="cr-attempt"><Select id="cr-attempt" placeholder={tr('اختر محاولة', 'Choose an attempt')} value={String(attemptId)} onChange={setAttemptId} invalid={Boolean(errors.attemptId)} options={good.map((a) => ({ value: String(a.id), label: `${a.paymentIntent} · ${(a.amountMinor / 100).toFixed(2)} ${currency}` }))} /></Field>
      )}
      <Field label={`${tr('المبلغ', 'Amount')} (${currency})`} optional hint={tr('اتركه فارغًا لاسترداد كامل الرصيد القابل للاسترداد.', 'Leave empty to refund the whole refundable balance.')} error={errors.amountMinor?.[0]} htmlFor="cr-amount"><TextInput id="cr-amount" dir="ltr" inputMode="decimal" value={amount} onChange={setAmount} invalid={Boolean(errors.amountMinor)} placeholder={fromMinor(remaining)} /></Field>
      <Field label={tr('تفاصيل السبب', 'Details')} required error={errors.reason?.[0]} hint={tr('تُحفظ في سجل الدفعة وتصل للمستخدم.', 'Kept in the payment record and shown to the user.')} htmlFor="cr-reason"><TextArea id="cr-reason" value={reason} onChange={setReason} rows={3} maxLength={1000} invalid={Boolean(errors.reason)} /></Field>
    </ActionDialog>
  );
}

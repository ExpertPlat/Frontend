import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useBrandFeedback } from '../../../../components/BrandFeedback/BrandFeedback';
import { PATHS } from '../../../../routes/paths';
import { useIdempotentAction, useResource } from '../../../../services/hooks';
import { toApiInstant } from '../../../../services/money';
import { CANCEL_REASONS, DECLINE_REASONS, WITHDRAW_REASONS } from '../../../../services/reasonCodes';
import { expertAgreementsService, expertBookingsService, expertInvitationsService, expertProposalsService, expertStripeService } from '../../../../services/expert/expertWorkService';
import { expertWorkspaceService } from '../../../../services/expert/expertWorkspaceService';
import { catalogService } from '../../../../services/user/accountService';
import { useUserI18n } from '../../../userDashboard/i18n/UserI18nContext';
import UdIcon from '../../../userDashboard/components/UdIcon';
import { Button, Card, CardHeader, Chip, Dialog, Field, PageHeader, SkeletonRows, StatusPill, TextArea } from '../../../userDashboard/components/ui';
import { useMoney } from '../../../userDashboard/journey/parts';
import ProposalForm from '../../common/ProposalForm';
import { EMPTY_FORM, formFromVersion, newForm } from '../../common/proposalMapping';
import DemoNextStep from '../../../demo/DemoNextStep';
import { ADMIN_HANDOFF, USER_HANDOFF } from '../../../demo/demoConfig';
import { ClientTile, ResourceError } from '../../common/parts';
import { REQUEST_STAGE, requestStep, stageOfRequest } from '../../utils/expertStatuses';
import { localInputToUtc, utcToLocalInput } from '../../utils/zonedTime';

const STEPS = [['الطلب', 'Request'], ['العرض', 'Proposal'], ['الدفع', 'Payment'], ['الجلسة', 'Session']];

function Progress({ step, closed }) {
  const { tx, tr } = useUserI18n();
  return (
    <nav className="jr-journey" aria-label={tr('مراحل الطلب', 'Request progress')}>
      <ol>
        {STEPS.map((label, index) => {
          const state = closed ? 'todo' : index < step ? 'done' : index === step ? 'current' : 'todo';
          return (
            <li key={label[1]} className={`ex-prog is-${state}`} aria-current={state === 'current' ? 'step' : undefined}>
              <span className="jr-journey__node">{state === 'done' ? <UdIcon name="check" size={14} stroke={3} /> : <b>{index + 1}</b>}</span>
              <span className="jr-journey__label">{tx(label)}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Reason picker used by decline / withdraw / cancel dialogs. */
function ReasonDialog({ title, description, reasons, confirmLabel, tone = 'danger', icon = 'xCircle', withNote, busy, onClose, onConfirm }) {
  const { tr, tx } = useUserI18n();
  const [reason, setReason] = useState(reasons[0].id);
  const [note, setNote] = useState('');
  return (
    <Dialog open onClose={busy ? () => {} : onClose} size="sm" icon={icon} tone={tone} title={title} description={description}
      footer={<><Button variant="ghost" onClick={onClose} disabled={busy}>{tr('تراجع', 'Go back')}</Button><Button variant="danger" loading={busy} onClick={() => onConfirm({ reasonCode: reason, note: note.trim() || undefined })}>{confirmLabel}</Button></>}>
      <div className="jr-reasons" role="radiogroup">
        {reasons.map((item) => <button key={item.id} type="button" role="radio" aria-checked={reason === item.id} className={reason === item.id ? 'is-on' : ''} onClick={() => setReason(item.id)}><i />{tx(item.label)}</button>)}
      </div>
      {withNote && <Field label={tr('ملاحظة للعميل', 'Note for the client')} optional htmlFor="ex-reason-note"><TextArea id="ex-reason-note" rows={3} value={note} onChange={setNote} maxLength={300} /></Field>}
    </Dialog>
  );
}

function RescheduleDialog({ booking, timeZone, busy, onClose, onConfirm }) {
  const { tr } = useUserI18n();
  const [value, setValue] = useState(utcToLocalInput(booking.startsAt, timeZone));
  const changed = value && localInputToUtc(value, timeZone) !== new Date(booking.startsAt).toISOString();
  const future = value && new Date(localInputToUtc(value, timeZone)) > new Date();
  return (
    <Dialog open onClose={busy ? () => {} : onClose} size="sm" icon="calendar" title={tr('تغيير موعد الجلسة', 'Move the session')} description={tr(`الوقت حسب منطقتك الزمنية: ${timeZone}`, `Times follow your time zone: ${timeZone}`)}
      footer={<><Button variant="ghost" onClick={onClose} disabled={busy}>{tr('إلغاء', 'Cancel')}</Button><Button icon="check" loading={busy} disabled={!changed || !future} onClick={() => onConfirm(localInputToUtc(value, timeZone))}>{tr('حفظ الموعد', 'Save time')}</Button></>}>
      <Field label={tr('الموعد الجديد', 'New time')} htmlFor="ex-resched" hint={future ? undefined : tr('اختر وقتًا في المستقبل.', 'Pick a time in the future.')} error={!future && value ? tr('اختر وقتًا في المستقبل.', 'Pick a time in the future.') : undefined}>
        <div className="ud-input"><input id="ex-resched" type="datetime-local" dir="ltr" value={value} onChange={(event) => setValue(event.target.value)} /></div>
      </Field>
    </Dialog>
  );
}

function ProposalSummary({ proposal, title }) {
  const { tr, fmtDate, fmtNumber } = useUserI18n();
  const money = useMoney();
  const v = proposal.current;
  return (
    <Card className="jr-card jr-offer">
      <CardHeader icon="fileCheck" title={title || tr('عرضك', 'Your proposal')} aside={<StatusPill tone="amber">{tr(`صالح حتى ${fmtDate(proposal.expiresAt)}`, `Valid until ${fmtDate(proposal.expiresAt)}`)}</StatusPill>} />
      <section><h3><UdIcon name="target" size={18} />{tr('وصف العمل', 'Scope')}</h3><p>{v.scopeSummary}</p></section>
      <section><h3><UdIcon name="checkCircle" size={18} />{tr('المخرجات', 'Deliverables')}</h3><ul className="jr-list">{v.deliverables.map((d, i) => <li key={i}><UdIcon name="check" size={14} stroke={2.6} />{d.title}</li>)}</ul></section>
      {v.exclusions.length > 0 && <section><h3><UdIcon name="ban" size={18} />{tr('غير مشمول', 'Not included')}</h3><ul className="jr-list is-muted">{v.exclusions.map((d, i) => <li key={i}><UdIcon name="minus" size={14} />{d}</li>)}</ul></section>}
      <section>
        <h3><UdIcon name="card" size={18} />{tr('الدفعات', 'Payments')}</h3>
        <ol className="jr-miles">{v.milestones.map((m, i) => <li key={i}><span>{m.title}</span><b>{money({ amountMinor: m.amountMinor, currency: v.currency })}</b></li>)}</ol>
        <div className="jr-agree__total"><span>{tr('الإجمالي', 'Total')}</span><b>{money(v.amount)}</b></div>
        <p className="ex-fine"><Chip icon="video">{tr(`جلسة ${fmtNumber(v.consultationMinutes)} دقيقة`, `${fmtNumber(v.consultationMinutes)}-minute session`)}</Chip></p>
      </section>
    </Card>
  );
}

function Split({ agreement }) {
  const { tr, fmtNumber } = useUserI18n();
  const money = useMoney();
  const funding = useResource(() => expertAgreementsService.funding(agreement.id), [agreement.id, agreement.status]);
  const split = funding.data?.split;
  if (!split) return null;
  const m = (minor) => money({ amountMinor: minor, currency: split.currency });
  return (
    <Card className="jr-card jr-block">
      <CardHeader icon="wallet" title={tr('حسابك من هذا الطلب', 'Your share of this request')} />
      <ul className="ex-split">
        <li><span>{tr('يدفع العميل', 'Client pays')}</span><b>{m(split.grossMinor)}</b></li>
        <li><span>{tr(`عمولة المنصة (${fmtNumber(split.platformFeePercent)}%)`, `Platform fee (${fmtNumber(split.platformFeePercent)}%)`)}</span><b>− {m(split.platformFeeMinor)}</b></li>
        <li className="is-total"><span>{tr('صافي مستحقاتك', 'You receive')}</span><b>{m(split.expertNetMinor)}</b></li>
      </ul>
      <p className="ex-fine">{tr('مبلغ مبدئي: لا يُعدّ دخلًا مؤكدًا قبل إتمام الجلسة وتحويل المنصة.', 'Provisional: not confirmed income until the session is done and the platform pays out.')}</p>
    </Card>
  );
}

function StripeNudge() {
  const { tr } = useUserI18n();
  const stripe = useResource(() => expertStripeService.account(), []);
  if (!stripe.data || stripe.data.status === 'enabled') return null;
  return <div className="jr-banner is-warning"><UdIcon name="wallet" size={20} /><span>{tr('أكمل إعداد حساب استلام الأرباح كي تستلم مستحقاتك.', 'Finish setting up your payout account to receive your earnings.')}</span><Button size="sm" variant="secondary" to={PATHS.EXPERT_PAYMENTS}>{tr('إعداد الحساب', 'Set up')}</Button></div>;
}

function Brief({ brief }) {
  const { tr, fmtNumber } = useUserI18n();
  if (!brief) return null;
  return (
    <Card className="jr-card jr-block">
      <CardHeader icon="file" title={tr('ملخص الحالة', 'Case brief')} />
      {brief.summary && <p className="jr-lead">{brief.summary}</p>}
      {brief.facts?.length > 0 && <ul className="jr-facts">{brief.facts.map((f, i) => <li key={i}><UdIcon name={f.icon || 'info'} size={17} /><span><small>{f.label}</small><b>{f.value}</b></span></li>)}</ul>}
      {brief.questions?.filter((q) => q.answer).length > 0 && (
        <>
          <h3 className="jr-h2">{tr('إجابات العميل', 'Client answers')}</h3>
          <ul className="ex-qa">{brief.questions.filter((q) => q.answer).map((q) => <li key={q.id}><small>{q.label}</small><b>{q.answer}</b></li>)}</ul>
        </>
      )}
      {brief.documents?.length > 0 && (
        <>
          <h3 className="jr-h2">{tr('مستندات مشاركة معك', 'Documents shared with you')}</h3>
          <ul className="jr-files">{brief.documents.map((d) => <li key={d.id}><UdIcon name="file" size={17} /><span>{d.title}</span><small>{fmtNumber(Math.max(1, Math.round(d.size / 1024)))} KB</small></li>)}</ul>
        </>
      )}
    </Card>
  );
}

/** One client request from first invitation to the session: the page shows only the step that needs the expert. */
export default function ExpertRequestDetail() {
  const { invitationId } = useParams();
  const { tr, tx, fmtDate, fmtWeekdayDate, fmtTime, timezone } = useUserI18n();
  const { notify } = useBrandFeedback();
  const money = useMoney();
  const timeZone = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const countries = useResource(() => catalogService.countries(), []);
  const detail = useResource(async () => {
    const [ws, invitation] = await Promise.all([expertWorkspaceService.load(), expertInvitationsService.get(invitationId)]);
    const row = ws.requests.find((r) => r.invitation.id === Number(invitationId));
    return { ...(row || { proposal: null, agreement: null, booking: null }), invitation };
  }, [invitationId]);
  const [dialog, setDialog] = useState(null);
  const acceptAction = useIdempotentAction('accept');
  const declineAction = useIdempotentAction('decline');
  const withdrawAction = useIdempotentAction('withdraw');
  const cancelAction = useIdempotentAction('cancel');
  const moveAction = useIdempotentAction('move');

  const row = detail.data;
  const stage = row ? stageOfRequest(row) : null;
  const countryName = useMemo(() => (code) => countries.data?.find((c) => c.code === code)?.name || code, [countries.data]);

  if (detail.error) return <div className="jr-page"><ResourceError resource={detail} /></div>;
  if (!row) return <div className="jr-page"><Card className="jr-card"><SkeletonRows rows={4} /></Card></div>;
  const { invitation, proposal, agreement, booking } = row;
  const meta = REQUEST_STAGE[stage];

  const refresh = () => detail.reload({ silent: true });
  const act = async (action, call, success) => {
    const result = await action.run(call);
    setDialog(null);
    if (!result.ok) { if (result.error?.status === 409) await refresh(); notify({ message: result.message, tone: 'error' }); return false; }
    await refresh(); if (success) notify({ message: success, tone: 'success' }); return true;
  };
  const accept = () => act(acceptAction, ({ idempotencyKey }) => expertInvitationsService.accept(invitation, { idempotencyKey }), tr('قبلت الطلب. اكتب عرضك الآن.', 'Request accepted. Write your proposal now.'));
  const decline = (payload) => act(declineAction, ({ idempotencyKey }) => expertInvitationsService.decline(invitation, payload, { idempotencyKey }), tr('تم الاعتذار عن الطلب.', 'You declined the request.'));
  const withdraw = (payload) => act(withdrawAction, ({ idempotencyKey }) => expertProposalsService.withdraw(proposal, payload, { idempotencyKey }), tr('سُحب العرض.', 'Proposal withdrawn.'));
  const cancelAgreement = ({ reasonCode }) => act(cancelAction, () => expertAgreementsService.cancel(agreement, reasonCode), tr('أُلغي الاتفاق.', 'Agreement cancelled.'));
  const cancelBooking = ({ reasonCode }) => act(cancelAction, () => expertBookingsService.cancel(booking, reasonCode), tr('أُلغيت الجلسة.', 'Session cancelled.'));
  const move = (startAt) => act(moveAction, () => expertBookingsService.reschedule(booking, startAt), tr('تم تغيير الموعد.', 'Session moved.'));
  const create = async (content, options) => { await expertProposalsService.create(invitation.id, content, options); await refresh(); notify({ message: tr('أُرسل عرضك للعميل.', 'Your proposal was sent.'), tone: 'success' }); };
  const revise = async (content, options) => { await expertProposalsService.revise(proposal, content, options); await refresh(); notify({ message: tr('أُرسل العرض المعدّل.', 'Revised proposal sent.'), tone: 'success' }); };

  const summary = invitation.caseSummary;
  const side = (
    <aside className="jr-offer__side ex-side">
      <Card className="jr-card jr-block">
        <CardHeader icon="user" title={tr('العميل والحالة', 'Client and case')} />
        <div className="jr-who"><ClientTile name={invitation.client.firstName} size={48} /><span><b>{invitation.client.firstName}</b><small>{tr('عميل على المنصة', 'Client on the platform')}</small></span></div>
        <ul className="ex-facts">
          <li><small>{tr('التخصص', 'Specialty')}</small><b>{summary.specialty?.label || '—'}</b></li>
          <li><small>{tr('دولة الحالة', 'Case country')}</small><b>{summary.caseCountry ? countryName(summary.caseCountry) : '—'}</b></li>
          <li><small>{tr('لغة العميل', 'Client language')}</small><b>{summary.language === 'en' ? tr('الإنجليزية', 'English') : tr('العربية', 'Arabic')}</b></li>
          <li><small>{tr('الاستعجال', 'Urgency')}</small><b>{{ normal: tr('عادية', 'Normal'), soon: tr('قريبة', 'Soon'), urgent: tr('عاجلة', 'Urgent') }[summary.urgency] || summary.urgency}</b></li>
          <li><small>{tr('وصل الطلب', 'Received')}</small><b>{fmtDate(invitation.sentAt)}</b></li>
        </ul>
        {invitation.message && <blockquote className="ex-quote">{invitation.message}</blockquote>}
      </Card>
    </aside>
  );

  let main;
  if (stage === 'new') {
    main = (
      <Card className="jr-card jr-waiting">
        <ClientTile name={invitation.client.firstName} size={64} />
        <h2>{tr(`${invitation.client.firstName} يدعوك لمساعدته`, `${invitation.client.firstName} invites you to help`)}</h2>
        <p>{tr('تراجع ملخص الحالة الآن، وعند القبول تصلك التفاصيل الكاملة وتكتب عرضك.', 'You see a short summary now. Accept to get the full details and write your proposal.')}</p>
        {invitation.expiresAt && <Chip icon="clock">{tr(`ينتهي ${fmtDate(invitation.expiresAt)}`, `Expires ${fmtDate(invitation.expiresAt)}`)}</Chip>}
        <div className="jr-actions"><Button size="lg" icon="check" loading={acceptAction.busy} onClick={accept}>{tr('أقبل الطلب', 'Accept request')}</Button><Button variant="secondary" icon="xCircle" onClick={() => setDialog('decline')}>{tr('اعتذر', 'Decline')}</Button></div>
      </Card>
    );
  } else if (stage === 'proposal') {
    main = <><Brief brief={invitation.brief} /><ProposalForm initial={newForm()} submitLabel={tr('إرسال العرض', 'Send proposal')} onSubmit={create} /></>;
  } else if (stage === 'revise') {
    const request = proposal.changeRequests.at(-1);
    main = (
      <>
        <div className="jr-banner is-warning" role="status"><UdIcon name="edit" size={20} /><span><b>{tr('طلب العميل تعديلًا:', 'The client asked for a change:')}</b> {request?.message}</span></div>
        <ProposalForm initial={formFromVersion(proposal.current)} submitLabel={tr('إرسال العرض المعدّل', 'Send revised proposal')} onSubmit={revise} />
      </>
    );
  } else if (stage === 'waiting') {
    main = (
      <>
        <Card className="jr-card jr-waiting"><span className="jr-pulse" aria-hidden="true"><UdIcon name="clock" size={30} /></span><h2>{tr('بانتظار قرار العميل', 'Waiting for the client')}</h2><p>{tr('وصل العميل عرضك. سنخبرك فور أن يقبل أو يطلب تعديلًا.', 'The client has your proposal. We will tell you as soon as they accept or ask for a change.')}</p><Button variant="ghost" icon="undo" onClick={() => setDialog('withdraw')}>{tr('سحب العرض', 'Withdraw proposal')}</Button></Card>
        <ProposalSummary proposal={proposal} />
      </>
    );
  } else if (stage === 'payment' || stage === 'booking') {
    main = (
      <>
        <StripeNudge />
        <Card className="jr-card jr-waiting">
          <span className="jr-pulse" aria-hidden="true"><UdIcon name={stage === 'payment' ? 'card' : 'calendar'} size={30} /></span>
          <h2>{stage === 'payment' ? tr('قبل العميل عرضك', 'The client accepted your proposal') : tr('تم الدفع، بانتظار اختيار الموعد', 'Paid, waiting for the client to pick a time')}</h2>
          <p>{stage === 'payment' ? tr('بانتظار أن يموّل العميل الاتفاق. لا تبدأ العمل قبل التمويل.', 'Waiting for the client to fund the agreement. Do not start before it is funded.') : tr('سيختار العميل موعدًا من أوقات إتاحتك وستصلك رسالة عند التأكيد.', 'The client will pick a time from your availability and you will be notified when it is confirmed.')}</p>
          <Button variant="ghost" icon="xCircle" onClick={() => setDialog('cancelAgreement')}>{tr('إلغاء الاتفاق', 'Cancel agreement')}</Button>
        </Card>
        <Split agreement={agreement} />
        <ProposalSummary proposal={proposal} title={tr('العرض المتفق عليه', 'Agreed proposal')} />
      </>
    );
  } else if (stage === 'session' || stage === 'done') {
    main = (
      <>
        <Card className="jr-card jr-success" aria-live="polite">
          <span className="jr-success__mark"><UdIcon name={stage === 'done' ? 'checkCircle' : 'calendarCheck'} size={34} /></span>
          <h2>{stage === 'done' ? tr('اكتمل الطلب', 'Request completed') : tr('جلستك محجوزة', 'Your session is booked')}</h2>
          {booking && (
            <ul className="jr-success__facts">
              <li><ClientTile name={invitation.client.firstName} size={40} /><span><small>{tr('العميل', 'Client')}</small><b>{invitation.client.firstName}</b></span></li>
              <li><span className="jr-iconline"><UdIcon name="calendar" size={19} /></span><span><small>{tr('الموعد', 'When')}</small><b>{fmtWeekdayDate(booking.startsAt)} · {fmtTime(booking.startsAt)}</b></span></li>
              <li><span className="jr-iconline"><UdIcon name="video" size={19} /></span><span><small>{tr('النوع', 'Format')}</small><b>{tr(`فيديو · ${agreement.consultationMinutes} دقيقة`, `Video · ${agreement.consultationMinutes} minutes`)}</b></span></li>
            </ul>
          )}
          {stage === 'session' && <div className="jr-actions"><Button variant="secondary" icon="calendar" onClick={() => setDialog('move')}>{tr('تغيير الموعد', 'Move session')}</Button><Button variant="ghost" icon="xCircle" onClick={() => setDialog('cancelBooking')}>{tr('إلغاء الجلسة', 'Cancel session')}</Button></div>}
        </Card>
        <Split agreement={agreement} />
        <ProposalSummary proposal={proposal} title={tr('العرض المتفق عليه', 'Agreed proposal')} />
      </>
    );
  } else {
    const why = invitation.status === 'declined' ? tr('اعتذرت عن هذا الطلب.', 'You declined this request.')
      : proposal?.status === 'rejected' ? tr('اعتذر العميل عن عرضك.', 'The client declined your proposal.')
        : proposal?.status === 'withdrawn' ? tr('سحبت هذا العرض.', 'You withdrew this proposal.')
          : agreement?.status === 'cancelled' ? tr('أُلغي الاتفاق.', 'The agreement was cancelled.') : tr('انتهت صلاحية الطلب.', 'This request expired.');
    main = <Card className="jr-card jr-waiting"><span className="jr-pulse is-muted" aria-hidden="true"><UdIcon name="xCircle" size={30} /></span><h2>{tr('الطلب مغلق', 'This request is closed')}</h2><p>{why}</p><Button variant="secondary" icon="users" to={PATHS.EXPERT_INVITATIONS}>{tr('العودة إلى الطلبات', 'Back to requests')}</Button></Card>;
  }

  const DEMO_STEPS = {
    new: [{ ar: 'هذه دعوة وصلتك من مستخدم', en: 'An invitation from a user' }, { ar: 'راجع الملخص ثم اقبل الطلب لتكتب عرضك. هكذا يرى الخبير الدعوات الواردة له.', en: 'Review the summary, then accept to write your proposal. This is how experts see incoming invitations.' }, []],
    waiting: [{ ar: 'أرسلت عرضك — أين أذهب؟', en: 'Proposal sent — where to go?' }, { ar: 'العميل يراجع العرض من لوحته. ادخل كمستخدم (صاحب الدعوة) لقبول العرض أو طلب تعديل، ثم عد إلى لوحة الخبير.', en: 'The client reviews the proposal from their dashboard. Sign in as the user who invited you to accept or request changes, then return here.' }, USER_HANDOFF],
    payment: [{ ar: 'بانتظار العميل — أين أذهب؟', en: 'Waiting for the client — where to go?' }, { ar: 'على العميل تمويل الاتفاق ثم اختيار الموعد من لوحته. ادخل كمستخدم لإتمام ذلك، ثم عد هنا.', en: 'The client funds the agreement and picks a time from their dashboard. Sign in as the user to do that, then come back.' }, USER_HANDOFF],
    booking: [{ ar: 'بانتظار حجز العميل — أين أذهب؟', en: 'Waiting for the client to book — where to go?' }, { ar: 'تم الدفع. ادخل كمستخدم لاختيار الموعد ثم عد هنا لترى الجلسة.', en: 'Payment is done. Sign in as the user to pick a time, then come back to see the session.' }, USER_HANDOFF],
    session: [{ ar: 'الجلسة محجوزة — وماذا بعد؟', en: 'Session booked — what next?' }, { ar: 'تُجرى الجلسة في موعدها ثم يقيّمك العميل. للاطلاع على المنصة من جهة الإدارة ادخل كمدير، أو عد كمستخدم لتجربة دور آخر.', en: 'The session takes place at the booked time, then the client reviews you. To see the platform from the admin side sign in as an admin, or go back as a user to try another role.' }, [...ADMIN_HANDOFF, ...USER_HANDOFF]],
  };
  const demoStep = DEMO_STEPS[stage];

  return (
    <div className="jr-page">
      <PageHeader icon="users" title={summary.title} subtitle={<span className="ex-head-sub"><Link to={PATHS.EXPERT_INVITATIONS} className="ud-linkbtn">{tr('كل الطلبات', 'All requests')}</Link> <StatusPill tone={meta.tone}>{tx(meta.label)}</StatusPill></span>} />
      <Progress step={requestStep(stage)} closed={stage === 'closed'} />
      {demoStep && <DemoNextStep id={`req-${invitation.id}-${stage}`} title={demoStep[0]} body={demoStep[1]} actions={demoStep[2]} />}
      <div className="jr-offer ex-request">
        <div className="ex-request__main">{main}</div>
        {side}
      </div>
      {dialog === 'decline' && <ReasonDialog title={tr('الاعتذار عن الطلب', 'Decline this request')} description={tr('أخبرنا بالسبب باختصار. يصل اعتذارك للعميل.', 'Tell us why in a word. The client is notified.')} reasons={DECLINE_REASONS} withNote confirmLabel={tr('اعتذر', 'Decline')} busy={declineAction.busy} onClose={() => setDialog(null)} onConfirm={decline} />}
      {dialog === 'withdraw' && <ReasonDialog title={tr('سحب العرض', 'Withdraw the proposal')} description={tr('لن يتمكن العميل من قبوله بعد الآن.', 'The client will no longer be able to accept it.')} reasons={WITHDRAW_REASONS} confirmLabel={tr('سحب العرض', 'Withdraw')} busy={withdrawAction.busy} onClose={() => setDialog(null)} onConfirm={withdraw} />}
      {dialog === 'cancelAgreement' && <ReasonDialog title={tr('إلغاء الاتفاق', 'Cancel the agreement')} description={tr('سيُبلَّغ العميل ويُعاد مبلغه إن كان قد دفع.', 'The client is notified and refunded if they already paid.')} reasons={CANCEL_REASONS} confirmLabel={tr('إلغاء الاتفاق', 'Cancel agreement')} busy={cancelAction.busy} onClose={() => setDialog(null)} onConfirm={cancelAgreement} />}
      {dialog === 'cancelBooking' && <ReasonDialog title={tr('إلغاء الجلسة', 'Cancel the session')} description={tr('سيختار العميل موعدًا جديدًا.', 'The client will pick a new time.')} reasons={CANCEL_REASONS} confirmLabel={tr('إلغاء الجلسة', 'Cancel session')} busy={cancelAction.busy} onClose={() => setDialog(null)} onConfirm={cancelBooking} />}
      {dialog === 'move' && <RescheduleDialog booking={booking} timeZone={timeZone} busy={moveAction.busy} onClose={() => setDialog(null)} onConfirm={move} />}
    </div>
  );
}

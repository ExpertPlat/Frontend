import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useBrandFeedback } from '../../../components/BrandFeedback/BrandFeedback';
import { useIdempotentAction } from '../../../services/hooks';
import { proposalsService } from '../../../services/user/commerceService';
import { useUserI18n } from '../i18n/UserI18nContext';
import UdIcon from '../components/UdIcon';
import { Button, Card, Chip, Dialog, PageHeader, StatusPill } from '../components/ui';
import { CHANGE_REASONS, REJECT_REASONS } from '../utils/statuses';
import { stagePath } from './journeyData';
import DemoNextStep from '../../demo/DemoNextStep';
import DemoBadge from '../../demo/DemoBadge';
import { expertHandoffActions } from '../../demo/demoConfig';
import { useJourney } from './JourneyContext';
import { ExpertLine, useMoney } from './parts';

function Waiting({ invitation, revising }) {
  const { tr } = useUserI18n();
  const expert = invitation.expert;
  const accepted = invitation.status === 'accepted';
  return (
    <Card className="jr-card jr-waiting" aria-live="polite">
      <ExpertLine expert={expert} />
      <span className="jr-pulse" aria-hidden="true"><UdIcon name={revising ? 'edit' : 'clock'} size={30} /></span>
      <h2>{revising ? tr('أرسلنا طلب التعديل', 'Your change request was sent') : accepted ? tr('قبل الخبير دعوتك', 'The expert accepted your invitation') : tr('أُرسلت دعوتك', 'Your invitation was sent')}</h2>
      <p>{revising ? tr('بانتظار العرض المعدّل من الخبير.', 'Waiting for the updated proposal from the expert.') : tr(`بانتظار عرض ${expert.name}. عادةً يرد ${expert.responseTime}.`, `Waiting for the proposal from ${expert.name}. Usually replies ${expert.responseTime}.`)}</p>
    </Card>
  );
}

function RequestDialog({ expert, onClose, onSend, busy }) {
  const { tr, tx } = useUserI18n();
  const [reasons, setReasons] = useState(['price']);
  const [message, setMessage] = useState(tr('هل يمكن تخفيض السعر قليلًا مع إبقاء جلسة الفيديو؟ ميزانيتي محدودة في هذه المرحلة.', 'Could the price be lowered a little while keeping the video session? My budget is limited at this stage.'));
  const toggle = (id) => setReasons((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));
  return (
    <Dialog open onClose={busy ? () => {} : onClose} icon="edit" title={tr('اطلب تعديل العرض', 'Request changes')} description={tr(`سيصل طلبك إلى ${expert.name} ويرسل لك عرضًا معدّلًا.`, `Your request goes to ${expert.name}, who will send an updated proposal.`)}
      footer={<><Button variant="ghost" onClick={onClose} disabled={busy}>{tr('إلغاء', 'Cancel')}</Button><Button icon="send" loading={busy} disabled={!reasons.length || !message.trim()} onClick={() => onSend({ categories: reasons, message })}>{tr('إرسال الطلب', 'Send request')}</Button></>}>
      <div className="jr-invite">
        <span className="ud-field__label">{tr('ما الذي تريد تعديله؟', 'What would you like to change?')}</span>
        <div className="jr-options">{CHANGE_REASONS.map((item) => <button key={item.id} type="button" role="checkbox" aria-checked={reasons.includes(item.id)} className={reasons.includes(item.id) ? 'is-on' : ''} onClick={() => toggle(item.id)}>{reasons.includes(item.id) && <UdIcon name="check" size={15} stroke={2.6} />}{tx(item.label)}</button>)}</div>
        <label className="ud-field__label" htmlFor="jr-change-msg">{tr('رسالتك', 'Your message')}</label>
        <div className="ud-input ud-input--area"><textarea id="jr-change-msg" rows={4} value={message} onChange={(event) => setMessage(event.target.value)} /></div>
      </div>
    </Dialog>
  );
}

function RejectDialog({ onClose, onReject, busy }) {
  const { tr, tx } = useUserI18n();
  const [reason, setReason] = useState('price');
  return (
    <Dialog open onClose={busy ? () => {} : onClose} size="sm" icon="xCircle" tone="danger" title={tr('رفض العرض', 'Decline the proposal')} description={tr('أخبرنا بالسبب باختصار، ولا يُدفع أي مبلغ.', 'Tell us why in a word. Nothing is charged.')}
      footer={<><Button variant="ghost" onClick={onClose} disabled={busy}>{tr('تراجع', 'Go back')}</Button><Button variant="danger" loading={busy} onClick={() => onReject({ reasonCode: reason })}>{tr('رفض العرض', 'Decline')}</Button></>}>
      <div className="jr-reasons" role="radiogroup">
        {REJECT_REASONS.map((item) => <button key={item.id} type="button" role="radio" aria-checked={reason === item.id} className={reason === item.id ? 'is-on' : ''} onClick={() => setReason(item.id)}><i />{tx(item.label)}</button>)}
      </div>
    </Dialog>
  );
}

/** Stage 4: the expert's reply. Accept / ask for changes / decline, always from the state the API returned. */
export default function OfferStep() {
  const { tr, fmtNumber, fmtDate } = useUserI18n();
  const money = useMoney();
  const navigate = useNavigate();
  const { notify } = useBrandFeedback();
  const journey = useJourney();
  const { caseId, invitations, proposals, agreements } = journey;
  const [params, setParams] = useSearchParams();
  const [dialog, setDialog] = useState(null);
  // One key per logical intent: a retry of the same intent reuses its key, a different intent never does.
  const acceptAction = useIdempotentAction('accept');
  const changeAction = useIdempotentAction('change');
  const rejectAction = useIdempotentAction('reject');

  const threads = useMemo(() => invitations
    .filter((inv) => !['revoked'].includes(inv.status))
    .map((inv) => ({ invitation: inv, proposal: proposals.find((p) => p.invitationId === inv.id) || null }))
    .sort((a, b) => String(b.invitation.sentAt).localeCompare(String(a.invitation.sentAt))), [invitations, proposals]);
  const wanted = Number(params.get('expert'));
  const thread = threads.find((t) => t.invitation.expert.id === wanted) || threads.find((t) => t.proposal?.status === 'submitted') || threads[0];
  const waiting = thread && (!thread.proposal || thread.proposal.status === 'change_requested') && ['pending', 'accepted'].includes(thread.invitation.status);

  // While nothing has arrived yet, look again every few seconds (the backend pushes no events to the browser).
  useEffect(() => {
    if (!waiting) return undefined;
    const timer = window.setInterval(() => journey.refresh(), 12000);
    return () => window.clearInterval(timer);
  }, [waiting, journey]);

  if (journey.reached < 3 && !journey.loading) return <Navigate to={stagePath(caseId, 'experts')} replace />;
  if (!thread) return null;
  const { invitation, proposal } = thread;
  const expert = invitation.expert;
  const acceptedAgreement = proposal?.status === 'accepted' && agreements.find((a) => a.proposalId === proposal.id);
  if (acceptedAgreement) return <Navigate to={stagePath(caseId, 'agreement')} replace />;

  const act = async (action, call, after) => {
    const result = await action.run(call);
    if (!result.ok) {
      if (result.error?.status === 409) await journey.refresh();
      notify({ message: result.message, tone: 'error' }); setDialog(null); return;
    }
    setDialog(null); await journey.refresh(); after?.(result.data);
  };
  const accept = () => act(acceptAction, ({ idempotencyKey }) => proposalsService.accept(caseId, proposal, { idempotencyKey }), () => { notify({ message: tr('قبلت العرض. تابع إلى الاتفاق.', 'Proposal accepted. On to the agreement.'), tone: 'success' }); navigate(stagePath(caseId, 'agreement')); });
  const requestChange = (payload) => act(changeAction, ({ idempotencyKey }) => proposalsService.requestChange(caseId, proposal, payload, { idempotencyKey }));
  const reject = (payload) => act(rejectAction, ({ idempotencyKey }) => proposalsService.reject(caseId, proposal, payload, { idempotencyKey }));

  const header = <PageHeader icon="fileCheck" title={proposal?.status === 'submitted' ? tr('عرض الخبير', 'Expert proposal') : tr('العرض', 'Proposal')} subtitle={proposal?.status === 'submitted' ? tr('اقرأ العرض، ثم اقبله أو اطلب تعديله أو ارفضه.', 'Read it, then accept, ask for changes or decline.') : tr('عندما يرسل الخبير عرضه سيظهر هنا.', 'The expert’s proposal will appear here.')} />;
  const switcher = threads.length > 1 && (
    <div className="jr-threads" role="tablist" aria-label={tr('الخبراء المدعوون', 'Invited experts')}>
      {threads.map((t) => (
        <button key={t.invitation.id} type="button" role="tab" aria-selected={t === thread} className={t === thread ? 'is-on' : ''} onClick={() => setParams({ expert: t.invitation.expert.id })}>{t.invitation.expert.name}<DemoBadge show={t.invitation.expert.isDemo} compact /></button>
      ))}
    </div>
  );
  const backToExperts = <Button icon="users" onClick={() => navigate(stagePath(caseId, 'experts'))}>{tr('العودة إلى الخبراء', 'Back to experts')}</Button>;

  if (['declined', 'expired'].includes(invitation.status) || proposal?.status === 'rejected' || proposal?.status === 'withdrawn' || proposal?.status === 'expired') {
    const title = invitation.status === 'declined' ? tr('اعتذر الخبير عن الدعوة', 'The expert declined the invitation') : proposal?.status === 'rejected' ? tr('رفضت العرض', 'You declined the proposal') : proposal?.status === 'withdrawn' ? tr('سحب الخبير عرضه', 'The expert withdrew the proposal') : tr('انتهت صلاحية الدعوة', 'The invitation expired');
    return (
      <div className="jr-page jr-page--narrow">{header}{switcher}
        <Card className="jr-card jr-waiting"><span className="jr-pulse is-muted" aria-hidden="true"><UdIcon name="xCircle" size={30} /></span><h2>{title}</h2><p>{tr('لا بأس. يمكنك دعوة خبير آخر من القائمة.', 'No problem. You can invite another expert from the list.')}</p>{backToExperts}</Card>
      </div>
    );
  }

  if (waiting) {
    return (
      <div className="jr-page jr-page--narrow">{header}{switcher}<Waiting invitation={invitation} revising={proposal?.status === 'change_requested'} />
        <DemoNextStep id={`offer-wait-${invitation.id}-${proposal?.status || 'none'}`}
          title={{ ar: 'بانتظار الخبير — أين أذهب؟', en: 'Waiting for the expert — where to go?' }}
          body={{ ar: proposal?.status === 'change_requested' ? 'الخبير يعدّل عرضه من لوحته. ادخل كخبير (حساب تجريبي) لتعديل العرض، ثم عد هنا.' : 'ادخل كالخبير (حساب تجريبي) لقبول الدعوة وكتابة العرض من لوحته، ثم عد هنا. هذه الصفحة تتحدّث تلقائيًا.', en: proposal?.status === 'change_requested' ? 'The expert revises the proposal from their dashboard. Sign in as the expert (demo account), revise it, then come back.' : 'Sign in as the expert (demo account) to accept the invitation and write the proposal from their dashboard, then come back. This page refreshes by itself.' }}
          actions={expertHandoffActions([invitation.expert])} />
      </div>
    );
  }

  const current = proposal.current;
  const revised = proposal.versions.length > 1;
  const previous = revised ? proposal.versions[proposal.versions.length - 2].amount : null;
  return (
    <div className="jr-page">
      {header}{switcher}
      {revised && <div className="jr-banner is-success"><UdIcon name="checkCircle" size={20} /><span>{tr('عدّل الخبير عرضه بناءً على طلبك.', 'The expert updated the proposal as you asked.')}</span></div>}
      <div className="jr-offer">
        <Card className="jr-card jr-offer__main">
          <div className="jr-offer__head">
            <ExpertLine expert={expert} />
            <StatusPill tone="amber">{tr(`صالح حتى ${fmtDate(proposal.expiresAt)}`, `Valid until ${fmtDate(proposal.expiresAt)}`)}</StatusPill>
          </div>
          <section><h3><UdIcon name="target" size={18} />{tr('ماذا سيقدّم لك؟', 'What you get')}</h3><p>{current.scopeSummary}</p></section>
          <section><h3><UdIcon name="checkCircle" size={18} />{tr('المخرجات', 'Deliverables')}</h3><ul className="jr-list">{current.deliverables.map((d, i) => <li key={i}><UdIcon name="check" size={14} stroke={2.6} />{d.title}</li>)}</ul></section>
          <section><h3><UdIcon name="ban" size={18} />{tr('غير مشمول', 'Not included')}</h3><ul className="jr-list is-muted">{current.exclusions.map((d, i) => <li key={i}><UdIcon name="minus" size={14} />{d}</li>)}</ul></section>
          {current.inputsRequired && <section><h3><UdIcon name="paperclip" size={18} />{tr('ما يحتاجه منك', 'What he or she needs from you')}</h3><p>{current.inputsRequired}</p></section>}
        </Card>

        <aside className="jr-offer__side">
          <Card className="jr-card jr-price">
            <small>{tr('إجمالي العرض', 'Proposal total')}</small>
            <b>{previous && <s>{money(previous)}</s>}{money(current.amount)}</b>
            <Chip icon="video">{tr(`جلسة فيديو ${fmtNumber(current.consultationMinutes)} دقيقة`, `${fmtNumber(current.consultationMinutes)}-minute video session`)}</Chip>
            <ol className="jr-miles">{current.milestones.map((m, i) => <li key={i}><span>{m.title}</span><b>{money({ amountMinor: m.amountMinor, currency: current.currency })}</b></li>)}</ol>
            <p className="jr-safe"><UdIcon name="shieldCheck" size={16} />{tr('المبلغ محفوظ لدى المنصة ولا يصل للخبير إلا عند الإنجاز.', 'Funds are held by the platform and released only on delivery.')}</p>
            <Button size="lg" icon="check" loading={acceptAction.busy} onClick={accept}>{tr('أقبل العرض', 'Accept proposal')}</Button>
            {!revised && <Button variant="secondary" icon="edit" onClick={() => setDialog('change')}>{tr('اطلب تعديلًا', 'Request changes')}</Button>}
            <button type="button" className="jr-decline" onClick={() => setDialog('reject')}>{tr('رفض العرض', 'Decline')}</button>
          </Card>
        </aside>
      </div>
      {dialog === 'change' && <RequestDialog expert={expert} busy={changeAction.busy} onClose={() => setDialog(null)} onSend={requestChange} />}
      {dialog === 'reject' && <RejectDialog busy={rejectAction.busy} onClose={() => setDialog(null)} onReject={reject} />}
    </div>
  );
}

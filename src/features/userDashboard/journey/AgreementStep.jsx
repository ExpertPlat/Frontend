import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useBrandFeedback } from '../../../components/BrandFeedback/BrandFeedback';
import { PATHS } from '../../../routes/paths';
import { useIdempotentAction, useResource } from '../../../services/hooks';
import DemoNextStep from '../../demo/DemoNextStep';
import { expertHandoffActions } from '../../demo/demoConfig';
import { agreementsService, bookingsService, fundingService } from '../../../services/user/commerceService';
import { userApi } from '../../../services/http';
import { useUserI18n } from '../i18n/UserI18nContext';
import UdIcon from '../components/UdIcon';
import { Avatar, Button, Card, CardHeader, Dialog, PageHeader, SkeletonRows, StatusPill } from '../components/ui';
import { stagePath } from './journeyData';
import { useJourney } from './JourneyContext';
import { IconLine, LoadError, useMoney } from './parts';

/**
 * Local development only: when the backend runs with PAYMENTS_DRIVER=fake it answers with a `mock://` checkout URL
 * (no Stripe). This dialog then completes the payment through the backend's dev route. In production the browser is
 * sent to the provider's https URL and SolveIt never sees card details.
 */
function MockCheckout({ funding, amountLabel, onClose, onPaid }) {
  const { tr } = useUserI18n();
  const [paying, setPaying] = useState(false);
  const pay = async () => { setPaying(true); try { await userApi.post(`/api/__mock/fundings/${funding.id}/complete`, {}); await onPaid(); } finally { setPaying(false); } };
  return (
    <Dialog open onClose={paying ? () => {} : onClose} size="sm" icon="card" title={tr('صفحة الدفع (محاكاة)', 'Checkout page (simulation)')} description={tr('في النسخة الحقيقية تنتقل إلى صفحة الدفع الآمنة لدى مزوّد الدفع، ولا تُدخل بيانات البطاقة داخل SolveIt.', 'In the real product you are sent to the payment provider’s secure page; card details are never entered inside SolveIt.')}
      footer={<><Button variant="ghost" onClick={onClose} disabled={paying}>{tr('إلغاء', 'Cancel')}</Button><Button icon="lock" loading={paying} onClick={pay}>{tr('أكمل الدفع التجريبي', 'Complete test payment')} · {amountLabel}</Button></>}>
      <p className="jr-lead">{tr('لا يتم أي خصم حقيقي.', 'Nothing is charged.')}</p>
    </Dialog>
  );
}

/** Stage 5: fund the agreement (hosted checkout), then book the session. */
export default function AgreementStep() {
  const { tr, fmtNumber, fmtWeekday, fmtDayMonth, fmtTime, fmtWeekdayDate } = useUserI18n();
  const money = useMoney();
  const { notify } = useBrandFeedback();
  const journey = useJourney();
  const { caseId, agreements } = journey;
  const [params, setParams] = useSearchParams();
  const agreement = useMemo(() => agreements.filter((a) => a.status !== 'cancelled').sort((a, b) => String(b.createdAt).localeCompare(a.createdAt))[0], [agreements]);
  const agreementId = agreement?.id;
  const funding = useResource(() => fundingService.get(caseId, agreementId), [caseId, agreementId], { enabled: !!agreementId });
  const funded = funding.data?.status === 'funded';
  const bookings = useResource(() => bookingsService.list(caseId, agreementId), [caseId, agreementId, funded], { enabled: !!agreementId });
  const availability = useResource(() => agreementsService.availability(caseId, agreementId), [caseId, agreementId], { enabled: !!agreementId && funded });
  const fundAction = useIdempotentAction('funding');
  const bookAction = useIdempotentAction('booking');
  const [checkout, setCheckout] = useState(null);
  const [day, setDay] = useState(0);
  const [slot, setSlot] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const returned = params.get('funding');
  const polling = useRef(false);

  // Coming back from the hosted checkout: the redirect proves nothing. Ask the API until it says the funding succeeded.
  useEffect(() => {
    if (!returned || !agreementId || polling.current) return undefined;
    polling.current = true; setVerifying(true);
    let tries = 0; let timer;
    const check = async () => {
      tries += 1;
      try {
        const latest = await fundingService.sync(caseId, returned);
        if (latest.status === 'funded' || tries >= 8 || ['failed', 'expired'].includes(latest.status)) {
          setVerifying(false); params.delete('funding'); setParams(params, { replace: true });
          await Promise.all([funding.reload({ silent: true }), journey.refresh()]);
          return;
        }
      } catch { if (tries >= 8) { setVerifying(false); return; } }
      timer = window.setTimeout(check, 3000);
    };
    check();
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returned, agreementId]);

  if (!journey.loading && !agreement) return <Navigate to={stagePath(caseId, 'offer')} replace />;
  if (!agreement) return <div className="jr-page jr-page--narrow"><Card><SkeletonRows rows={4} /></Card></div>;

  const expert = agreement.expert;
  const total = money(agreement.amount);
  const booking = (bookings.data || []).find((b) => ['held', 'confirmed', 'completed'].includes(b.status));
  const days = (availability.data?.days || []).filter((d) => d.slots.length);

  const pay = async () => {
    const result = await fundAction.run(async ({ idempotencyKey }) => {
      const open = funding.data || await fundingService.open(caseId, agreementId, { idempotencyKey: `${idempotencyKey}-open` });
      const session = await fundingService.checkout(caseId, open.id, { idempotencyKey });
      return { open, session };
    });
    if (!result.ok) { notify({ message: result.message, tone: 'error' }); return; }
    const { open, session } = result.data;
    if (import.meta.env.DEV && String(session.checkoutUrl).startsWith('mock://')) { setCheckout(open); return; }
    if (!/^https:\/\//i.test(session.checkoutUrl)) { notify({ message: tr('رابط الدفع غير صالح.', 'The payment link is not valid.'), tone: 'error' }); return; }
    window.location.assign(session.checkoutUrl);
  };
  const paid = async () => { setCheckout(null); const latest = await fundingService.sync(caseId, checkout.id); await Promise.all([funding.reload({ silent: true }), journey.refresh()]); if (latest.status === 'funded') notify({ message: tr('تم تمويل الاتفاق.', 'The agreement is funded.'), tone: 'success' }); };
  const book = async () => {
    const result = await bookAction.run(({ idempotencyKey }) => bookingsService.book(caseId, agreementId, slot, { idempotencyKey }));
    if (!result.ok) { notify({ message: result.message, tone: 'error' }); setSlot(null); availability.reload({ silent: true }); return; }
    await Promise.all([bookings.reload({ silent: true }), journey.refresh()]);
  };

  if (booking) {
    return (
      <div className="jr-page jr-page--narrow">
        <Card className="jr-card jr-success" aria-live="polite">
          <span className="jr-success__mark"><UdIcon name="calendarCheck" size={34} /></span>
          <h2>{tr('تم الاتفاق وحجز موعدك', 'Agreed, funded and booked')}</h2>
          <p>{tr('أنت وخبيرك جاهزان. سنرسل لك تذكيرًا ورابط الجلسة قبل الموعد.', 'You and your expert are all set. We will send a reminder and the session link beforehand.')}</p>
          <ul className="jr-success__facts">
            <li><Avatar src={expert.avatarUrl} name={expert.name} size={40} /><span><small>{tr('الخبير', 'Expert')}</small><b>{expert.name}</b></span></li>
            <li><IconLine icon="calendar" /><span><small>{tr('الموعد', 'When')}</small><b>{fmtWeekdayDate(booking.startsAt)} · {fmtTime(booking.startsAt)}</b></span></li>
            <li><IconLine icon="video" /><span><small>{tr('النوع', 'Format')}</small><b>{tr(`فيديو · ${fmtNumber(agreement.consultationMinutes)} دقيقة`, `Video · ${fmtNumber(agreement.consultationMinutes)} minutes`)}</b></span></li>
            <li><IconLine icon="shieldCheck" /><span><small>{tr('المبلغ المحفوظ', 'Held in escrow')}</small><b>{total}</b></span></li>
          </ul>
          <div className="jr-actions"><Button variant="secondary" icon="calendar" to={PATHS.USER_APPOINTMENTS}>{tr('مواعيدي', 'My appointments')}</Button><Button icon="home" to={PATHS.USER_DASHBOARD}>{tr('الرئيسية', 'Home')}</Button></div>
        </Card>
        <DemoNextStep id={`booked-${booking.id}`}
          title={{ ar: `تم الحجز — ما الخطوة التالية؟`, en: 'Booked — what next?' }}
          body={{ ar: `الخبير يرى الاتفاق والحجز في لوحته ويتعامل معهما من هناك. افتح لوحة ${expert.name} (حساب تجريبي) لتراها بعينه. وللاطلاع على المنصة من جهة الإدارة ادخل كمدير.`, en: `The expert sees the agreement and booking in their own dashboard and handles them there. Open ${expert.name}'s dashboard (demo account) to see it from their side. To view the platform from the admin side, sign in as an admin.` }}
          actions={[...expertHandoffActions([expert]), { role: 'admin', email: 'admin@solveit.test', label: { ar: 'دخول كمدير المنصة', en: 'Sign in as platform admin' } }]} />
      </div>
    );
  }

  const status = funding.data?.status;
  return (
    <div className="jr-page jr-page--narrow">
      <PageHeader icon="calendarCheck" title={tr('الاتفاق والموعد', 'Agreement and booking')} subtitle={tr('خطوتان فقط: أمّن المبلغ، ثم اختر الموعد.', 'Two quick steps: fund the agreement, then pick a time.')} />
      {verifying && <div className="jr-banner is-info" aria-live="polite"><UdIcon name="clock" size={20} /><span>{tr('نتحقق من الدفع لدى مزوّد الخدمة… لا تغلق الصفحة.', 'Checking the payment with the provider… keep this page open.')}</span></div>}
      <Card className="jr-card jr-agree">
        <div className="jr-agree__row"><Avatar src={expert.avatarUrl} name={expert.name} size={48} /><span><b>{expert.name}</b><small>{expert.title}</small></span><StatusPill tone="success">{tr('عرض مقبول', 'Accepted')}</StatusPill></div>
        <p className="jr-agree__scope">{agreement.scopeSummary}</p>
        <div className="jr-agree__total"><span>{tr('الإجمالي', 'Total')}</span><b>{total}</b></div>
      </Card>

      <Card className={`jr-card jr-stage${funded ? ' is-done' : ''}`}>
        <CardHeader icon="card" title={tr('1. تمويل الاتفاق', '1. Fund the agreement')} aside={funded && <StatusPill tone="success">{tr('تم التمويل', 'Funded')}</StatusPill>} />
        {funding.error && <LoadError message={funding.errorMessage} onRetry={() => funding.reload()} />}
        <p className="jr-lead">{funded ? tr('المبلغ محفوظ بأمان لدى المنصة.', 'Your payment is held safely by the platform.') : status === 'processing' ? tr('نتحقق من دفعتك. سيتفعّل الحجز تلقائيًا عند التأكيد.', 'We are verifying your payment. Booking unlocks as soon as it is confirmed.') : status === 'failed' ? tr('تعذّرت الدفعة. يمكنك المحاولة مرة أخرى.', 'The payment did not go through. You can try again.') : tr('يُحفظ المبلغ لدى المنصة ولا يُحوَّل للخبير إلا بعد تسليم العمل. ستنتقل إلى صفحة دفع آمنة.', 'The amount is held by the platform and only released to the expert after delivery. You will be taken to a secure payment page.')}</p>
        {!funded && status !== 'processing' && <Button icon="lock" loading={fundAction.busy} onClick={pay}>{tr('أمّن المبلغ', 'Fund now')} · {total}</Button>}
        {status === 'processing' && <Button variant="secondary" icon="refresh" onClick={() => fundingService.sync(caseId, funding.data.id).then(() => funding.reload({ silent: true }))}>{tr('تحقّق الآن', 'Check now')}</Button>}
      </Card>

      <Card className={`jr-card jr-stage${funded ? '' : ' is-locked'}`}>
        <CardHeader icon="calendar" title={tr('2. اختر موعد الجلسة', '2. Pick the session time')} />
        {!funded && <p className="jr-lead">{tr('يتفعّل الحجز بعد تمويل الاتفاق.', 'Booking unlocks once the agreement is funded.')}</p>}
        {funded && availability.loading && <SkeletonRows rows={2} />}
        {funded && availability.error && <LoadError message={availability.errorMessage} onRetry={() => availability.reload()} />}
        {funded && days.length === 0 && !availability.loading && !availability.error && <p className="jr-lead">{tr('لا توجد مواعيد متاحة حاليًا. سنخبرك عند توفرها.', 'No times are available right now. We will tell you when some open up.')}</p>}
        {funded && days.length > 0 && (
          <>
            <div className="jr-days" role="radiogroup" aria-label={tr('اليوم', 'Day')}>
              {days.map((item, index) => <button key={item.date} type="button" role="radio" aria-checked={day === index} className={day === index ? 'is-on' : ''} onClick={() => { setDay(index); setSlot(null); }}><b>{fmtWeekday(item.slots[0].startsAt)}</b><small>{fmtDayMonth(item.slots[0].startsAt)}</small></button>)}
            </div>
            <div className="jr-times" role="radiogroup" aria-label={tr('الوقت', 'Time')}>
              {(days[Math.min(day, days.length - 1)].slots).map((item) => <button key={item.startsAt} type="button" role="radio" aria-checked={slot === item.startsAt} className={slot === item.startsAt ? 'is-on' : ''} onClick={() => setSlot(item.startsAt)}>{fmtTime(item.startsAt)}</button>)}
            </div>
          </>
        )}
        <div className="jr-actions"><Button size="lg" icon="calendarCheck" loading={bookAction.busy} disabled={!funded || !slot} onClick={book}>{tr('أكّد الموعد', 'Confirm booking')}</Button></div>
      </Card>

      {checkout && <MockCheckout funding={checkout} amountLabel={total} onClose={() => setCheckout(null)} onPaid={paid} />}
    </div>
  );
}

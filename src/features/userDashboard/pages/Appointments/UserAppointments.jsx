import React, { useState } from 'react';
import { useBrandFeedback } from '../../../../components/BrandFeedback/BrandFeedback';
import { getErrorMessage } from '../../../../api/errorHandler';
import { useResource } from '../../../../services/hooks';
import { agreementsService, bookingsService } from '../../../../services/user/commerceService';
import { workspaceService } from '../../../../services/user/workspaceService';
import { useUserI18n } from '../../i18n/UserI18nContext';
import UdIcon from '../../components/UdIcon';
import { Avatar, Button, Card, Dialog, EmptyState, PageHeader, SkeletonRows, StatusPill } from '../../components/ui';
import { BOOKING_STATUS, pick } from '../../utils/statuses';
import { stagePath } from '../../journey/journeyData';
import { LoadError } from '../../journey/parts';

function RescheduleDialog({ booking, onClose, onDone }) {
  const { tr, fmtWeekday, fmtDayMonth, fmtTime } = useUserI18n();
  const { notify } = useBrandFeedback();
  const availability = useResource(() => agreementsService.availability(booking.caseId, booking.agreementId), [booking.id]);
  const [slot, setSlot] = useState(null);
  const [busy, setBusy] = useState(false);
  const days = (availability.data?.days || []).filter((d) => d.slots.length);
  const save = async () => {
    setBusy(true);
    try { await bookingsService.reschedule(booking.caseId, booking, slot); notify({ message: tr('تم تغيير الموعد.', 'The session was rescheduled.'), tone: 'success' }); onDone(); } catch (error) { notify({ message: getErrorMessage(error), tone: 'error' }); } finally { setBusy(false); }
  };
  return (
    <Dialog open onClose={busy ? () => {} : onClose} icon="calendar" title={tr('تغيير موعد الجلسة', 'Reschedule the session')} footer={<><Button variant="ghost" onClick={onClose} disabled={busy}>{tr('إلغاء', 'Cancel')}</Button><Button icon="check" loading={busy} disabled={!slot} onClick={save}>{tr('احفظ الموعد الجديد', 'Save the new time')}</Button></>}>
      {availability.loading && <SkeletonRows rows={2} />}
      {availability.error && <LoadError message={availability.errorMessage} onRetry={() => availability.reload()} />}
      {days.map((day) => (
        <div key={day.date} className="jr-resched">
          <b>{fmtWeekday(day.slots[0].startsAt)} · {fmtDayMonth(day.slots[0].startsAt)}</b>
          <div className="jr-times">{day.slots.map((s) => <button key={s.startsAt} type="button" className={slot === s.startsAt ? 'is-on' : ''} onClick={() => setSlot(s.startsAt)}>{fmtTime(s.startsAt)}</button>)}</div>
        </div>
      ))}
    </Dialog>
  );
}

/** Sessions the person has booked, upcoming first. */
export default function UserAppointments() {
  const { tr, tx, fmtWeekdayDate, fmtTime, fmtNumber } = useUserI18n();
  const { notify } = useBrandFeedback();
  const workspace = useResource(() => workspaceService.load(), []);
  const [moving, setMoving] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const d = workspace.data;
  const now = new Date().toISOString();
  const all = [...(d?.bookings || [])].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const upcoming = all.filter((b) => ['held', 'confirmed'].includes(b.status) && b.endsAt > now);
  const past = all.filter((b) => !upcoming.includes(b)).reverse();

  const cancel = async () => {
    const booking = cancelling; setCancelling(null);
    try { await bookingsService.cancel(booking.caseId, booking, 'other'); notify({ message: tr('أُلغيت الجلسة.', 'The session was cancelled.'), tone: 'success' }); workspace.reload({ silent: true }); } catch (error) { notify({ message: getErrorMessage(error), tone: 'error' }); }
  };
  const card = (b, actions) => {
    const status = pick(BOOKING_STATUS, b.status);
    return (
      <li key={b.id}><Avatar src={b.expert.avatarUrl} name={b.expert.name} size={44} /><span className="jr-rows__copy"><b>{fmtWeekdayDate(b.startsAt)} · {fmtTime(b.startsAt)}</b><small>{b.expert.name} · {b.caseTitle}</small><small><UdIcon name="video" size={14} /> {tr('فيديو', 'Video')} · {tr(`${fmtNumber(60)} دقيقة`, `${fmtNumber(60)} min`)}</small></span><StatusPill tone={status.tone}>{tx(status.label)}</StatusPill>{actions}</li>
    );
  };
  return (
    <div className="jr-page">
      <PageHeader icon="calendar" title={tr('المواعيد', 'Appointments')} subtitle={tr('جلساتك مع الخبراء عن بُعد عبر الفيديو.', 'Your remote video sessions with experts.')} />
      {workspace.error && <LoadError message={workspace.errorMessage} onRetry={() => workspace.reload()} />}
      {workspace.loading && !d && <Card className="jr-card"><SkeletonRows rows={3} /></Card>}
      {d && (
        <>
          <Card className="jr-card jr-block">
            <h2 className="jr-h2">{tr('القادمة', 'Upcoming')}</h2>
            {upcoming.length === 0
              ? <EmptyState icon="calendar" title={tr('لا توجد جلسات قادمة', 'No upcoming sessions')} description={tr('تحجز جلستك بعد قبول عرض الخبير وتمويل الاتفاق.', 'You book after accepting an offer and funding the agreement.')} />
              : <ul className="jr-rows jr-rows--people">{upcoming.map((b) => card(b, <span className="jr-rows__btns"><Button size="sm" variant="secondary" onClick={() => setMoving(b)}>{tr('تغيير الموعد', 'Reschedule')}</Button><Button size="sm" variant="ghost" onClick={() => setCancelling(b)}>{tr('إلغاء', 'Cancel')}</Button></span>))}</ul>}
          </Card>
          {past.length > 0 && <Card className="jr-card jr-block"><h2 className="jr-h2">{tr('السابقة', 'Past')}</h2><ul className="jr-rows jr-rows--people">{past.map((b) => card(b, b.status === 'completed' ? <Button size="sm" variant="ghost" to={stagePath(b.caseId, 'agreement')}>{tr('التفاصيل', 'Details')}</Button> : null))}</ul></Card>}
        </>
      )}
      {moving && <RescheduleDialog booking={moving} onClose={() => setMoving(null)} onDone={() => { setMoving(null); workspace.reload({ silent: true }); }} />}
      <Dialog open={!!cancelling} onClose={() => setCancelling(null)} size="sm" icon="xCircle" tone="danger" title={tr('إلغاء الجلسة؟', 'Cancel this session?')} description={tr('يمكنك حجز موعد آخر بعد الإلغاء.', 'You can book another time afterwards.')} footer={<><Button variant="ghost" onClick={() => setCancelling(null)}>{tr('تراجع', 'Go back')}</Button><Button variant="danger" onClick={cancel}>{tr('إلغاء الجلسة', 'Cancel session')}</Button></>} />
    </div>
  );
}

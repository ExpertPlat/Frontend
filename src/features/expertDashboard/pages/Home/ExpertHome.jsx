import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '../../../../routes/paths';
import { useResource } from '../../../../services/hooks';
import { expertWorkspaceService } from '../../../../services/expert/expertWorkspaceService';
import { expertStripeService } from '../../../../services/expert/expertWorkService';
import UdIcon from '../../../userDashboard/components/UdIcon';
import { Button, Card, CardHeader, EmptyState, IconTile, PageHeader, SkeletonRows, StatusPill } from '../../../userDashboard/components/ui';
import { useUserI18n } from '../../../userDashboard/i18n/UserI18nContext';
import { LoadError } from '../../../userDashboard/journey/parts';
import { ClientTile } from '../../common/parts';
import { useExpertSession } from '../../session/ExpertSessionContext';
import { NEEDS_ACTION, REQUEST_ACTION, REQUEST_STAGE, stageOfRequest } from '../../utils/expertStatuses';

const requestPath = (id) => PATHS.EXPERT_INVITATION_DETAIL.replace(':invitationId', id);

/** Home: what needs the expert now, the next sessions, and a nudge when the account is not ready to earn. */
export default function ExpertHome() {
  const { tr, tx, fmtWeekdayDate, fmtTime, fmtNumber } = useUserI18n();
  const { me, verified } = useExpertSession();
  const work = useResource(() => expertWorkspaceService.load(), [verified], { enabled: verified });
  const stripe = useResource(() => expertStripeService.account(), [verified], { enabled: verified });
  const requests = work.data?.requests || [];

  const todo = useMemo(() => requests.map((row) => ({ row, stage: stageOfRequest(row) })).filter((item) => NEEDS_ACTION.includes(item.stage)), [requests]);
  const upcoming = useMemo(() => requests.filter((r) => r.booking && ['confirmed', 'held'].includes(r.booking.status) && new Date(r.booking.startsAt) > new Date()).sort((a, b) => a.booking.startsAt.localeCompare(b.booking.startsAt)).slice(0, 3), [requests]);
  const open = requests.filter((r) => !['closed', 'done'].includes(stageOfRequest(r))).length;
  const done = requests.filter((r) => stageOfRequest(r) === 'done').length;

  return (
    <div className="jr-page">
      <PageHeader icon="home" title={me ? tr(`أهلًا ${String(me.name).split(' ')[0]}`, `Welcome, ${String(me.name).split(' ')[0]}`) : tr('أهلًا بك', 'Welcome')} subtitle={tr('كل ما يحتاج منك إجراءً في مكان واحد.', 'Everything that needs you, in one place.')} />

      {!verified && (
        <Card className="jr-card jr-hero">
          <IconTile icon="shieldCheck" tone="peach" size={64} iconSize={30} />
          <div><h2>{tr('وثّق حسابك لتبدأ باستقبال الطلبات', 'Verify your account to start getting requests')}</h2><p>{tr('نراجع هويتك ومؤهلاتك مرة واحدة، وبعدها يظهر ملفك للعملاء.', 'We check your identity and credentials once, then your profile becomes visible to clients.')}</p></div>
          <Button size="lg" icon="arrowRight" iconDir to={PATHS.EXPERT_KYC}>{tr('ابدأ التوثيق', 'Start verification')}</Button>
        </Card>
      )}

      {verified && stripe.data && stripe.data.status !== 'enabled' && (
        <div className="jr-banner is-warning"><UdIcon name="wallet" size={20} /><span>{tr('أكمل إعداد حساب استلام الأرباح كي تصلك مستحقاتك.', 'Finish setting up your payout account so you can be paid.')}</span><Button size="sm" variant="secondary" to={PATHS.EXPERT_PAYMENTS}>{tr('إعداد الحساب', 'Set up')}</Button></div>
      )}

      {verified && work.error && <LoadError message={work.errorMessage} onRetry={() => work.reload()} />}
      {verified && work.loading && !work.data && <Card className="jr-card"><SkeletonRows rows={3} /></Card>}

      {verified && work.data && (
        <>
          <div className="ex-stats">
            <Card className="jr-card ex-stat"><b>{fmtNumber(todo.length)}</b><small>{tr('تحتاج إجراءً', 'Need action')}</small></Card>
            <Card className="jr-card ex-stat"><b>{fmtNumber(open)}</b><small>{tr('طلبات جارية', 'Open requests')}</small></Card>
            <Card className="jr-card ex-stat"><b>{fmtNumber(upcoming.length)}</b><small>{tr('جلسات قادمة', 'Upcoming sessions')}</small></Card>
            <Card className="jr-card ex-stat"><b>{fmtNumber(done)}</b><small>{tr('طلبات مكتملة', 'Completed')}</small></Card>
          </div>
          <div className="jr-grid jr-grid--even">
            <Card className="jr-card jr-block">
              <CardHeader icon="bell" title={tr('بانتظار إجراء منك', 'Needs your attention')} aside={<Link className="ud-linkbtn" to={PATHS.EXPERT_INVITATIONS}>{tr('كل الطلبات', 'All requests')}</Link>} />
              {todo.length === 0
                ? <p className="jr-lead">{tr('لا شيء يحتاج إجراءً الآن.', 'Nothing needs your action right now.')}</p>
                : <ul className="jr-rows">{todo.map(({ row, stage }) => (
                  <li key={row.invitation.id}><ClientTile name={row.invitation.client.firstName} size={40} /><span className="jr-rows__copy"><b>{row.invitation.caseSummary.title}</b><small>{row.invitation.client.firstName} · {tx(REQUEST_STAGE[stage].label)}</small></span><Button size="sm" variant="secondary" to={requestPath(row.invitation.id)}>{tx(REQUEST_ACTION[stage])}</Button></li>
                ))}</ul>}
            </Card>
            <Card className="jr-card jr-block">
              <CardHeader icon="calendar" title={tr('جلساتي القادمة', 'Upcoming sessions')} aside={<Link className="ud-linkbtn" to={PATHS.EXPERT_BOOKINGS}>{tr('عرض الكل', 'View all')}</Link>} />
              {upcoming.length === 0
                ? <EmptyState icon="calendar" title={tr('لا توجد جلسات قادمة', 'No upcoming sessions')} description={tr('تظهر هنا بعد أن يحجز العميل موعدًا.', 'They appear here once a client books a time.')} />
                : <ul className="jr-rows">{upcoming.map((r) => (
                  <li key={r.booking.id}><IconTile icon="video" tone="olive" size={40} iconSize={19} /><span className="jr-rows__copy"><b>{r.invitation.client.firstName}</b><small>{fmtWeekdayDate(r.booking.startsAt)} · {fmtTime(r.booking.startsAt)}</small></span><StatusPill tone="success">{tr('مؤكدة', 'Confirmed')}</StatusPill></li>
                ))}</ul>}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

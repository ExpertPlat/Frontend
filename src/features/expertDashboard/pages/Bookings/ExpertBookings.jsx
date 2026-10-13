import React, { useMemo } from 'react';
import { PATHS } from '../../../../routes/paths';
import { useResource } from '../../../../services/hooks';
import { expertWorkspaceService } from '../../../../services/expert/expertWorkspaceService';
import { Button, Card, EmptyState, PageHeader, Segmented, SkeletonRows, StatusPill } from '../../../userDashboard/components/ui';
import { useUserI18n } from '../../../userDashboard/i18n/UserI18nContext';
import { ClientTile, ResourceError } from '../../common/parts';
import { useState } from 'react';

const STATUS = { confirmed: ['success', ['مؤكدة', 'Confirmed']], held: ['warning', ['محجوزة مؤقتًا', 'On hold']], completed: ['neutral', ['منتهية', 'Done']], cancelled: ['danger', ['ملغاة', 'Cancelled']] };

/** Sessions with clients. A booking has no page of its own: its request page holds move / cancel. */
export default function ExpertBookings() {
  const { tr, tx, fmtWeekdayDate, fmtTime } = useUserI18n();
  const work = useResource(() => expertWorkspaceService.load(), []);
  const [tab, setTab] = useState('upcoming');
  const rows = useMemo(() => (work.data?.requests || []).filter((r) => r.booking).map((r) => ({ ...r.booking, invitation: r.invitation })), [work.data]);
  const now = Date.now();
  const upcoming = rows.filter((b) => ['confirmed', 'held'].includes(b.status) && new Date(b.startsAt) > now).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const past = rows.filter((b) => !upcoming.includes(b)).sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  const list = tab === 'upcoming' ? upcoming : past;
  return (
    <div className="jr-page">
      <PageHeader icon="calendar" title={tr('الجلسات', 'Sessions')} subtitle={tr('مواعيدك مع العملاء.', 'Your appointments with clients.')} />
      <div className="ex-tabs"><Segmented label={tr('الجلسات', 'Sessions')} value={tab} onChange={setTab} options={[{ value: 'upcoming', label: tr('القادمة', 'Upcoming') }, { value: 'past', label: tr('السابقة', 'Past') }]} /></div>
      <ResourceError resource={work} />
      {work.loading && !work.data && <Card className="jr-card"><SkeletonRows rows={3} /></Card>}
      {work.data && list.length === 0 && <Card className="jr-card"><EmptyState icon="calendar" title={tab === 'upcoming' ? tr('لا توجد جلسات قادمة', 'No upcoming sessions') : tr('لا توجد جلسات سابقة', 'No past sessions')} description={tr('تظهر الجلسات هنا بعد أن يحجز العميل موعدًا.', 'Sessions appear here once a client books a time.')} /></Card>}
      {list.length > 0 && (
        <Card className="jr-card"><ul className="jr-rows">
          {list.map((b) => { const [tone, label] = STATUS[b.status] || ['neutral', [b.status, b.status]]; return (
            <li key={b.id}><ClientTile name={b.invitation.client.firstName} size={44} /><span className="jr-rows__copy"><b>{b.invitation.client.firstName} · {b.invitation.caseSummary.title}</b><small>{fmtWeekdayDate(b.startsAt)} · {fmtTime(b.startsAt)}</small></span><StatusPill tone={tone}>{tx(label)}</StatusPill><Button size="sm" variant="secondary" to={PATHS.EXPERT_INVITATION_DETAIL.replace(':invitationId', b.invitation.id)}>{tr('فتح', 'Open')}</Button></li>
          ); })}
        </ul></Card>
      )}
    </div>
  );
}

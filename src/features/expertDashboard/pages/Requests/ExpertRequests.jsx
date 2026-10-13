import React, { useMemo, useState } from 'react';
import { PATHS } from '../../../../routes/paths';
import { useResource } from '../../../../services/hooks';
import { expertWorkspaceService } from '../../../../services/expert/expertWorkspaceService';
import { useUserI18n } from '../../../userDashboard/i18n/UserI18nContext';
import { Button, Card, EmptyState, PageHeader, Segmented, SkeletonRows, StatusPill } from '../../../userDashboard/components/ui';
import { useMoney } from '../../../userDashboard/journey/parts';
import { ClientTile, ResourceError } from '../../common/parts';
import { IS_OPEN, NEEDS_ACTION, REQUEST_STAGE, stageOfRequest } from '../../utils/expertStatuses';

const TABS = {
  new: (stage) => stage === 'new',
  active: (stage) => stage !== 'new' && IS_OPEN(stage),
  past: (stage) => !IS_OPEN(stage),
};

/** Every client request in one list: new ones first, then work in progress, then what is over. */
export default function ExpertRequests() {
  const { tr, tx, fmtDateShort } = useUserI18n();
  const money = useMoney();
  const [tab, setTab] = useState(null);
  const ws = useResource(() => expertWorkspaceService.load(), []);

  const rows = useMemo(() => (ws.data?.requests || [])
    .map((row) => ({ ...row, stage: stageOfRequest(row) }))
    .sort((a, b) => String(b.invitation.sentAt).localeCompare(String(a.invitation.sentAt))), [ws.data]);
  const counts = { new: rows.filter((r) => TABS.new(r.stage)).length, active: rows.filter((r) => TABS.active(r.stage)).length, past: rows.filter((r) => TABS.past(r.stage)).length };
  const current = tab || (counts.new ? 'new' : counts.active ? 'active' : counts.new + counts.active === 0 && counts.past ? 'past' : 'new');
  const shown = rows.filter((r) => TABS[current](r.stage));

  return (
    <div className="jr-page">
      <PageHeader icon="users" title={tr('الطلبات', 'Requests')} subtitle={tr('كل ما يصلك من العملاء، من الدعوة الأولى حتى الجلسة.', 'Everything clients send you, from the first invitation to the session.')} />
      <Segmented label={tr('القسم', 'Section')} value={current} onChange={setTab} options={[
        { value: 'new', label: tr('جديدة', 'New'), count: counts.new },
        { value: 'active', label: tr('قيد العمل', 'In progress'), count: counts.active },
        { value: 'past', label: tr('منتهية', 'Finished'), count: counts.past },
      ]} />
      <ResourceError resource={ws} />
      {ws.loading && !ws.data && <Card className="jr-card"><SkeletonRows rows={3} /></Card>}
      {ws.data && shown.length === 0 && (
        <Card className="jr-card"><EmptyState icon="users" title={current === 'new' ? tr('لا توجد طلبات جديدة', 'No new requests') : current === 'active' ? tr('لا يوجد عمل جارٍ', 'Nothing in progress') : tr('لا توجد طلبات منتهية', 'Nothing finished yet')} description={tr('عندما يدعوك عميل ستظهر دعوته هنا.', 'When a client invites you, the invitation shows up here.')} /></Card>
      )}
      {ws.data && shown.length > 0 && (
        <Card className="jr-card">
          <ul className="jr-rows jr-rows--people">
            {shown.map(({ invitation, proposal, stage }) => {
              const meta = REQUEST_STAGE[stage];
              const action = NEEDS_ACTION.includes(stage);
              return (
                <li key={invitation.id}>
                  <ClientTile name={invitation.client.firstName} />
                  <span className="jr-rows__copy"><b>{invitation.caseSummary.title}</b><small>{invitation.client.firstName} · {fmtDateShort(invitation.sentAt)}</small></span>
                  <span className="jr-rows__side">{proposal && <b>{money(proposal.current.amount)}</b>}<StatusPill tone={meta.tone}>{tx(meta.label)}</StatusPill></span>
                  <Button size="sm" variant={action ? 'primary' : 'secondary'} to={PATHS.EXPERT_INVITATION_DETAIL.replace(':invitationId', invitation.id)}>
                    {stage === 'new' ? tr('راجع الطلب', 'Review') : stage === 'proposal' ? tr('اكتب العرض', 'Write proposal') : stage === 'revise' ? tr('عدّل العرض', 'Revise') : tr('فتح', 'Open')}
                  </Button>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { useResource } from '../../../../services/hooks';
import { workspaceService } from '../../../../services/user/workspaceService';
import { useUserI18n } from '../../i18n/UserI18nContext';
import { Avatar, Button, Card, EmptyState, PageHeader, Segmented, SkeletonRows, StatusPill } from '../../components/ui';
import { AGREEMENT_STATUS, INVITATION_STATUS, PROPOSAL_STATUS, pick } from '../../utils/statuses';
import { stagePath } from '../../journey/journeyData';
import { LoadError, useMoney } from '../../journey/parts';

/** One place for the replies to the person's invitations: proposals, agreements and the invitations themselves. */
export default function UserOffers() {
  const { tr, tx, fmtDateShort } = useUserI18n();
  const money = useMoney();
  const [tab, setTab] = useState('proposals');
  const workspace = useResource(() => workspaceService.load(), []);
  const d = workspace.data;
  const sort = (rows, key) => [...rows].sort((a, b) => String(b[key]).localeCompare(String(a[key])));
  const tabs = d ? { proposals: sort(d.proposals, 'updatedAt'), agreements: sort(d.agreements, 'createdAt'), invitations: sort(d.invitations, 'sentAt') } : { proposals: [], agreements: [], invitations: [] };

  const row = (key, expert, title, meta, status, side, to, action) => (
    <li key={key}><Avatar src={expert.avatarUrl} name={expert.name} size={44} /><span className="jr-rows__copy"><b>{expert.name}</b><small>{title}</small><small>{meta}</small></span><span className="jr-rows__side">{side && <b>{side}</b>}<StatusPill tone={status.tone}>{tx(status.label)}</StatusPill></span><Button size="sm" variant="secondary" to={to}>{action}</Button></li>
  );
  return (
    <div className="jr-page">
      <PageHeader icon="fileCheck" title={tr('العروض والاتفاقات', 'Offers & agreements')} subtitle={tr('ما أرسله لك الخبراء وما اتفقت عليه.', 'What experts sent you and what you agreed on.')} />
      <Segmented label={tr('القسم', 'Section')} value={tab} onChange={setTab} options={[{ value: 'proposals', label: tr('العروض', 'Offers'), count: tabs.proposals.length }, { value: 'agreements', label: tr('الاتفاقات', 'Agreements'), count: tabs.agreements.length }, { value: 'invitations', label: tr('الدعوات', 'Invitations'), count: tabs.invitations.length }]} />
      {workspace.error && <LoadError message={workspace.errorMessage} onRetry={() => workspace.reload()} />}
      {workspace.loading && !d && <Card className="jr-card"><SkeletonRows rows={3} /></Card>}
      {d && tabs[tab].length === 0 && <Card className="jr-card"><EmptyState icon="fileCheck" title={tr('لا يوجد شيء هنا بعد', 'Nothing here yet')} description={tr('ستظهر هنا الردود عندما تدعو خبيرًا.', 'Replies show up here once you invite an expert.')} /></Card>}
      {d && tabs[tab].length > 0 && (
        <Card className="jr-card">
          <ul className="jr-rows jr-rows--people">
            {tab === 'proposals' && tabs.proposals.map((p) => row(p.id, p.expert, p.caseTitle, fmtDateShort(p.updatedAt), pick(PROPOSAL_STATUS, p.status), money(p.current.amount), stagePath(p.caseId, 'offer'), p.status === 'submitted' ? tr('قرّر', 'Decide') : tr('عرض', 'View')))}
            {tab === 'agreements' && tabs.agreements.map((a) => row(a.id, a.expert, a.caseTitle, fmtDateShort(a.createdAt), pick(AGREEMENT_STATUS, a.status), money(a.amount), stagePath(a.caseId, 'agreement'), tr('فتح', 'Open')))}
            {tab === 'invitations' && tabs.invitations.map((i) => row(i.id, i.expert, i.caseTitle, fmtDateShort(i.sentAt), pick(INVITATION_STATUS, i.status), null, stagePath(i.caseId, 'offer'), tr('متابعة', 'Follow')))}
          </ul>
        </Card>
      )}
    </div>
  );
}

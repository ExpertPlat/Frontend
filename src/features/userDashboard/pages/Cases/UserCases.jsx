import React from 'react';
import { PATHS } from '../../../../routes/paths';
import { useResource } from '../../../../services/hooks';
import { workspaceService } from '../../../../services/user/workspaceService';
import { useUserI18n } from '../../i18n/UserI18nContext';
import { Button, Card, EmptyState, PageHeader, SkeletonRows, StatusPill } from '../../components/ui';
import { CASE_STATUS, pick } from '../../utils/statuses';
import { STAGES, stagePath } from '../../journey/journeyData';
import { caseStage } from '../../journey/stageOf';
import { LoadError } from '../../journey/parts';

/** All the person's cases, each showing where it stands in the five-stage journey. GET /api/v2/user/cases */
export default function UserCases() {
  const { tr, tx, fmtDateShort } = useUserI18n();
  const workspace = useResource(() => workspaceService.load(), []);
  const data = workspace.data;
  const cases = data?.cases || [];
  return (
    <div className="jr-page">
      <PageHeader icon="file" title={tr('حالاتي', 'My cases')} subtitle={tr('كل حالة تمرّ بخمس مراحل بسيطة. افتح أي حالة لتكمل من حيث توقفت.', 'Every case goes through five simple stages. Open one to continue where you stopped.')} actions={<Button icon="plus" to={PATHS.USER_CASE_NEW}>{tr('حالة جديدة', 'New case')}</Button>} />
      {workspace.error && <LoadError message={workspace.errorMessage} onRetry={() => workspace.reload()} />}
      {workspace.loading && !data && <Card className="jr-card"><SkeletonRows rows={4} /></Card>}
      {data && cases.length === 0 && <Card className="jr-card"><EmptyState icon="file" title={tr('لا توجد حالات بعد', 'No cases yet')} description={tr('احكِ لنا حالتك وسنرشّح لك الخبير المناسب.', 'Tell us about your case and we will suggest the right expert.')} action={<Button icon="plus" to={PATHS.USER_CASE_NEW}>{tr('ابدأ حالتك', 'Start your case')}</Button>} /></Card>}
      <ul className="jr-cases">
        {cases.map((item) => {
          const stage = caseStage(item, data); const status = pick(CASE_STATUS, item.status); const done = item.status === 'cancelled';
          return (
            <li key={item.id}>
              <Card className="jr-card jr-case">
                <div className="jr-case__top">
                  <span className="jr-rows__copy"><b>{item.title}</b><small>{fmtDateShort(item.updatedAt)}</small></span>
                  <StatusPill tone={status.tone}>{tx(status.label)}</StatusPill>
                </div>
                <ol className="jr-dots" aria-label={tr('تقدّم الحالة', 'Case progress')}>
                  {STAGES.map((s, index) => <li key={s.id} className={index < stage ? 'is-done' : index === stage ? 'is-current' : ''}><i /><span>{tx(s.label)}</span></li>)}
                </ol>
                {!done && <div className="jr-case__foot"><Button size="sm" iconEnd="arrowRight" iconDir to={stagePath(item.id, STAGES[Math.max(1, stage)].id)}>{tr('متابعة', 'Continue')}</Button></div>}
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

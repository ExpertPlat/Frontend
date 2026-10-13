import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '../../../../routes/paths';
import { useResource } from '../../../../services/hooks';
import { workspaceService } from '../../../../services/user/workspaceService';
import { useUserI18n } from '../../i18n/UserI18nContext';
import { useUserSession } from '../../session/UserSessionContext';
import UdIcon from '../../components/UdIcon';
import { Button, Card, CardHeader, EmptyState, IconTile, PageHeader, SkeletonRows, StatusPill } from '../../components/ui';
import { CASE_STATUS, pick } from '../../utils/statuses';
import { STAGES, stagePath } from '../../journey/journeyData';
import { caseStage } from '../../journey/stageOf';
import { LoadError } from '../../journey/parts';

/** Home: one big call to action, then only what needs the person's attention. */
export default function UserHome() {
  const { tr, tx, fmtDateShort, fmtWeekdayDate, fmtTime } = useUserI18n();
  const { profile } = useUserSession();
  const workspace = useResource(() => workspaceService.load(), []);
  const data = workspace.data;

  const todo = useMemo(() => {
    if (!data) return [];
    const items = [];
    data.proposals.filter((p) => p.status === 'submitted').forEach((p) => items.push({ key: `p${p.id}`, icon: 'fileCheck', tone: 'warning', title: tr(`عرض جديد من ${p.expert.name}`, `New proposal from ${p.expert.name}`), meta: p.caseTitle, to: stagePath(p.caseId, 'offer'), action: tr('اقرأ العرض', 'Read it') }));
    data.agreements.filter((a) => a.status === 'awaiting_payment').forEach((a) => items.push({ key: `a${a.id}`, icon: 'card', tone: 'warning', title: tr(`موّل اتفاقك مع ${a.expert.name}`, `Fund your agreement with ${a.expert.name}`), meta: a.caseTitle, to: stagePath(a.caseId, 'agreement'), action: tr('أمّن المبلغ', 'Fund now') }));
    data.agreements.filter((a) => a.status === 'active' && !data.bookings.some((b) => b.agreementId === a.id && b.status !== 'cancelled')).forEach((a) => items.push({ key: `b${a.id}`, icon: 'calendar', tone: 'success', title: tr(`اختر موعد جلستك مع ${a.expert.name}`, `Pick your session time with ${a.expert.name}`), meta: a.caseTitle, to: stagePath(a.caseId, 'agreement'), action: tr('اختر موعدًا', 'Pick a time') }));
    data.bookings.filter((b) => ['confirmed', 'held'].includes(b.status) && new Date(b.startsAt) > new Date()).sort((a, b) => a.startsAt.localeCompare(b.startsAt)).slice(0, 1).forEach((b) => items.push({ key: `s${b.id}`, icon: 'video', tone: 'success', title: tr(`جلستك القادمة مع ${b.expert.name}`, `Your next session with ${b.expert.name}`), meta: `${fmtWeekdayDate(b.startsAt)} · ${fmtTime(b.startsAt)}`, to: PATHS.USER_APPOINTMENTS, action: tr('التفاصيل', 'Details') }));
    return items;
  }, [data, tr, fmtWeekdayDate, fmtTime]);

  const cases = (data?.cases || []).filter((c) => c.status !== 'cancelled').slice(0, 4);
  return (
    <div className="jr-page">
      <PageHeader icon="home" title={profile ? tr(`أهلًا ${profile.name.split(' ')[0]}`, `Welcome, ${profile.name.split(' ')[0]}`) : tr('أهلًا بك', 'Welcome')} subtitle={tr('نساعدك على الوصول إلى الخبير المناسب لحالتك خطوة بخطوة.', 'We help you reach the right expert for your case, step by step.')} />

      <Card className="jr-card jr-hero">
        <IconTile icon="mic" tone="peach" size={64} iconSize={30} />
        <div><h2>{tr('عندك مشكلة تحتاج خبيرًا؟', 'Need an expert for something?')}</h2><p>{tr('احكِ لنا حالتك بصوتك أو بالكتابة، ونحلّلها ونرشّح لك الخبراء المناسبين.', 'Tell us by voice or in writing; we analyse it and suggest the right experts.')}</p></div>
        <Button size="lg" icon="plus" to={PATHS.USER_CASE_NEW}>{tr('ابدأ حالة جديدة', 'Start a new case')}</Button>
      </Card>

      {workspace.error && <LoadError message={workspace.errorMessage} onRetry={() => workspace.reload()} />}
      {workspace.loading && !data && <Card className="jr-card"><SkeletonRows rows={3} /></Card>}

      {data && (
        <div className="jr-grid jr-grid--even">
          <Card className="jr-card jr-block">
            <CardHeader icon="bell" title={tr('بانتظار إجراء منك', 'Needs your attention')} />
            {todo.length === 0
              ? <p className="jr-lead">{tr('لا شيء يحتاج إجراءً الآن.', 'Nothing needs your action right now.')}</p>
              : <ul className="jr-rows">{todo.map((item) => (
                <li key={item.key}><IconTile icon={item.icon} tone={item.tone === 'success' ? 'olive' : 'peach'} size={40} iconSize={19} /><span className="jr-rows__copy"><b>{item.title}</b><small>{item.meta}</small></span><Button size="sm" variant="secondary" to={item.to}>{item.action}</Button></li>
              ))}</ul>}
          </Card>

          <Card className="jr-card jr-block">
            <CardHeader icon="file" title={tr('حالاتي', 'My cases')} aside={<Link className="ud-linkbtn" to={PATHS.USER_CASES}>{tr('عرض الكل', 'View all')}</Link>} />
            {cases.length === 0
              ? <EmptyState icon="file" title={tr('لا توجد حالات بعد', 'No cases yet')} description={tr('ابدأ بوصف حالتك الأولى.', 'Start by describing your first case.')} />
              : <ul className="jr-rows">{cases.map((item) => {
                const stage = caseStage(item, data); const status = pick(CASE_STATUS, item.status);
                return (
                  <li key={item.id}><span className="jr-rows__copy"><b>{item.title}</b><small>{tx(STAGES[stage].label)} · {fmtDateShort(item.updatedAt)}</small></span><StatusPill tone={status.tone}>{tx(status.label)}</StatusPill><Button size="sm" variant="ghost" iconEnd="arrowRight" iconDir to={stagePath(item.id, STAGES[Math.max(1, stage)].id)}>{tr('متابعة', 'Open')}</Button></li>
                );
              })}</ul>}
          </Card>
        </div>
      )}
    </div>
  );
}

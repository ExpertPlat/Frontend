import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBrandFeedback } from '../../../../components/BrandFeedback/BrandFeedback';
import { PATHS } from '../../../../routes/paths';
import { useIdempotentAction, useResource } from '../../../../services/hooks';
import { expertStripeService } from '../../../../services/expert/expertWorkService';
import { expertWorkspaceService } from '../../../../services/expert/expertWorkspaceService';
import UdIcon from '../../../userDashboard/components/UdIcon';
import { Button, Card, CardHeader, EmptyState, PageHeader, SkeletonRows, StatusPill } from '../../../userDashboard/components/ui';
import { useUserI18n } from '../../../userDashboard/i18n/UserI18nContext';
import { useMoney } from '../../../userDashboard/journey/parts';
import { ClientTile, ResourceError } from '../../common/parts';

const STRIPE = { not_started: ['neutral', ['لم يبدأ', 'Not started']], onboarding_started: ['warning', ['غير مكتمل', 'In progress']], restricted: ['danger', ['يحتاج تحديثًا', 'Needs attention']], enabled: ['success', ['جاهز لاستلام الأرباح', 'Ready for payouts']] };

function PayoutAccount() {
  const { tr, tx } = useUserI18n();
  const { notify } = useBrandFeedback();
  const [params, setParams] = useSearchParams();
  const account = useResource(() => expertStripeService.account(), []);
  const link = useIdempotentAction('stripe');
  const [syncing, setSyncing] = useState(false);

  // Back from the hosted onboarding: tell the API, then re-read the account. Status comes from the API, never from the URL.
  useEffect(() => {
    if (params.get('stripe') !== 'return') return;
    (async () => {
      setSyncing(true);
      try { await expertStripeService.onboardingReturn(); await expertStripeService.sync(); } catch { /* the status below shows what the API knows */ }
      setParams({}, { replace: true }); await account.reload({ silent: true }); setSyncing(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = async () => {
    const result = await link.run(({ idempotencyKey }) => expertStripeService.onboardingLink({ idempotencyKey }));
    if (!result.ok) { notify({ message: result.message, tone: 'error' }); return; }
    if (import.meta.env.DEV && String(result.data.url).startsWith('mock://')) {
      await expertStripeService.onboardingReturn(); await account.reload({ silent: true });
      notify({ message: tr('اكتمل إعداد الحساب (بيئة التطوير).', 'Account setup completed (development environment).'), tone: 'success' }); return;
    }
    window.location.assign(result.data.url);
  };
  const status = account.data?.status || 'not_started';
  const [tone, label] = STRIPE[status] || STRIPE.not_started;
  return (
    <Card className="jr-card jr-block">
      <CardHeader icon="wallet" title={tr('حساب استلام الأرباح', 'Payout account')} aside={account.data && <StatusPill tone={tone}>{tx(label)}</StatusPill>} />
      <ResourceError resource={account} />
      {account.loading && !account.data && <SkeletonRows rows={1} />}
      {account.data && (
        <>
          <p className="jr-lead">{status === 'enabled' ? tr('حسابك جاهز. تُحوَّل مستحقاتك إليه بعد كل جلسة.', 'Your account is ready. Your earnings are paid into it after each session.') : tr('نستخدم شريك دفع آمن لتحويل أرباحك. الإعداد يأخذ دقائق.', 'A secure payment partner pays your earnings out. Setup takes a few minutes.')}</p>
          {status !== 'enabled' && <div className="jr-actions jr-actions--start"><Button icon="externalLink" loading={link.busy || syncing} onClick={start}>{status === 'not_started' ? tr('ابدأ الإعداد', 'Start setup') : tr('أكمل الإعداد', 'Continue setup')}</Button></div>}
        </>
      )}
    </Card>
  );
}

/** Payout account + what each request will earn. Amounts are provisional until the platform pays out. */
export default function ExpertPayments() {
  const { tr, fmtDateShort } = useUserI18n();
  const money = useMoney();
  const work = useResource(() => expertWorkspaceService.load(), []);
  const rows = (work.data?.requests || []).filter((r) => r.agreement && r.agreement.status !== 'cancelled');
  const net = rows.reduce((sum, r) => sum + (r.agreement.split?.expertNetMinor || 0), 0);
  const currency = rows[0]?.agreement.split?.currency || 'AED';
  return (
    <div className="jr-page">
      <PageHeader icon="card" title={tr('المدفوعات', 'Payments')} subtitle={tr('حساب الاستلام وما ستكسبه من كل طلب.', 'Your payout account and what each request earns.')} />
      <PayoutAccount />
      <ResourceError resource={work} />
      {work.loading && !work.data && <Card className="jr-card"><SkeletonRows rows={3} /></Card>}
      {work.data && rows.length === 0 && <Card className="jr-card"><EmptyState icon="card" title={tr('لا توجد أرباح بعد', 'No earnings yet')} description={tr('تظهر هنا بعد أن يقبل عميل عرضك.', 'They appear here once a client accepts your proposal.')} /></Card>}
      {rows.length > 0 && (
        <>
          <Card className="jr-card jr-total"><small>{tr('صافي مستحقاتك المتوقعة', 'Your expected net earnings')}</small><b>{money({ amountMinor: net, currency })}</b></Card>
          <Card className="jr-card"><ul className="jr-rows">
            {rows.map(({ invitation, agreement }) => (
              <li key={agreement.id}><ClientTile name={invitation.client.firstName} size={44} /><span className="jr-rows__copy"><b>{invitation.client.firstName} · {invitation.caseSummary.title}</b><small>{fmtDateShort(agreement.createdAt)} · {tr('الإجمالي', 'Gross')} {money(agreement.amount)}</small></span><span className="jr-rows__side"><b>{money({ amountMinor: agreement.split.expertNetMinor, currency: agreement.split.currency })}</b><StatusPill tone={agreement.status === 'completed' ? 'success' : 'warning'}>{agreement.status === 'completed' ? tr('مكتمل', 'Completed') : tr('مبدئي', 'Provisional')}</StatusPill></span><Button size="sm" variant="secondary" to={PATHS.EXPERT_INVITATION_DETAIL.replace(':invitationId', invitation.id)}>{tr('فتح', 'Open')}</Button></li>
            ))}
          </ul></Card>
        </>
      )}
    </div>
  );
}

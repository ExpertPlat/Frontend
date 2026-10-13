import React from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '../../../routes/paths';
import { useResource } from '../../../services/hooks';
import { adminDirectory, adminFinance, adminOversight } from '../../../services/admin/adminApi';
import { ADMIN_PERMISSIONS as P } from '../../adminAuthorization/adminPermissions';
import { useUserI18n } from '../../userDashboard/i18n/UserI18nContext';
import UdIcon from '../../userDashboard/components/UdIcon';
import { Button, Card, SkeletonRows } from '../../userDashboard/components/ui';
import { useAdminSession } from '../session/AdminSessionContext';
import { LoadFailed, Section, Stat, When } from '../ui/kit';
import { CASE_STATUS, pick } from '../ui/statuses';

const QUEUES = [
  { key: 'kycSubmitted', icon: 'shieldCheck', tone: 'warning', path: PATHS.ADMIN_KYC, perm: P.EXPERTS_REVIEW_KYC, title: ['طلبات تحقق جديدة', 'New verification requests'], hint: ['لم تبدأ مراجعتها بعد', 'Not taken for review yet'] },
  { key: 'kycReview', icon: 'clock', tone: 'peach', path: `${PATHS.ADMIN_KYC}?status=under_review`, perm: P.EXPERTS_REVIEW_KYC, title: ['طلبات قيد المراجعة', 'Verifications in review'], hint: ['بانتظار قرار نهائي', 'Waiting for a final decision'] },
  { key: 'renewals', icon: 'refresh', tone: 'warning', path: `${PATHS.ADMIN_RENEWALS}?status=submitted`, perm: P.EXPERT_RENEWALS_VIEW_ANY, title: ['تجديدات نطاق', 'Scope renewals'], hint: ['مقدّمة وبانتظار المراجعة', 'Submitted and waiting'] },
  { key: 'refunds', icon: 'banknote', tone: 'warning', path: `${PATHS.ADMIN_FINANCE}?tab=refunds`, perm: P.REFUNDS_VIEW, title: ['طلبات استرداد', 'Refund requests'], hint: ['بانتظار قرار الإدارة', 'Waiting for a decision'] },
  { key: 'reconciliation', icon: 'arrowUpDown', tone: 'amber', path: `${PATHS.ADMIN_FINANCE}?tab=reconciliation`, perm: P.FINANCE_VIEW, title: ['فروقات مطابقة مفتوحة', 'Open reconciliation issues'], hint: ['مدفوعات تحتاج تسوية', 'Payments needing reconciliation'] },
  { key: 'disputes', icon: 'gavel', tone: 'danger', path: `${PATHS.ADMIN_FINANCE}?tab=disputes`, perm: P.DISPUTES_VIEW, title: ['نزاعات تحتاج ردًا', 'Disputes needing a response'], hint: ['لها موعد نهائي للرد', 'They have a response deadline'] },
  { key: 'reviews', icon: 'star', tone: 'amber', path: `${PATHS.ADMIN_REVIEWS}?status=pending_moderation`, perm: P.REVIEWS_VIEW_ANY, title: ['تقييمات بانتظار الإشراف', 'Reviews awaiting moderation'], hint: ['قبل ظهورها في ملف الخبير', 'Before they appear on a profile'] },
  { key: 'privacy', icon: 'fingerprint', tone: 'peach', path: `${PATHS.ADMIN_PRIVACY}?status=requested`, perm: P.DATA_REQUESTS_VIEW_ANY, title: ['طلبات بيانات جديدة', 'New data requests'], hint: ['تصدير أو حذف حساب', 'Export or account deletion'] },
  { key: 'waiting', icon: 'users', tone: 'earth', path: `${PATHS.ADMIN_CATALOG}?tab=waiting`, perm: P.CATALOG_VIEW, title: ['حالات تنتظر توفر خبراء', 'Cases waiting for experts'], hint: ['لا يوجد خبير مطابق حاليًا', 'No matching expert yet'] },
];

const total = (promise) => promise.then((result) => result.meta.total).catch(() => null);

export default function Overview() {
  const { tr, tx, fmtNumber, fmtMoney } = useUserI18n();
  const { admin, can, queues } = useAdminSession();

  const stats = useResource(async () => {
    const [experts, users, cases, fundings] = await Promise.all([
      can(P.EXPERTS_VIEW_ANY) ? total(adminDirectory.experts({ perPage: 1 })) : null,
      can(P.USERS_VIEW_ANY) ? total(adminDirectory.users({ perPage: 1 })) : null,
      can(P.CASES_VIEW_ANY) ? adminOversight.cases({ perPage: 100 }).then((r) => r.items).catch(() => null) : null,
      can(P.FINANCE_VIEW) ? adminFinance.fundings({ perPage: 100 }).then((r) => r.items).catch(() => null) : null,
    ]);
    return { experts, users, cases, fundings };
  }, [admin?.id]);

  const d = stats.data;
  const caseGroups = d?.cases ? Object.entries(d.cases.reduce((acc, c) => ({ ...acc, [c.status]: (acc[c.status] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1]) : [];
  const caseMax = Math.max(1, ...caseGroups.map(([, n]) => n));
  const held = d?.fundings ? d.fundings.filter((f) => ['funded', 'partially_refunded'].includes(f.status)).reduce((sum, f) => sum + f.amounts.grossMinor - f.amounts.refundedMinor, 0) : null;
  const refunded = d?.fundings ? d.fundings.reduce((sum, f) => sum + f.amounts.refundedMinor, 0) : null;
  const visibleQueues = QUEUES.filter((q) => can(q.perm));
  const openTotal = visibleQueues.reduce((sum, q) => sum + (queues[q.key] || 0), 0);

  return (
    <div className="ad-page">
      <section className="ad-hello" aria-labelledby="ad-hello-title">
        <div>
          <h1 id="ad-hello-title">{tr(`أهلًا ${admin?.name || ''}`, `Welcome, ${admin?.name || ''}`)}</h1>
          <p>{openTotal > 0 ? tr(`لديك ${fmtNumber(openTotal)} عنصرًا بانتظار إجراء.`, `${fmtNumber(openTotal)} items are waiting for you.`) : tr('لا يوجد عمل معلّق الآن. كل شيء تحت السيطرة.', 'Nothing is waiting right now. Everything is under control.')}</p>
        </div>
        <div className="ad-actions">
          {can(P.EXPERTS_REVIEW_KYC) && <Button to={PATHS.ADMIN_KYC} icon="shieldCheck">{tr('طلبات التحقق', 'Verification queue')}</Button>}
          {can(P.REFUNDS_VIEW) && <Button to={`${PATHS.ADMIN_FINANCE}?tab=refunds`} variant="secondary" icon="banknote">{tr('طلبات الاسترداد', 'Refund requests')}</Button>}
        </div>
      </section>

      {stats.error && <LoadFailed message={stats.errorMessage} onRetry={() => stats.reload()} />}
      <div className="ad-stats">
        {d?.experts != null && <Stat icon="briefcase" tone="earth" label={tr('الخبراء', 'Experts')} value={fmtNumber(d.experts)} to={PATHS.ADMIN_EXPERTS} />}
        {d?.users != null && <Stat icon="users" tone="olive" label={tr('المستخدمون', 'Users')} value={fmtNumber(d.users)} to={PATHS.ADMIN_USERS} />}
        {d?.cases && <Stat icon="file" tone="peach" label={tr('الحالات', 'Cases')} value={fmtNumber(d.cases.length)} hint={tr(`${fmtNumber(d.cases.filter((c) => c.agreementStatus === 'active').length)} باتفاقية فعّالة`, `${fmtNumber(d.cases.filter((c) => c.agreementStatus === 'active').length)} with an active agreement`)} to={PATHS.ADMIN_CASES} />}
        {held != null && <Stat icon="banknote" tone="success" label={tr('أموال محفوظة لدى المنصة', 'Funds held by the platform')} value={fmtMoney(held, d.fundings[0]?.amounts.currency || 'AED')} hint={tr(`المسترد: ${fmtMoney(refunded, 'AED')}`, `Refunded: ${fmtMoney(refunded, 'AED')}`)} to={PATHS.ADMIN_FINANCE} />}
        {stats.loading && !d && <Card className="ad-pad" style={{ gridColumn: '1 / -1' }}><SkeletonRows rows={1} height={64} /></Card>}
      </div>

      <div className="ad-grid">
        <div className="ad-col-7 ad-stack">
          <Section icon="inbox" title={tr('بانتظار إجراء منك', 'Waiting for you')} aside={openTotal > 0 ? <span className="ud-pill-status is-warning"><i />{fmtNumber(openTotal)}</span> : null}>
            <ul className="ad-queue">
              {visibleQueues.map((q) => {
                const n = queues[q.key];
                return (
                  <li key={q.key}>
                    <Link to={q.path} className={`is-${q.tone}`}>
                      <span className="ad-queue__icon"><UdIcon name={q.icon} size={19} /></span>
                      <span><b>{tx(q.title)}</b><small>{tx(q.hint)}</small></span>
                      <span className={`ad-queue__n${n > 0 ? ' is-hot' : ''}`}>{n == null ? '—' : fmtNumber(n)}</span>
                      <UdIcon name="chevronLeft" size={16} className="ud-dir ad-queue__go" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Section>
        </div>

        <div className="ad-col-5 ad-stack">
          {caseGroups.length > 0 && (
            <Section icon="file" title={tr('الحالات حسب الحالة', 'Cases by status')} aside={<Link className="ad-link" to={PATHS.ADMIN_CASES}>{tr('عرض الكل', 'View all')}</Link>}>
              <div className="ad-bars">
                {caseGroups.map(([status, n]) => {
                  const meta = pick(CASE_STATUS, status);
                  return (
                    <div className="ad-bar" key={status}>
                      <div><span>{tx(meta.label)}</span><b>{fmtNumber(n)}</b></div>
                      <div className="ad-bar__track"><div className={`ad-bar__fill${meta.tone === 'danger' ? ' is-danger' : meta.tone === 'amber' || meta.tone === 'warning' ? ' is-peach' : meta.tone === 'earth' ? ' is-earth' : ''}`} style={{ width: `${Math.round((n / caseMax) * 100)}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

        </div>
      </div>
    </div>
  );
}

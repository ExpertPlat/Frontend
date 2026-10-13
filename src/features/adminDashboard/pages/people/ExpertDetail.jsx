import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { PATHS, withParams } from '../../../../routes/paths';
import { useResource } from '../../../../services/hooks';
import { adminDirectory } from '../../../../services/admin/adminApi';
import { ADMIN_PERMISSIONS as P } from '../../../adminAuthorization/adminPermissions';
import { useUserI18n } from '../../../userDashboard/i18n/UserI18nContext';
import UdIcon from '../../../userDashboard/components/UdIcon';
import { Breadcrumbs } from '../../../userDashboard/components/ui';
import { useAdminSession } from '../../session/AdminSessionContext';
import { KV, LoadFailed, Money, Rating, Section, Status, When, useLabel } from '../../ui/kit';
import { ACCOUNT_KYC, AGREEMENT_STATUS, COUNTRIES, DOMAINS, LANGUAGES, MODERATION_STATUS, RENEWAL_STATUS, SCOPE_STATUS, SERVICE_TYPES, STRIPE_ACCOUNT_STATUS, kycStatus } from '../../ui/statuses';

export default function ExpertDetail() {
  const { expertId } = useParams();
  const { tr, tx, fmtNumber } = useUserI18n();
  const label = useLabel();
  const { can } = useAdminSession();
  const detail = useResource(() => adminDirectory.expert(expertId), [expertId]);
  const e = detail.data;
  if (detail.error) return <div className="ad-page"><LoadFailed message={detail.errorMessage} onRetry={() => detail.reload()} /></div>;
  if (!e) return <div className="ad-page"><Section icon="briefcase" title={tr('جارٍ التحميل…', 'Loading…')}><div className="ad-body" aria-busy="true">…</div></Section></div>;

  return (
    <div className="ad-page">
      <Breadcrumbs items={[{ label: tr('الخبراء', 'Experts'), to: PATHS.ADMIN_EXPERTS }, { label: e.name }]} />
      <Section className="ad-hero" icon="briefcase" title={tr('ملف الخبير', 'Expert profile')} aside={<Status map={ACCOUNT_KYC} value={e.kycStatus} />}>
        <div className="ad-body">
          <KV columns={4} items={[
            [tr('الاسم', 'Name'), e.name], [tr('البريد', 'Email'), <span dir="ltr">{e.email}</span>],
            [tr('المجال', 'Domain'), label(DOMAINS, e.domain)], [tr('البلد', 'Country'), label(COUNTRIES, e.country)],
            [tr('اللغة', 'Language'), label(LANGUAGES, e.language)], [tr('التقييم', 'Rating'), <span className="ad-row"><Rating value={e.rating} /><small className="ad-muted">({fmtNumber(e.reviewsCount)})</small></span>],
            [tr('الحساب', 'Account'), <Status meta={{ tone: e.is_active ? 'success' : 'neutral', label: e.is_active ? ['نشط', 'Active'] : ['معطّل', 'Inactive'] }} />],
            [tr('آخر دخول', 'Last sign-in'), <When value={e.lastLoginAt} time />],
            e.profile && [tr('اللقب المهني', 'Professional title'), <span dir="auto">{tx(e.profile.title)}</span>],
            e.profile && [tr('خبرة', 'Experience'), tr(`${fmtNumber(e.profile.yearsExperience)} سنة`, `${fmtNumber(e.profile.yearsExperience)} years`)],
            e.profile && [tr('جلسات منجزة', 'Completed sessions'), fmtNumber(e.profile.completedSessions)],
            [tr('الملف العام', 'Public profile'), e.published ? (e.profile?.slug ? <Link className="ad-link" to={`/experts/${e.profile.slug}`}>{tr('منشور — عرض', 'Published — view')}</Link> : tr('منشور', 'Published')) : tr('غير منشور', 'Not published')],
          ]} />
        </div>
      </Section>

      <Section flush icon="badgeCheck" title={tr('النطاقات المهنية المعتمدة', 'Verified professional scopes')}>
        {e.scopes.length === 0 ? <div className="ad-pad ad-muted">{tr('لا نطاقات معتمدة بعد.', 'No verified scopes yet.')}</div> : (
          <div className="ad-tablewrap"><table className="ad-table">
            <thead><tr><th>{tr('الدور', 'Role')}</th><th>{tr('المجال والاختصاص', 'Domain & jurisdiction')}</th><th>{tr('الخدمات', 'Services')}</th><th>{tr('الحالة', 'Status')}</th><th>{tr('صالح حتى', 'Valid until')}</th><th>{tr('المراجعة التالية', 'Next review')}</th></tr></thead>
            <tbody>{e.scopes.map((s) => (
              <tr key={s.id}>
                <td data-label={tr('الدور', 'Role')} className="is-primary" dir="auto">{s.role}</td>
                <td data-label={tr('المجال والاختصاص', 'Domain & jurisdiction')}>{label(DOMAINS, s.domain)} · <span dir="auto">{s.jurisdiction}</span></td>
                <td data-label={tr('الخدمات', 'Services')}>{(s.serviceTypes || []).map((t) => label(SERVICE_TYPES, t)).join('، ')}</td>
                <td data-label={tr('الحالة', 'Status')}><Status map={SCOPE_STATUS} value={s.isEffective ? 'active' : s.status} /></td>
                <td data-label={tr('صالح حتى', 'Valid until')}><When value={s.validUntil} /></td>
                <td data-label={tr('المراجعة التالية', 'Next review')}><When value={s.nextReviewAt} /></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </Section>

      <div className="ad-grid">
        <div className="ad-col-6 ad-stack">
          <Section flush icon="shieldCheck" title={tr('طلبات التحقق', 'Verification applications')}>
            {e.kycApplications.length === 0 ? <div className="ad-pad ad-muted">{tr('لا طلبات.', 'None.')}</div> : (
              <ul className="ad-mini">{e.kycApplications.map((k) => (
                <li key={k.id}><div>{can(P.EXPERTS_REVIEW_KYC) ? <Link to={withParams(PATHS.ADMIN_KYC_REVIEW, { kycId: k.id })}>{k.reference}</Link> : <b>{k.reference}</b>}<small>{tr('أُرسل', 'Submitted')} <When value={k.submittedAt} /></small></div><Status meta={kycStatus(k.status)} /></li>
              ))}</ul>
            )}
          </Section>
          <Section flush icon="refresh" title={tr('تجديدات النطاق', 'Scope renewals')}>
            {e.renewals.length === 0 ? <div className="ad-pad ad-muted">{tr('لا تجديدات.', 'None.')}</div> : (
              <ul className="ad-mini">{e.renewals.map((r) => (
                <li key={r.id}><div>{can(P.EXPERT_RENEWALS_VIEW) ? <Link to={withParams(PATHS.ADMIN_RENEWAL_DETAIL, { renewalId: r.id })}>{tr(`تجديد #${r.id}`, `Renewal #${r.id}`)}</Link> : <b>#{r.id}</b>}<small>{r.scope ? `${label(DOMAINS, r.scope.domain)} · ${r.scope.role}` : ''}</small></div><Status map={RENEWAL_STATUS} value={r.status} /></li>
              ))}</ul>
            )}
          </Section>
          {e.stripe && (
            <Section icon="banknote" title={tr('حساب الدفعات (Stripe)', 'Payout account (Stripe)')}>
              <div className="ad-body"><KV items={[[tr('الحالة', 'Status'), <Status map={STRIPE_ACCOUNT_STATUS} value={e.stripe.status} />], [tr('الحساب', 'Account'), <span className="ad-code">{e.stripe.accountId}</span>], [tr('استلام المدفوعات', 'Charges'), e.stripe.chargesEnabled ? tr('مفعّل', 'Enabled') : tr('معطّل', 'Disabled')], [tr('التحويلات', 'Payouts'), e.stripe.payoutsEnabled ? tr('مفعّلة', 'Enabled') : tr('معطّلة', 'Disabled')]]} /></div>
            </Section>
          )}
        </div>
        <div className="ad-col-6 ad-stack">
          <Section flush icon="fileSign" title={tr('الاتفاقيات', 'Agreements')}>
            {e.agreements.length === 0 ? <div className="ad-pad ad-muted">{tr('لا اتفاقيات.', 'None.')}</div> : (
              <ul className="ad-mini">{e.agreements.map((a) => (
                <li key={a.id}><div>{can(P.CASES_VIEW) ? <Link to={withParams(PATHS.ADMIN_CASE_DETAIL, { caseId: a.caseId })} dir="auto">{a.caseTitle}</Link> : <b dir="auto">{a.caseTitle}</b>}<small><Money minor={a.amount?.amountMinor} currency={a.amount?.currency} /></small></div><Status map={AGREEMENT_STATUS} value={a.status} /></li>
              ))}</ul>
            )}
          </Section>
          <Section flush icon="star" title={tr('التقييمات', 'Reviews')} aside={can(P.REVIEWS_VIEW_ANY) ? <Link className="ad-link" to={PATHS.ADMIN_REVIEWS}>{tr('الإشراف', 'Moderation')}</Link> : null}>
            {e.reviews.length === 0 ? <div className="ad-pad ad-muted">{tr('لا تقييمات.', 'None.')}</div> : (
              <ul className="ad-mini">{e.reviews.map((r) => (
                <li key={r.id}><div><span className="ad-row"><Rating value={r.rating} /></span><small dir="auto">{r.body}</small></div><Status map={MODERATION_STATUS} value={r.status} /></li>
              ))}</ul>
            )}
          </Section>
        </div>
      </div>
      <p className="ad-muted" style={{ margin: 0 }}><UdIcon name="info" size={14} /> {tr('عرض فقط: تتم قرارات الاعتماد من صفحة التحقق وتجديد النطاقات.', 'Read-only: approval decisions are taken from Verification and Scope renewals.')}</p>
    </div>
  );
}

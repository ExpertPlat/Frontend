import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { PATHS, withParams } from '../../../../routes/paths';
import { useResource } from '../../../../services/hooks';
import { adminDirectory } from '../../../../services/admin/adminApi';
import { ADMIN_PERMISSIONS as P } from '../../../adminAuthorization/adminPermissions';
import { useUserI18n } from '../../../userDashboard/i18n/UserI18nContext';
import { Breadcrumbs } from '../../../userDashboard/components/ui';
import { useAdminSession } from '../../session/AdminSessionContext';
import { KV, LoadFailed, Money, Section, Status, When, useLabel } from '../../ui/kit';
import { CASE_STATUS, CONSENT_DECISION, CONSENT_PURPOSE, COUNTRIES, DATA_REQUEST_STATUS, DATA_REQUEST_TYPE, DOMAINS, FUNDING_STATUS } from '../../ui/statuses';

export default function UserDetail() {
  const { userId } = useParams();
  const { tr, fmtNumber } = useUserI18n();
  const label = useLabel();
  const { can } = useAdminSession();
  const detail = useResource(() => adminDirectory.user(userId), [userId]);
  const consents = useResource(() => adminDirectory.userConsents(userId), [userId], { enabled: can(P.USERS_CONSENT_METADATA_VIEW) });
  const u = detail.data;
  if (detail.error) return <div className="ad-page"><LoadFailed message={detail.errorMessage} onRetry={() => detail.reload()} /></div>;
  if (!u) return <div className="ad-page"><Section icon="users" title={tr('جارٍ التحميل…', 'Loading…')}><div className="ad-body" aria-busy="true">…</div></Section></div>;

  return (
    <div className="ad-page">
      <Breadcrumbs items={[{ label: tr('المستخدمون', 'Users'), to: PATHS.ADMIN_USERS }, { label: u.name }]} />
      <Section className="ad-hero" icon="users" title={tr('ملف المستخدم', 'User profile')} aside={<Status meta={{ tone: u.emailVerifiedAt ? 'success' : 'amber', label: u.emailVerifiedAt ? ['بريد مؤكد', 'Email verified'] : ['بريد غير مؤكد', 'Email not verified'] }} />}>
        <div className="ad-body"><KV columns={4} items={[
          [tr('الاسم', 'Name'), u.name], [tr('البريد', 'Email'), <span dir="ltr">{u.email}</span>], [tr('الهاتف', 'Phone'), <span dir="ltr">{u.phone}</span>], [tr('البلد', 'Country'), label(COUNTRIES, u.country)],
          [tr('الحالات', 'Cases'), tr(`${fmtNumber(u.casesCount)} (${fmtNumber(u.openCasesCount)} مفتوحة)`, `${fmtNumber(u.casesCount)} (${fmtNumber(u.openCasesCount)} open)`)],
          [tr('إجمالي المدفوع', 'Total paid'), <Money minor={u.paidMinor} currency={u.currency} strong />],
          [tr('انضم في', 'Joined'), <When value={u.createdAt} />], [tr('آخر دخول', 'Last sign-in'), <When value={u.lastLoginAt} time />],
        ]} /></div>
      </Section>

      <Section flush icon="file" title={tr('حالات المستخدم', 'Cases')}>
        {u.cases.length === 0 ? <div className="ad-pad ad-muted">{tr('لا حالات.', 'No cases.')}</div> : (
          <ul className="ad-mini">{u.cases.map((c) => (
            <li key={c.id}>
              <div>{can(P.CASES_VIEW) ? <Link to={withParams(PATHS.ADMIN_CASE_DETAIL, { caseId: c.id })} dir="auto">{c.title}</Link> : <b dir="auto">{c.title}</b>}<small>{label(DOMAINS, c.domain)} · <When value={c.updatedAt} /></small></div>
              <span className="ad-row">{c.fundingStatus && <Status map={FUNDING_STATUS} value={c.fundingStatus} />}<Status map={CASE_STATUS} value={c.status} /></span>
            </li>
          ))}</ul>
        )}
      </Section>

      <div className="ad-grid">
        {can(P.DATA_REQUESTS_VIEW_ANY) && (
          <div className="ad-col-6 ad-stack"><Section flush icon="fingerprint" title={tr('طلبات البيانات', 'Data requests')} aside={<Link className="ad-link" to={PATHS.ADMIN_PRIVACY}>{tr('كل الطلبات', 'All requests')}</Link>}>
            {u.dataRequests.length === 0 ? <div className="ad-pad ad-muted">{tr('لا طلبات.', 'None.')}</div> : (
              <ul className="ad-mini">{u.dataRequests.map((r) => (
                <li key={r.id}><div><b>{label(DATA_REQUEST_TYPE, r.type)}</b><small className="ad-code">{r.reference}</small></div><Status map={DATA_REQUEST_STATUS} value={r.status} /></li>
              ))}</ul>
            )}
          </Section></div>
        )}
        {can(P.USERS_CONSENT_METADATA_VIEW) && (
          <div className="ad-col-6 ad-stack"><Section flush icon="shieldCheck" title={tr('الموافقات (بيانات وصفية)', 'Consents (metadata)')}>
            {consents.error ? <div className="ad-pad"><LoadFailed message={consents.errorMessage} onRetry={() => consents.reload()} /></div> : !consents.data?.length ? <div className="ad-pad ad-muted">{tr('لا موافقات مسجّلة.', 'No consents recorded.')}</div> : (
              <ul className="ad-mini">{consents.data.map((c) => (
                <li key={c.id}><div><b>{label(CONSENT_PURPOSE, c.purpose)}</b><small>{tr('سياسة', 'Policy')} {c.policyVersion} · <When value={c.decidedAt} /></small></div><Status map={CONSENT_DECISION} value={c.decision} /></li>
              ))}</ul>
            )}
          </Section></div>
        )}
      </div>
    </div>
  );
}

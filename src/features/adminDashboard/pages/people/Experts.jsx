import React from 'react';
import { PATHS, withParams } from '../../../../routes/paths';
import { adminDirectory } from '../../../../services/admin/adminApi';
import { useUserI18n } from '../../../userDashboard/i18n/UserI18nContext';
import { EmptyState, PageHeader } from '../../../userDashboard/components/ui';
import { DataTable, FilterBar, FilterSelect, Pager, Person, Rating, SearchBox, Section, Status, When, useLabel, usePagedList } from '../../ui/kit';
import { ACCOUNT_KYC, DOMAINS } from '../../ui/statuses';

export default function Experts() {
  const { tr, tx, fmtNumber } = useUserI18n();
  const label = useLabel();
  const list = usePagedList((query) => adminDirectory.experts(query), { search: '', kycStatus: '', domain: '', isActive: '' });
  return (
    <div className="ad-page">
      <PageHeader icon="briefcase" title={tr('الخبراء', 'Experts')} subtitle={tr('كل الخبراء على المنصة: حالة التحقق، النطاقات المعتمدة، التقييم والنشاط.', 'Every expert on the platform: verification, approved scopes, rating and activity.')} />
      <Section flush icon="list" title={tr('قائمة الخبراء', 'Expert list')}>
        <FilterBar>
          <SearchBox value={list.filters.search} onChange={(v) => list.setFilter('search', v)} placeholder={tr('ابحث بالاسم أو البريد', 'Search by name or email')} />
          <FilterSelect label={tr('حالة التحقق', 'Verification')} value={list.filters.kycStatus} onChange={(v) => list.setFilter('kycStatus', v)} options={[{ value: '', label: tr('كل حالات التحقق', 'Any verification') }, ...['approved', 'pending', 'rejected', 'not_submitted'].map((v) => ({ value: v, label: tx(ACCOUNT_KYC[v].label) }))]} />
          <FilterSelect label={tr('المجال', 'Domain')} value={list.filters.domain} onChange={(v) => list.setFilter('domain', v)} options={[{ value: '', label: tr('كل المجالات', 'Any domain') }, ...['legal', 'tax', 'ip', 'biz', 'technology'].map((v) => ({ value: v, label: tx(DOMAINS[v]) }))]} />
          <FilterSelect label={tr('الحساب', 'Account')} value={list.filters.isActive} onChange={(v) => list.setFilter('isActive', v)} options={[{ value: '', label: tr('نشط وغير نشط', 'Active & inactive') }, { value: 'true', label: tr('نشط', 'Active') }, { value: 'false', label: tr('معطّل', 'Inactive') }]} />
        </FilterBar>
        <DataTable
          caption={tr('الخبراء', 'Experts')}
          rows={list.items} loading={list.loading} error={list.error} onRetry={() => list.reload()}
          to={(row) => withParams(PATHS.ADMIN_EXPERT_DETAIL, { expertId: row.id })}
          empty={<EmptyState icon="briefcase" title={tr('لا يوجد خبراء مطابقون', 'No matching experts')} description={tr('غيّر البحث أو عوامل التصفية.', 'Change the search or the filters.')} />}
          columns={[
            { key: 'name', header: tr('الخبير', 'Expert'), render: (r) => <Person name={r.name} sub={r.email} icon="briefcase" /> },
            { key: 'domain', header: tr('المجال', 'Domain'), render: (r) => label(DOMAINS, r.domain) },
            { key: 'kyc', header: tr('التحقق', 'Verification'), render: (r) => <Status map={ACCOUNT_KYC} value={r.kycStatus} /> },
            { key: 'scopes', header: tr('النطاقات الفعّالة', 'Active scopes'), align: 'center', render: (r) => `${fmtNumber(r.activeScopesCount)} / ${fmtNumber(r.scopesCount)}` },
            { key: 'rating', header: tr('التقييم', 'Rating'), render: (r) => <span className="ad-row"><Rating value={r.rating} /><small className="ad-muted">({fmtNumber(r.reviewsCount)})</small></span> },
            { key: 'active', header: tr('الحساب', 'Account'), render: (r) => <Status meta={{ tone: r.is_active ? 'success' : 'neutral', label: r.is_active ? ['نشط', 'Active'] : ['معطّل', 'Inactive'] }} /> },
            { key: 'last', header: tr('آخر دخول', 'Last sign-in'), render: (r) => <When value={r.lastLoginAt} /> },
          ]}
        />
        <Pager meta={list.meta} onPage={list.setPage} />
      </Section>
    </div>
  );
}

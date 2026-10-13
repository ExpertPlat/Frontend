import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { PATHS, withParams } from '../../../../routes/paths';
import { adminRenewals } from '../../../../services/admin/adminApi';
import { useUserI18n } from '../../../userDashboard/i18n/UserI18nContext';
import { Button, EmptyState, PageHeader } from '../../../userDashboard/components/ui';
import { useAdminSession } from '../../session/AdminSessionContext';
import { DataTable, FilterBar, Pager, Person, SearchBox, Section, Status, Tabs, When, useLabel, usePagedList } from '../../ui/kit';
import { DOMAINS, RENEWAL_STATUS } from '../../ui/statuses';

const TABS = ['', 'submitted', 'under_review', 'needs_information', 'approved', 'rejected'];

export default function Renewals() {
  const { tr, tx, fmtNumber } = useUserI18n();
  const label = useLabel();
  const { queues } = useAdminSession();
  const [params, setParams] = useSearchParams();
  const list = usePagedList((query) => adminRenewals.list(query), { search: '', status: params.get('status') || '' });
  const changeStatus = (value) => { list.setFilter('status', value); setParams(value ? { status: value } : {}, { replace: true }); };
  const counts = { submitted: queues.renewals, under_review: queues.renewalsReview };
  return (
    <div className="ad-page">
      <PageHeader icon="refresh" title={tr('تجديد النطاقات', 'Scope renewals')} subtitle={tr('الخبراء الذين قدّموا أدلة جديدة لتمديد صلاحية نطاقاتهم المهنية.', 'Experts who submitted new evidence to extend their professional scopes.')} />
      <Tabs label={tr('حالة التجديد', 'Renewal status')} value={list.filters.status} onChange={changeStatus} tabs={TABS.map((value) => ({ id: value, label: value ? tx(RENEWAL_STATUS[value].label) : tr('الكل', 'All'), count: counts[value] > 0 ? fmtNumber(counts[value]) : null }))} />
      <Section flush icon="list" title={tr('طلبات التجديد', 'Renewal requests')}>
        <FilterBar><SearchBox value={list.filters.search} onChange={(v) => list.setFilter('search', v)} placeholder={tr('ابحث باسم الخبير', 'Search by expert')} /></FilterBar>
        <DataTable
          caption={tr('تجديد النطاقات', 'Scope renewals')}
          rows={list.items} loading={list.loading} error={list.error} onRetry={() => list.reload()}
          to={(r) => withParams(PATHS.ADMIN_RENEWAL_DETAIL, { renewalId: r.id })}
          empty={<EmptyState icon="refresh" title={tr('لا توجد طلبات تجديد', 'No renewal requests')} description={tr('تظهر هنا عندما يقدّم خبير أدلة تجديد.', 'They appear when an expert submits renewal evidence.')} />}
          columns={[
            { key: 'expert', header: tr('الخبير', 'Expert'), render: (r) => <Person name={r.expert.name} sub={tr(`طلب #${r.id}`, `Request #${r.id}`)} icon="briefcase" /> },
            { key: 'scope', header: tr('النطاق', 'Scope'), render: (r) => (r.scope ? <span><b>{label(DOMAINS, r.scope.domain)}</b><br /><small className="ad-muted" dir="auto">{r.scope.role}</small></span> : '—') },
            { key: 'valid', header: tr('ينتهي في', 'Expires'), render: (r) => <When value={r.scope?.validUntil} /> },
            { key: 'status', header: tr('الحالة', 'Status'), render: (r) => <Status map={RENEWAL_STATUS} value={r.status} /> },
            { key: 'submitted', header: tr('قُدِّم', 'Submitted'), render: (r) => <When value={r.submittedAt} /> },
            { key: 'go', header: '', align: 'end', className: 'is-actions', render: (r) => <Button to={withParams(PATHS.ADMIN_RENEWAL_DETAIL, { renewalId: r.id })} size="sm" variant={r.status === 'submitted' ? 'primary' : 'secondary'}>{r.status === 'submitted' ? tr('مراجعة', 'Review') : tr('فتح', 'Open')}</Button> },
          ]}
        />
        <Pager meta={list.meta} onPage={list.setPage} />
      </Section>
    </div>
  );
}

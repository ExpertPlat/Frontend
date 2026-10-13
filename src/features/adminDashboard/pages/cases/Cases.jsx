import React from 'react';
import { PATHS, withParams } from '../../../../routes/paths';
import { adminOversight } from '../../../../services/admin/adminApi';
import { ADMIN_PERMISSIONS as P } from '../../../adminAuthorization/adminPermissions';
import { useUserI18n } from '../../../userDashboard/i18n/UserI18nContext';
import { EmptyState, PageHeader } from '../../../userDashboard/components/ui';
import { useAdminSession } from '../../session/AdminSessionContext';
import { DataTable, FilterBar, FilterSelect, Pager, Person, SearchBox, Section, Status, When, useLabel, usePagedList } from '../../ui/kit';
import { AGREEMENT_STATUS, CASE_STATUS, DOMAINS, FUNDING_STATUS } from '../../ui/statuses';

const STATUS_FILTER = ['ready_for_matching', 'waiting_for_expert_supply', 'requires_review', 'needs_clarification', 'intake_in_progress', 'draft', 'cancelled'];

export default function Cases() {
  const { tr, tx } = useUserI18n();
  const label = useLabel();
  const { can } = useAdminSession();
  const list = usePagedList((query) => adminOversight.cases(query), { search: '', status: '', domain: '' });
  return (
    <div className="ad-page">
      <PageHeader icon="file" title={tr('الحالات', 'Cases')} subtitle={tr('نظرة للقراءة فقط على كل حالات المستخدمين: مرحلتها، اتفاقيتها، وتمويلها.', 'A read-only view of every user case: its stage, agreement and funding.')} />
      <Section flush icon="list" title={tr('قائمة الحالات', 'Case list')}>
        <FilterBar>
          <SearchBox value={list.filters.search} onChange={(v) => list.setFilter('search', v)} placeholder={tr('ابحث بالعنوان أو اسم المستخدم', 'Search by title or user')} />
          <FilterSelect label={tr('الحالة', 'Status')} value={list.filters.status} onChange={(v) => list.setFilter('status', v)} options={[{ value: '', label: tr('كل الحالات', 'Any status') }, ...STATUS_FILTER.map((v) => ({ value: v, label: tx(CASE_STATUS[v].label) }))]} />
          <FilterSelect label={tr('المجال', 'Domain')} value={list.filters.domain} onChange={(v) => list.setFilter('domain', v)} options={[{ value: '', label: tr('كل المجالات', 'Any domain') }, ...['legal', 'tax', 'ip', 'biz'].map((v) => ({ value: v, label: tx(DOMAINS[v]) }))]} />
        </FilterBar>
        <DataTable
          caption={tr('الحالات', 'Cases')}
          rows={list.items} loading={list.loading} error={list.error} onRetry={() => list.reload()}
          to={(row) => withParams(PATHS.ADMIN_CASE_DETAIL, { caseId: row.id })}
          empty={<EmptyState icon="file" title={tr('لا توجد حالات مطابقة', 'No matching cases')} description={tr('غيّر البحث أو عوامل التصفية.', 'Change the search or the filters.')} />}
          columns={[
            { key: 'title', header: tr('الحالة', 'Case'), primary: true, render: (r) => <span><b dir="auto">{r.title}</b><br /><small className="ad-muted">#{r.id} · {label(DOMAINS, r.domain)}</small></span> },
            { key: 'user', header: tr('المستخدم', 'User'), render: (r) => <Person name={r.user.name} to={can(P.USERS_VIEW) ? withParams(PATHS.ADMIN_USER_DETAIL, { userId: r.user.id }) : undefined} /> },
            { key: 'status', header: tr('المرحلة', 'Stage'), render: (r) => <Status map={CASE_STATUS} value={r.status} /> },
            { key: 'agreement', header: tr('الاتفاقية', 'Agreement'), render: (r) => (r.agreementStatus ? <Status map={AGREEMENT_STATUS} value={r.agreementStatus} /> : <span className="ad-muted">—</span>) },
            { key: 'funding', header: tr('التمويل', 'Funding'), render: (r) => (r.fundingStatus ? <Status map={FUNDING_STATUS} value={r.fundingStatus} /> : <span className="ad-muted">—</span>) },
            { key: 'updated', header: tr('آخر تحديث', 'Updated'), render: (r) => <When value={r.updatedAt} /> },
          ]}
        />
        <Pager meta={list.meta} onPage={list.setPage} />
      </Section>
    </div>
  );
}

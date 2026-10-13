import React from 'react';
import { PATHS, withParams } from '../../../../routes/paths';
import { adminDirectory } from '../../../../services/admin/adminApi';
import { useUserI18n } from '../../../userDashboard/i18n/UserI18nContext';
import { EmptyState, PageHeader } from '../../../userDashboard/components/ui';
import { DataTable, FilterBar, FilterSelect, Money, Pager, Person, SearchBox, Section, Status, When, useLabel, usePagedList } from '../../ui/kit';
import { COUNTRIES } from '../../ui/statuses';

export default function Users() {
  const { tr, tx, fmtNumber } = useUserI18n();
  const label = useLabel();
  const list = usePagedList((query) => adminDirectory.users(query), { search: '', country: '', verified: '' });
  return (
    <div className="ad-page">
      <PageHeader icon="users" title={tr('المستخدمون', 'Users')} subtitle={tr('أصحاب الحالات: حساباتهم، حالاتهم، مدفوعاتهم، وطلبات بياناتهم.', 'The people who open cases: their accounts, cases, payments and data requests.')} />
      <Section flush icon="list" title={tr('قائمة المستخدمين', 'User list')}>
        <FilterBar>
          <SearchBox value={list.filters.search} onChange={(v) => list.setFilter('search', v)} placeholder={tr('ابحث بالاسم أو البريد أو الهاتف', 'Search by name, email or phone')} />
          <FilterSelect label={tr('البلد', 'Country')} value={list.filters.country} onChange={(v) => list.setFilter('country', v)} options={[{ value: '', label: tr('كل البلدان', 'Any country') }, ...['AE', 'SA', 'EG', 'JO', 'KW'].map((v) => ({ value: v, label: tx(COUNTRIES[v]) }))]} />
          <FilterSelect label={tr('تأكيد البريد', 'Email')} value={list.filters.verified} onChange={(v) => list.setFilter('verified', v)} options={[{ value: '', label: tr('مؤكد وغير مؤكد', 'Verified & not') }, { value: 'true', label: tr('بريد مؤكد', 'Verified') }, { value: 'false', label: tr('بريد غير مؤكد', 'Not verified') }]} />
        </FilterBar>
        <DataTable
          caption={tr('المستخدمون', 'Users')}
          rows={list.items} loading={list.loading} error={list.error} onRetry={() => list.reload()}
          to={(row) => withParams(PATHS.ADMIN_USER_DETAIL, { userId: row.id })}
          empty={<EmptyState icon="users" title={tr('لا يوجد مستخدمون مطابقون', 'No matching users')} description={tr('غيّر البحث أو عوامل التصفية.', 'Change the search or the filters.')} />}
          columns={[
            { key: 'name', header: tr('المستخدم', 'User'), render: (r) => <Person name={r.name} sub={r.email} /> },
            { key: 'country', header: tr('البلد', 'Country'), render: (r) => label(COUNTRIES, r.country) },
            { key: 'cases', header: tr('الحالات', 'Cases'), align: 'center', render: (r) => `${fmtNumber(r.casesCount)} (${tr(`${fmtNumber(r.openCasesCount)} مفتوحة`, `${fmtNumber(r.openCasesCount)} open`)})` },
            { key: 'paid', header: tr('المدفوع', 'Paid'), render: (r) => <Money minor={r.paidMinor} currency={r.currency} strong /> },
            { key: 'verified', header: tr('البريد', 'Email'), render: (r) => <Status meta={{ tone: r.emailVerifiedAt ? 'success' : 'amber', label: r.emailVerifiedAt ? ['مؤكد', 'Verified'] : ['غير مؤكد', 'Not verified'] }} /> },
            { key: 'last', header: tr('آخر دخول', 'Last sign-in'), render: (r) => <When value={r.lastLoginAt} /> },
          ]}
        />
        <Pager meta={list.meta} onPage={list.setPage} />
      </Section>
    </div>
  );
}

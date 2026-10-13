import React from 'react';
import { PATHS, withParams } from '../../../../routes/paths';
import { useResource } from '../../../../services/hooks';
import { adminDirectory } from '../../../../services/admin/adminApi';
import { ADMIN_PERMISSIONS as P } from '../../../adminAuthorization/adminPermissions';
import { useUserI18n } from '../../../userDashboard/i18n/UserI18nContext';
import { Button, EmptyState, PageHeader } from '../../../userDashboard/components/ui';
import { useAdminSession } from '../../session/AdminSessionContext';
import { DataTable, FilterBar, FilterSelect, Pager, Person, SearchBox, Section, Status, When, usePagedList } from '../../ui/kit';
import { ADMIN_ACCOUNT_STATUS } from '../../ui/statuses';

export default function Admins() {
  const { tr, tx } = useUserI18n();
  const { can } = useAdminSession();
  const roles = useResource(() => adminDirectory.roles(), [], { enabled: can(P.ROLES_VIEW_ANY) });
  const list = usePagedList((query) => adminDirectory.admins(query), { search: '', status: '', role: '' });
  return (
    <div className="ad-page">
      <PageHeader
        icon="shield"
        title={tr('فريق الإدارة', 'Admin team')}
        subtitle={tr('الإداريون وأدوارهم وحالة حساباتهم. الدعوة تصل بالبريد وتُقبل قبل أول دخول.', 'Administrators, their roles and account state. Invitations are e-mailed and accepted before the first sign-in.')}
        actions={can(P.ADMINS_CREATE) && <Button icon="plus" to={PATHS.ADMIN_SUB_ADMIN_CREATE}>{tr('دعوة إداري', 'Invite an admin')}</Button>}
      />
      <Section flush icon="list" title={tr('الإداريون', 'Administrators')}>
        <FilterBar>
          <SearchBox value={list.filters.search} onChange={(v) => list.setFilter('search', v)} placeholder={tr('ابحث بالاسم أو البريد', 'Search by name or email')} />
          <FilterSelect label={tr('الحالة', 'Status')} value={list.filters.status} onChange={(v) => list.setFilter('status', v)} options={[{ value: '', label: tr('كل الحالات', 'Any status') }, ...Object.entries(ADMIN_ACCOUNT_STATUS).map(([value, m]) => ({ value, label: tx(m.label) }))]} />
          {roles.data && <FilterSelect label={tr('الدور', 'Role')} value={list.filters.role} onChange={(v) => list.setFilter('role', v)} options={[{ value: '', label: tr('كل الأدوار', 'Any role') }, ...roles.data.map((r) => ({ value: r.name, label: r.name }))]} />}
        </FilterBar>
        <DataTable
          caption={tr('الإداريون', 'Administrators')}
          rows={list.items} loading={list.loading} error={list.error} onRetry={() => list.reload()}
          to={can(P.ADMINS_VIEW) ? (row) => withParams(PATHS.ADMIN_SUB_ADMIN_DETAIL, { adminId: row.id }) : undefined}
          empty={<EmptyState icon="shield" title={tr('لا يوجد إداريون مطابقون', 'No matching admins')} description={tr('غيّر البحث أو عوامل التصفية.', 'Change the search or the filters.')} />}
          columns={[
            { key: 'name', header: tr('الإداري', 'Admin'), render: (r) => <Person name={r.name} sub={r.email} icon="shield" /> },
            { key: 'roles', header: tr('الأدوار', 'Roles'), render: (r) => <span className="ad-chips">{r.roles.map((n) => <span key={n} className="ad-code">{n}</span>)}</span> },
            { key: 'status', header: tr('الحالة', 'Status'), render: (r) => <Status map={ADMIN_ACCOUNT_STATUS} value={r.status} /> },
            { key: 'last', header: tr('آخر دخول', 'Last sign-in'), render: (r) => <When value={r.last_login_at} time /> },
          ]}
        />
        <Pager meta={list.meta} onPage={list.setPage} />
      </Section>
    </div>
  );
}

import React from 'react';
import { PATHS, withParams } from '../../../../routes/paths';
import { useResource } from '../../../../services/hooks';
import { adminDirectory } from '../../../../services/admin/adminApi';
import { ADMIN_PERMISSIONS as P } from '../../../adminAuthorization/adminPermissions';
import { useUserI18n } from '../../../userDashboard/i18n/UserI18nContext';
import { Button, EmptyState, PageHeader } from '../../../userDashboard/components/ui';
import { useAdminSession } from '../../session/AdminSessionContext';
import { DataTable, Section, Status, When } from '../../ui/kit';

export default function Roles() {
  const { tr, fmtNumber } = useUserI18n();
  const { can } = useAdminSession();
  const roles = useResource(() => adminDirectory.roles(), []);
  return (
    <div className="ad-page">
      <PageHeader icon="key" title={tr('الأدوار والصلاحيات', 'Roles & permissions')} subtitle={tr('الدور مجموعة صلاحيات تُمنح للإداريين. الأدوار المحمية تأتي من النظام ولا تُحذف.', 'A role is a set of permissions granted to admins. Protected roles come from the system and cannot be deleted.')}
        actions={can(P.ROLES_CREATE) && <Button icon="plus" to={PATHS.ADMIN_ROLE_CREATE}>{tr('دور جديد', 'New role')}</Button>} />
      <Section flush icon="list" title={tr('كل الأدوار', 'All roles')}>
        <DataTable
          caption={tr('الأدوار', 'Roles')} rows={roles.data || []} loading={roles.loading} error={roles.error} onRetry={() => roles.reload()}
          to={can(P.ROLES_VIEW) ? (row) => withParams(PATHS.ADMIN_ROLE_DETAIL, { roleId: row.id }) : undefined}
          empty={<EmptyState icon="key" title={tr('لا أدوار', 'No roles')} />}
          columns={[
            { key: 'name', header: tr('الدور', 'Role'), render: (r) => <span className="ad-code">{r.name}</span> },
            { key: 'perms', header: tr('الصلاحيات', 'Permissions'), align: 'center', render: (r) => (r.permissions ? fmtNumber(r.permissions.length) : '—') },
            { key: 'admins', header: tr('الإداريون', 'Admins'), align: 'center', render: (r) => fmtNumber(r.admins_count) },
            { key: 'type', header: tr('النوع', 'Type'), render: (r) => <Status meta={{ tone: r.protected ? 'earth' : 'neutral', label: r.protected ? ['محمي', 'Protected'] : ['مخصّص', 'Custom'] }} /> },
            { key: 'upd', header: tr('آخر تحديث', 'Updated'), render: (r) => <When value={r.updated_at} /> },
          ]}
        />
      </Section>
    </div>
  );
}

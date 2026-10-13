import React from 'react';
import { PATHS } from '../../../routes/paths';
import { useUserI18n } from '../../userDashboard/i18n/UserI18nContext';
import { Button, Card, EmptyState } from '../../userDashboard/components/ui';

/** Shown inside the shell when the signed-in admin lacks the permission for a page (the API would answer 403). */
export default function AdminForbidden() {
  const { tr } = useUserI18n();
  return (
    <div className="ad-page">
      <Card>
        <EmptyState
          icon="lock"
          title={tr('لا تملك صلاحية الوصول لهذه الصفحة', 'You do not have access to this page')}
          description={tr('صلاحيات حسابك الحالية لا تشمل هذا القسم. تواصل مع مسؤول النظام إن كنت تحتاجه.', 'Your current permissions do not include this section. Ask a super admin if you need it.')}
          action={<Button to={PATHS.ADMIN_DASHBOARD} variant="secondary">{tr('العودة للنظرة العامة', 'Back to overview')}</Button>}
        />
      </Card>
    </div>
  );
}

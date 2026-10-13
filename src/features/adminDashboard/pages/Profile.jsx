import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import { PATHS } from '../../../routes/paths';
import { useBrandFeedback } from '../../../components/BrandFeedback/BrandFeedback';
import { groupPermissionValues } from '../../adminAuthorization/adminPermissionMetadata';
import { useUserI18n } from '../../userDashboard/i18n/UserI18nContext';
import { Avatar, Button, PageHeader } from '../../userDashboard/components/ui';
import { useAdminSession } from '../session/AdminSessionContext';
import { KV, LoadFailed, Notice, Section, Status, When } from '../ui/kit';
import { ADMIN_ACCOUNT_STATUS } from '../ui/statuses';

export default function Profile() {
  const { tr, tx } = useUserI18n();
  const { admin, loading, error, reload, isSuper } = useAdminSession();
  const { logoutAll, logout } = useAuth();
  const { confirm } = useBrandFeedback();
  const navigate = useNavigate();
  if (error && !admin) return <div className="ad-page"><LoadFailed message={error} onRetry={reload} /></div>;
  if (loading || !admin) return <div className="ad-page"><Section icon="user" title={tr('جارٍ التحميل…', 'Loading…')}><div className="ad-body" aria-busy="true">…</div></Section></div>;
  const groups = Object.values(groupPermissionValues(admin.permissions || []));
  const signOutEverywhere = async () => {
    const ok = await confirm({ title: tr('الخروج من كل الأجهزة؟', 'Sign out everywhere?'), message: tr('تنتهي كل جلساتك الإدارية الحالية.', 'All your current admin sessions end.'), confirmLabel: tr('خروج من الكل', 'Sign out everywhere'), tone: 'danger' });
    if (!ok) return;
    await logoutAll('admin');
    navigate(PATHS.ADMIN_LOGIN, { replace: true });
  };
  return (
    <div className="ad-page">
      <PageHeader icon="user" title={tr('حسابي', 'My account')} subtitle={tr('بياناتك وأدوارك وصلاحياتك كما يعرفها الخادم.', 'Your details, roles and permissions as the server knows them.')} />
      <Section className="ad-hero" icon="user" title={tr('الهوية', 'Identity')} aside={<Status map={ADMIN_ACCOUNT_STATUS} value={admin.is_active === false ? 'inactive' : 'active'} />}>
        <div className="ad-body ad-row"><Avatar name={admin.name} size={64} />
          <KV columns={3} items={[[tr('الاسم', 'Name'), admin.name], [tr('البريد', 'Email'), <span dir="ltr">{admin.email}</span>], [tr('آخر دخول', 'Last sign-in'), <When value={admin.last_login_at} time />]]} />
        </div>
      </Section>
      <div className="ad-grid">
        <div className="ad-col-4 ad-stack">
          <Section icon="key" title={tr('أدواري', 'My roles')}>
            <div className="ad-body ad-chips">{admin.roles.map((n) => <span key={n} className="ad-code">{n}</span>)}</div>
            {isSuper && <div className="ad-body"><small className="ad-muted">{tr('المدير العام يملك كل الصلاحيات.', 'A super admin holds every permission.')}</small></div>}
          </Section>
          <Section icon="logout" title={tr('الجلسات', 'Sessions')}>
            <div className="ad-body ad-stack">
              <Button variant="secondary" icon="logout" onClick={() => logout('admin').then(() => navigate(PATHS.ADMIN_LOGIN, { replace: true }))}>{tr('تسجيل الخروج', 'Sign out')}</Button>
              <Button variant="danger" icon="lock" onClick={signOutEverywhere}>{tr('الخروج من كل الأجهزة', 'Sign out everywhere')}</Button>
            </div>
          </Section>
        </div>
        <div className="ad-col-8 ad-stack">
          <Section icon="shieldCheck" title={tr('صلاحياتي', 'My permissions')} aside={<small className="ad-muted">{(admin.permissions || []).length}</small>}>
            <div className="ad-body ad-permgrid">{groups.map((g) => (
              <div key={tx(g.title)} className="ad-permgroup"><header><b>{tx(g.title)}</b><small>{g.items.length}</small></header><div className="ad-permview">{g.items.map((i) => <span key={i.id} title={tx(i.description)}>{tx(i.label)}</span>)}</div></div>
            ))}</div>
          </Section>
        </div>
      </div>
    </div>
  );
}

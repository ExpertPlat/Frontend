import React, { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { PATHS, withParams } from '../../../../routes/paths';
import { useResource } from '../../../../services/hooks';
import { adminDirectory } from '../../../../services/admin/adminApi';
import { ADMIN_PERMISSIONS as P } from '../../../adminAuthorization/adminPermissions';
import { groupPermissionValues } from '../../../adminAuthorization/adminPermissionMetadata';
import { useUserI18n } from '../../../userDashboard/i18n/UserI18nContext';
import { Breadcrumbs, Button, Field, Select, TextInput } from '../../../userDashboard/components/ui';
import { useAdminSession } from '../../session/AdminSessionContext';
import { ActionDialog, KV, LoadFailed, Notice, Section, Status, When, useAdminAction } from '../../ui/kit';
import { ADMIN_ACCOUNT_STATUS } from '../../ui/statuses';

export default function AdminDetail() {
  const { adminId } = useParams();
  const [params] = useSearchParams();
  const { tr, tx } = useUserI18n();
  const { can, admin: me } = useAdminSession();
  const detail = useResource(() => adminDirectory.admin(adminId), [adminId]);
  const roles = useResource(() => adminDirectory.roles(), [], { enabled: can(P.ROLES_VIEW_ANY) && can(P.ADMINS_ASSIGN_ROLES) });
  const { busy, run } = useAdminAction(detail.reload);
  const [dialog, setDialog] = useState(null);
  const [edit, setEdit] = useState({ name: '', email: '' });
  const [roleId, setRoleId] = useState('');
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  const a = detail.data?.admin || detail.data;
  if (detail.error) return <div className="ad-page"><LoadFailed message={detail.errorMessage} onRetry={() => detail.reload()} /></div>;
  if (!a) return <div className="ad-page"><Section icon="shield" title={tr('جارٍ التحميل…', 'Loading…')}><div className="ad-body" aria-busy="true">…</div></Section></div>;

  const isSelf = me?.id === a.id;
  const pending = a.status === 'pending_invitation';
  const close = () => { setDialog(null); setErrors({}); setMessage(''); };
  const finish = (res) => { if (res.ok) { close(); detail.reload({ silent: true }); } else { setErrors(res.fieldErrors); setMessage(res.message); } };
  const err = (k) => errors[k]?.[0] || errors[k];
  const assignable = (roles.data || []).filter((r) => !a.roles.includes(r.name));
  const groups = Object.values(groupPermissionValues(a.permissions || []));
  const link = invite.data ? `${window.location.origin}${PATHS.ADMIN_ACCEPT_INVITATION}?email=${encodeURIComponent(invite.data.email)}&token=${invite.data.token}` : '';

  return (
    <div className="ad-page">
      <Breadcrumbs items={[{ label: tr('فريق الإدارة', 'Admin team'), to: PATHS.ADMIN_SUB_ADMINS }, { label: a.name }]} />
      {params.get('invited') && pending && <Notice tone="success">{tr('أُرسلت الدعوة إلى البريد. تنتهي صلاحية الرابط ويمكن إعادة إرساله من هنا.', 'The invitation was e-mailed. The link expires; resend it from here.')}</Notice>}

      <Section className="ad-hero" icon="shield" title={tr('ملف الإداري', 'Admin profile')} aside={<Status map={ADMIN_ACCOUNT_STATUS} value={a.status} />}>
        <div className="ad-body">
          <KV columns={4} items={[
            [tr('الاسم', 'Name'), a.name], [tr('البريد', 'Email'), <span dir="ltr">{a.email}</span>],
            [tr('آخر دخول', 'Last sign-in'), <When value={a.last_login_at} time />], [tr('أُنشئ في', 'Created'), <When value={a.created_at} />],
          ]} />
          {(can(P.ADMINS_UPDATE)) && (
            <div className="ad-row">
              <Button variant="secondary" icon="edit" size="sm" onClick={() => { setEdit({ name: a.name, email: a.email }); setDialog('edit'); }}>{tr('تعديل البيانات', 'Edit details')}</Button>
              {pending
                ? <Button variant="secondary" icon="send" size="sm" onClick={() => setDialog('resend')}>{tr('إعادة إرسال الدعوة', 'Resend invitation')}</Button>
                : a.is_active
                  ? <Button variant="danger" icon="ban" size="sm" disabled={isSelf} title={isSelf ? tr('لا يمكنك تعطيل حسابك.', 'You cannot deactivate your own account.') : undefined} onClick={() => setDialog('deactivate')}>{tr('تعطيل الحساب', 'Deactivate')}</Button>
                  : <Button icon="play" size="sm" onClick={() => setDialog('activate')}>{tr('تفعيل الحساب', 'Activate')}</Button>}
            </div>
          )}
        </div>
      </Section>


      <div className="ad-grid">
        <div className="ad-col-5 ad-stack">
          <Section icon="key" title={tr('الأدوار', 'Roles')} aside={can(P.ADMINS_ASSIGN_ROLES) && assignable.length > 0 && <Button size="sm" variant="secondary" icon="plus" onClick={() => { setRoleId(''); setDialog('assign'); }}>{tr('إضافة دور', 'Add a role')}</Button>}>
            <ul className="ad-mini">
              {a.roles.map((n) => {
                const role = (roles.data || []).find((r) => r.name === n);
                return (
                  <li key={n}>
                    <div>{role && can(P.ROLES_VIEW) ? <Link to={withParams(PATHS.ADMIN_ROLE_DETAIL, { roleId: role.id })} className="ad-code">{n}</Link> : <span className="ad-code">{n}</span>}</div>
                    {can(P.ADMINS_ASSIGN_ROLES) && role && <Button size="sm" variant="ghost" icon="x" onClick={() => setDialog({ revoke: role })}>{tr('سحب', 'Revoke')}</Button>}
                  </li>
                );
              })}
              {a.roles.length === 0 && <li className="ad-muted">{tr('بلا أدوار: لا يملك أي صلاحية.', 'No roles: no permissions.')}</li>}
            </ul>
          </Section>
        </div>
        <div className="ad-col-7 ad-stack">
          <Section icon="shieldCheck" title={tr('الصلاحيات الفعلية', 'Effective permissions')} aside={<small className="ad-muted">{(a.permissions || []).length}</small>}>
            <div className="ad-body ad-permgrid">
              {groups.length === 0 && <p className="ad-muted">{tr('لا صلاحيات.', 'No permissions.')}</p>}
              {groups.map((g) => (
                <div key={tx(g.title)} className="ad-permgroup"><header><b>{tx(g.title)}</b><small>{g.items.length}</small></header><div className="ad-permview">{g.items.map((i) => <span key={i.id} title={tx(i.description)}>{tx(i.label)}</span>)}</div></div>
              ))}
            </div>
          </Section>
        </div>
      </div>

      <ActionDialog open={dialog === 'edit'} onClose={close} title={tr('تعديل بيانات الإداري', 'Edit admin details')} icon="edit" busy={busy} error={message} canSubmit={edit.name.trim().length >= 2 && /^\S+@\S+\.\S+$/.test(edit.email.trim())}
        onSubmit={async () => finish(await run(() => adminDirectory.updateAdmin(a.id, { name: edit.name.trim(), email: edit.email.trim() }), { success: tr('حُفظت البيانات.', 'Details saved.') }))}>
        <Field label={tr('الاسم', 'Name')} required htmlFor="ed-name" error={err('name')}><TextInput id="ed-name" value={edit.name} onChange={(v) => setEdit((e) => ({ ...e, name: v }))} invalid={Boolean(err('name'))} /></Field>
        <Field label={tr('البريد', 'Email')} required htmlFor="ed-email" error={err('email')}><TextInput id="ed-email" dir="ltr" value={edit.email} onChange={(v) => setEdit((e) => ({ ...e, email: v }))} invalid={Boolean(err('email'))} /></Field>
      </ActionDialog>

      <ActionDialog open={dialog === 'resend'} onClose={close} title={tr('إعادة إرسال الدعوة', 'Resend invitation')} description={tr('يُلغى الرابط السابق ويُرسل رابط جديد.', 'The previous link stops working and a new one is sent.')} icon="send" busy={busy} error={message}
        onSubmit={async () => finish(await run(() => adminDirectory.resendInvitation(a.id), { success: tr('أُعيد إرسال الدعوة.', 'Invitation resent.') }))} />

      <ActionDialog open={dialog === 'deactivate'} onClose={close} title={tr('تعطيل الحساب', 'Deactivate account')} description={tr('لن يتمكن من الدخول وتنتهي جلساته. يمكن إعادة تفعيله لاحقًا.', 'They can no longer sign in and their sessions end. You can reactivate later.')} icon="ban" tone="danger" variant="danger" confirmLabel={tr('تعطيل', 'Deactivate')} busy={busy} error={message || err('is_active')}
        onSubmit={async () => finish(await run(() => adminDirectory.setAdminActive(a.id, false), { success: tr('عُطّل الحساب.', 'Account deactivated.') }))} />

      <ActionDialog open={dialog === 'activate'} onClose={close} title={tr('تفعيل الحساب', 'Activate account')} icon="play" busy={busy} error={message}
        onSubmit={async () => finish(await run(() => adminDirectory.setAdminActive(a.id, true), { success: tr('فُعّل الحساب.', 'Account activated.') }))} />

      <ActionDialog open={dialog === 'assign'} onClose={close} title={tr('إضافة دور', 'Add a role')} icon="key" busy={busy} error={message} canSubmit={Boolean(roleId)}
        onSubmit={async () => finish(await run(() => adminDirectory.assignRole(a.id, roleId), { success: tr('أُضيف الدور.', 'Role added.') }))}>
        <Field label={tr('الدور', 'Role')} required htmlFor="as-role"><Select id="as-role" value={roleId} onChange={setRoleId} placeholder={tr('اختر دورًا', 'Choose a role')} options={assignable.map((r) => ({ value: String(r.id), label: r.name }))} /></Field>
      </ActionDialog>

      <ActionDialog open={Boolean(dialog?.revoke)} onClose={close} title={tr('سحب الدور', 'Revoke role')} description={dialog?.revoke ? tr(`ستفقد الصلاحيات التي يمنحها الدور ${dialog.revoke.name} فقط.`, `Only the permissions granted by ${dialog.revoke.name} are lost.`) : ''} icon="x" tone="danger" variant="danger" confirmLabel={tr('سحب', 'Revoke')} busy={busy} error={message || err('role')}
        onSubmit={async () => finish(await run(() => adminDirectory.revokeRole(a.id, dialog.revoke.id), { success: tr('سُحب الدور.', 'Role revoked.') }))} />
    </div>
  );
}

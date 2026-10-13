import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PATHS, withParams } from '../../../../routes/paths';
import { useResource } from '../../../../services/hooks';
import { adminDirectory } from '../../../../services/admin/adminApi';
import { useBrandFeedback } from '../../../../components/BrandFeedback/BrandFeedback';
import { getErrorMessage, getFieldErrors } from '../../../../api/errorHandler';
import { ADMIN_PERMISSIONS as P, ADMIN_PERMISSION_VALUES } from '../../../adminAuthorization/adminPermissions';
import { groupPermissionValues } from '../../../adminAuthorization/adminPermissionMetadata';
import { useUserI18n } from '../../../userDashboard/i18n/UserI18nContext';
import { Breadcrumbs, Button, Field, TextInput } from '../../../userDashboard/components/ui';
import { useAdminSession } from '../../session/AdminSessionContext';
import { ActionDialog, LoadFailed, Notice, Section, Status, useAdminAction } from '../../ui/kit';

/** Create (no :roleId) and view/edit/delete (with :roleId) of a role, with the permission matrix grouped by area. */
export default function RoleForm() {
  const { roleId } = useParams();
  const creating = !roleId;
  const navigate = useNavigate();
  const { notify } = useBrandFeedback();
  const { tr, tx } = useUserI18n();
  const { can, reload: reloadSession } = useAdminSession();
  const detail = useResource(() => adminDirectory.role(roleId), [roleId], { enabled: !creating });
  const catalog = useResource(() => adminDirectory.permissions(), [], { enabled: can(P.PERMISSIONS_VIEW_ANY) });
  const { busy, run } = useAdminAction(detail.reload);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState([]);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const role = detail.data;
  useEffect(() => { if (role) { setName(role.name); setSelected(role.permissions || []); } }, [role]);

  const allPermissions = catalog.data?.length ? catalog.data : ADMIN_PERMISSION_VALUES;
  const groups = useMemo(() => Object.values(groupPermissionValues(allPermissions)), [allPermissions]);
  const locked = !creating && role?.name === 'super_admin';
  const canEdit = creating ? can(P.ROLES_CREATE) : can(P.ROLES_UPDATE) && !locked;
  const dirty = creating ? true : role && (name !== role.name || selected.slice().sort().join() !== (role.permissions || []).slice().sort().join());
  const nameOk = /^[a-z][a-z0-9_]*$/.test(name);
  const err = (k) => errors[k]?.[0] || errors[k];

  if (!creating && detail.error) return <div className="ad-page"><LoadFailed message={detail.errorMessage} onRetry={() => detail.reload()} /></div>;
  if (!creating && !role) return <div className="ad-page"><Section icon="key" title={tr('جارٍ التحميل…', 'Loading…')}><div className="ad-body" aria-busy="true">…</div></Section></div>;

  const toggle = (id) => { setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id])); setErrors((e) => ({ ...e, permissions: undefined })); };
  const toggleGroup = (items, on) => setSelected((s) => (on ? [...new Set([...s, ...items.map((i) => i.id)])] : s.filter((x) => !items.some((i) => i.id === x))));

  const save = async (event) => {
    event.preventDefault();
    if (!canEdit || saving) return;
    setSaving(true); setMessage(''); setErrors({});
    try {
      const body = { name, permissions: selected };
      if (creating) {
        const created = await adminDirectory.createRole(body);
        notify({ message: tr('أُنشئ الدور.', 'Role created.'), tone: 'success' });
        navigate(created?.id ? withParams(PATHS.ADMIN_ROLE_DETAIL, { roleId: created.id }) : PATHS.ADMIN_ROLES);
      } else {
        await adminDirectory.updateRole(roleId, body);
        notify({ message: tr('حُفظ الدور.', 'Role saved.'), tone: 'success' });
        detail.reload({ silent: true });
        reloadSession?.();
      }
    } catch (error) { setErrors(getFieldErrors(error)); setMessage(getErrorMessage(error)); } finally { setSaving(false); }
  };

  const remove = async () => {
    const res = await run(() => adminDirectory.deleteRole(roleId), { success: tr('حُذف الدور.', 'Role deleted.') });
    if (res.ok) navigate(PATHS.ADMIN_ROLES); else setMessage(res.message);
  };

  return (
    <div className="ad-page">
      <Breadcrumbs items={[{ label: tr('الأدوار والصلاحيات', 'Roles & permissions'), to: PATHS.ADMIN_ROLES }, { label: creating ? tr('دور جديد', 'New role') : role.name }]} />
      {locked && <Notice tone="info" icon="lock">{tr('دور المدير العام يملك كل الصلاحيات دائمًا ولا يُعدَّل.', 'The super admin role always holds every permission and cannot be edited.')}</Notice>}
      {!creating && role.protected && !locked && <Notice tone="info" icon="lock">{tr('دور محمي من النظام: يمكن تعديل صلاحياته لكن لا يمكن حذفه.', 'A protected system role: its permissions can change but it cannot be deleted.')}</Notice>}
      <form onSubmit={save} noValidate className="ad-stack">
        <Section icon="key" title={creating ? tr('بيانات الدور', 'Role details') : tr('الدور', 'Role')} aside={!creating && <Status meta={{ tone: role.protected ? 'earth' : 'neutral', label: role.protected ? ['محمي', 'Protected'] : ['مخصّص', 'Custom'] }} />}>
          <div className="ad-body">
            <Field label={tr('اسم الدور', 'Role name')} required htmlFor="role-name" error={err('name') || (name && !nameOk ? tr('أحرف إنجليزية صغيرة وأرقام وشرطة سفلية، وتبدأ بحرف.', 'Lowercase letters, numbers and underscores, starting with a letter.') : '')} hint={tr('معرّف تقني ثابت، مثل kyc_reviewer.', 'A stable technical id, e.g. kyc_reviewer.')}>
              <TextInput id="role-name" dir="ltr" value={name} onChange={(v) => { setName(v.toLowerCase()); setErrors((e) => ({ ...e, name: undefined })); }} disabled={!canEdit || (!creating && role.protected)} invalid={Boolean(err('name'))} />
            </Field>
          </div>
        </Section>

        <Section icon="shieldCheck" title={tr('الصلاحيات', 'Permissions')} aside={<small className="ad-muted">{selected.length}/{allPermissions.length}</small>}>
          <div className="ad-body ad-stack">
            {err('permissions') && <Notice tone="danger">{err('permissions')}</Notice>}
            <div className="ad-permgrid">
            {groups.map((g) => {
              const all = g.items.every((i) => selected.includes(i.id));
              return (
                <fieldset key={tx(g.title)} className="ad-permgroup" disabled={!canEdit}>
                  <header>
                    <b>{tx(g.title)}</b>
                    {canEdit && <button type="button" className="ud-linkbtn" onClick={() => toggleGroup(g.items, !all)}>{all ? tr('إلغاء الكل', 'Clear all') : tr('تحديد الكل', 'Select all')}</button>}
                  </header>
                  {g.items.map((i) => (
                    <label key={i.id} className={`ad-perm${i.sensitive ? ' is-sensitive' : ''}`}>
                      <input type="checkbox" checked={locked || selected.includes(i.id)} onChange={() => toggle(i.id)} />
                      <span><b>{tx(i.label)}</b><small>{tx(i.description)}</small></span>
                    </label>
                  ))}
                </fieldset>
              );
            })}
            </div>
          </div>
        </Section>

        {message && <Notice tone="danger">{message}</Notice>}
        <div className="ad-row ad-row--between">
          <div className="ad-row">
            {canEdit && <Button type="submit" icon="check" loading={saving} disabled={!nameOk || selected.length === 0 || !dirty}>{creating ? tr('إنشاء الدور', 'Create role') : tr('حفظ التغييرات', 'Save changes')}</Button>}
            <Button variant="ghost" to={PATHS.ADMIN_ROLES}>{tr('رجوع', 'Back')}</Button>
          </div>
          {!creating && can(P.ROLES_DELETE) && !role.protected && <Button variant="danger" icon="trash" onClick={() => { setMessage(''); setConfirmDelete(true); }}>{tr('حذف الدور', 'Delete role')}</Button>}
        </div>
      </form>

      <ActionDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} title={tr('حذف الدور', 'Delete role')} icon="trash" tone="danger" variant="danger" confirmLabel={tr('حذف', 'Delete')} busy={busy} error={message}
        description={role?.admins_count ? tr(`الدور مسند إلى ${role.admins_count} إداري، اسحبه منهم أولًا.`, `This role is assigned to ${role.admins_count} admin(s); revoke it from them first.`) : tr('لا يمكن التراجع عن الحذف.', 'This cannot be undone.')}
        onSubmit={remove} />
    </div>
  );
}

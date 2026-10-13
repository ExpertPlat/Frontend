import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PATHS, withParams } from '../../../../routes/paths';
import { useResource } from '../../../../services/hooks';
import { adminDirectory } from '../../../../services/admin/adminApi';
import { getFieldErrors, getErrorMessage } from '../../../../api/errorHandler';
import { useBrandFeedback } from '../../../../components/BrandFeedback/BrandFeedback';
import { useUserI18n } from '../../../userDashboard/i18n/UserI18nContext';
import { Breadcrumbs, Button, Field, PageHeader, Select, TextInput } from '../../../userDashboard/components/ui';
import { LoadFailed, Notice, Section } from '../../ui/kit';

export default function AdminCreate() {
  const { tr } = useUserI18n();
  const navigate = useNavigate();
  const { notify } = useBrandFeedback();
  const roles = useResource(() => adminDirectory.roles(), []);
  const [form, setForm] = useState({ name: '', email: '', role_id: '' });
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const set = (k) => (v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };
  const valid = form.name.trim().length >= 2 && /^\S+@\S+\.\S+$/.test(form.email.trim()) && form.role_id;

  const submit = async (event) => {
    event.preventDefault();
    if (!valid || busy) return;
    setBusy(true); setMessage('');
    try {
      const created = await adminDirectory.createAdmin({ name: form.name.trim(), email: form.email.trim(), role_id: Number(form.role_id) });
      notify({ message: tr('أُرسلت الدعوة.', 'Invitation sent.'), tone: 'success' });
      const id = created?.admin?.id ?? created?.id;
      navigate(id ? `${withParams(PATHS.ADMIN_SUB_ADMIN_DETAIL, { adminId: id })}?invited=1` : PATHS.ADMIN_SUB_ADMINS);
    } catch (error) {
      setErrors(getFieldErrors(error) || {}); setMessage(getErrorMessage(error));
    } finally { setBusy(false); }
  };

  const err = (k) => errors[k]?.[0] || errors[k];
  return (
    <div className="ad-page">
      <Breadcrumbs items={[{ label: tr('فريق الإدارة', 'Admin team'), to: PATHS.ADMIN_SUB_ADMINS }, { label: tr('دعوة إداري', 'Invite an admin') }]} />
      <PageHeader icon="plus" title={tr('دعوة إداري جديد', 'Invite a new admin')} subtitle={tr('يصل الإداري رابط دعوة ليضبط كلمة مروره. صلاحياته تأتي من الدور.', 'The admin receives an invitation link to set a password. Permissions come from the role.')} />
      {roles.error ? <LoadFailed message={roles.errorMessage} onRetry={() => roles.reload()} /> : (
        <Section icon="shield" title={tr('بيانات الإداري', 'Admin details')}>
          <form className="ad-body ad-dialogform" onSubmit={submit} noValidate>
            <Field label={tr('الاسم الكامل', 'Full name')} required htmlFor="adm-name" error={err('name')}><TextInput id="adm-name" value={form.name} onChange={set('name')} invalid={Boolean(err('name'))} /></Field>
            <Field label={tr('البريد الإلكتروني', 'Email')} required htmlFor="adm-email" error={err('email')}><TextInput id="adm-email" type="email" dir="ltr" value={form.email} onChange={set('email')} invalid={Boolean(err('email'))} /></Field>
            <Field label={tr('الدور', 'Role')} required htmlFor="adm-role" error={err('role_id')} hint={tr('يمكن إضافة أدوار أخرى بعد الإنشاء.', 'More roles can be added afterwards.')}>
              <Select id="adm-role" value={form.role_id} onChange={set('role_id')} placeholder={tr('اختر دورًا', 'Choose a role')} invalid={Boolean(err('role_id'))} options={(roles.data || []).map((r) => ({ value: String(r.id), label: r.name }))} />
            </Field>
            {message && <Notice tone="danger">{message}</Notice>}
            <div className="ad-row"><Button type="submit" icon="send" loading={busy} disabled={!valid}>{tr('إرسال الدعوة', 'Send invitation')}</Button><Button variant="ghost" to={PATHS.ADMIN_SUB_ADMINS}>{tr('تراجع', 'Cancel')}</Button></div>
          </form>
        </Section>
      )}
    </div>
  );
}

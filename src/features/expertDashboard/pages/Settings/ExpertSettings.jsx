import React, { useState } from 'react';
import { useBrandFeedback } from '../../../../components/BrandFeedback/BrandFeedback';
import { getErrorMessage } from '../../../../api/errorHandler';
import { PATHS } from '../../../../routes/paths';
import { expertPasswordService } from '../../../../services/expert/expertWorkService';
import { Button, Card, CardHeader, Field, PageHeader, Segmented, TextInput } from '../../../userDashboard/components/ui';
import { useUserI18n } from '../../../userDashboard/i18n/UserI18nContext';
import { fieldErrors } from '../../common/parts';
import { useExpertSession } from '../../session/ExpertSessionContext';

/** Language, theme and password. Name, email and country come from the verified identity, so they are read-only. */
export default function ExpertSettings() {
  const { tr, language, setLanguage, theme, setTheme } = useUserI18n();
  const { notify } = useBrandFeedback();
  const { me } = useExpertSession();
  const [form, setForm] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const err = (key) => { const v = errors[key]; return Array.isArray(v) ? v[0] : v; };

  const change = async (event) => {
    event.preventDefault();
    const local = {};
    if (!form.current_password) local.current_password = tr('اكتب كلمة المرور الحالية.', 'Enter your current password.');
    if (form.password.length < 8) local.password = tr('8 أحرف على الأقل.', 'At least 8 characters.');
    else if (form.password !== form.password_confirmation) local.password_confirmation = tr('التأكيد لا يطابق كلمة المرور.', 'The confirmation does not match.');
    setErrors(local); if (Object.keys(local).length) return;
    setSaving(true);
    try { await expertPasswordService.change(form); setForm({ current_password: '', password: '', password_confirmation: '' }); notify({ message: tr('تم تغيير كلمة المرور.', 'Password changed.'), tone: 'success' }); } catch (error) {
      setErrors(fieldErrors(error)); notify({ message: getErrorMessage(error), tone: 'error' });
    } finally { setSaving(false); }
  };

  return (
    <div className="jr-page jr-page--narrow">
      <PageHeader icon="settings" title={tr('الإعدادات', 'Settings')} subtitle={tr('اللغة والمظهر وكلمة المرور.', 'Language, appearance and password.')} />

      <Card className="jr-card jr-block">
        <CardHeader icon="user" title={tr('حسابي', 'My account')} />
        <dl className="ex-summary">
          <div><dt>{tr('الاسم', 'Name')}</dt><dd>{me?.name || '—'}</dd></div>
          <div><dt>{tr('البريد الإلكتروني', 'Email')}</dt><dd dir="ltr">{me?.email || '—'}</dd></div>
        </dl>
        <p className="jr-lead">{tr('هذه البيانات من وثائق التوثيق. لتغييرها تواصل مع الدعم.', 'These come from your verification documents. Contact support to change them.')}</p>
        <div className="jr-actions jr-actions--start"><Button variant="secondary" icon="shieldCheck" to={PATHS.EXPERT_KYC}>{tr('التوثيق', 'Verification')}</Button></div>
      </Card>

      <Card className="jr-card jr-block">
        <CardHeader icon="sliders" title={tr('المظهر واللغة', 'Appearance & language')} />
        <div className="jr-basics">
          <Field label={tr('لغة الواجهة', 'Interface language')}><Segmented label={tr('لغة الواجهة', 'Interface language')} value={language} onChange={setLanguage} options={[{ value: 'ar', label: 'العربية' }, { value: 'en', label: 'English' }]} /></Field>
          <Field label={tr('المظهر', 'Theme')}><Segmented label={tr('المظهر', 'Theme')} value={theme} onChange={setTheme} options={[{ value: 'light', label: tr('فاتح', 'Light') }, { value: 'dark', label: tr('داكن', 'Dark') }]} /></Field>
        </div>
      </Card>

      <Card className="jr-card jr-block">
        <CardHeader icon="key" title={tr('كلمة المرور', 'Password')} />
        <form className="jr-basics" onSubmit={change} noValidate autoComplete="off">
          <Field label={tr('كلمة المرور الحالية', 'Current password')} htmlFor="pw-cur" error={err('current_password')}><TextInput id="pw-cur" type="password" dir="ltr" autoComplete="current-password" value={form.current_password} onChange={set('current_password')} /></Field>
          <span />
          <Field label={tr('كلمة المرور الجديدة', 'New password')} htmlFor="pw-new" error={err('password')}><TextInput id="pw-new" type="password" dir="ltr" autoComplete="new-password" value={form.password} onChange={set('password')} /></Field>
          <Field label={tr('تأكيد كلمة المرور', 'Confirm password')} htmlFor="pw-conf" error={err('password_confirmation')}><TextInput id="pw-conf" type="password" dir="ltr" autoComplete="new-password" value={form.password_confirmation} onChange={set('password_confirmation')} /></Field>
          <div className="jr-basics__wide jr-actions"><Button type="submit" icon="check" loading={saving}>{tr('تغيير كلمة المرور', 'Change password')}</Button></div>
        </form>
      </Card>

    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBrandFeedback } from '../../../../components/BrandFeedback/BrandFeedback';
import { getErrorMessage, getFieldErrors, getFirstFieldError } from '../../../../api/errorHandler';
import { PATHS } from '../../../../routes/paths';
import { useResource } from '../../../../services/hooks';
import { catalogService, profileService } from '../../../../services/user/accountService';
import { useUserI18n } from '../../i18n/UserI18nContext';
import { useUserSession } from '../../session/UserSessionContext';
import { Button, Card, CardHeader, Field, PageHeader, Segmented, Select, SkeletonRows, StatusPill, Switch, TextInput } from '../../components/ui';
import { LoadError } from '../../journey/parts';

const CONSENTS = [
  { purpose: 'ai_processing', label: ['تحليل حالتي بالذكاء الاصطناعي', 'Analyse my case with AI'], hint: ['يلزم لتلخيص الحالة وترشيح الخبراء.', 'Needed to summarise the case and suggest experts.'] },
  { purpose: 'expert_sharing', label: ['مشاركة ملخص الحالة مع الخبير الذي أدعوه', 'Share the case summary with experts I invite'], hint: ['لا يرى الخبير شيئًا قبل أن تدعوه.', 'An expert sees nothing until you invite them.'] },
  { purpose: 'marketing', label: ['رسائل تسويقية', 'Marketing messages'], hint: ['اختياري.', 'Optional.'] },
];
const REQUEST_STATUS = { requested: ['بانتظار المعالجة', 'Requested'], processing: ['قيد المعالجة', 'Processing'], completed: ['مكتمل', 'Completed'], rejected: ['مرفوض', 'Rejected'], cancelled: ['ملغى', 'Cancelled'], deferred: ['مؤجل', 'Deferred'], failed: ['فشل', 'Failed'] };

/** Profile, privacy choices and data-rights requests. Updates send the resource `version` and re-read it on conflict. */
export default function UserSettings() {
  const { tr, tx, language, setLanguage, theme, setTheme, fmtDateShort } = useUserI18n();
  const { notify } = useBrandFeedback();
  const session = useUserSession();
  const countries = useResource(() => catalogService.countries(), []);
  const consents = useResource(() => profileService.consents(), []);
  const requests = useResource(() => profileService.dataRequests(), []);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (session.profile) setForm((current) => current || { name: session.profile.name, phone: session.profile.phone || '', country: session.profile.country, timezone: session.profile.timezone }); }, [session.profile]);

  const save = async (event) => {
    event.preventDefault(); setSaving(true); setErrors({});
    try { const updated = await profileService.update({ ...form, version: session.profile.version }); session.setProfile(updated); notify({ message: tr('حُفظت بياناتك.', 'Your details were saved.'), tone: 'success' }); } catch (error) {
      if (error.status === 409) { const fresh = await profileService.me(); session.setProfile(fresh); setForm({ name: fresh.name, phone: fresh.phone || '', country: fresh.country, timezone: fresh.timezone }); }
      setErrors(getFieldErrors(error)); notify({ message: getErrorMessage(error), tone: 'error' });
    } finally { setSaving(false); }
  };
  const decide = async (purpose, on) => { try { await profileService.setConsent(purpose, on ? 'granted' : 'withdrawn'); await consents.reload({ silent: true }); } catch (error) { notify({ message: getErrorMessage(error), tone: 'error' }); } };
  const ask = async (type) => { try { await profileService.requestData(type); await requests.reload({ silent: true }); notify({ message: tr('استلمنا طلبك.', 'We received your request.'), tone: 'success' }); } catch (error) { notify({ message: getErrorMessage(error), tone: 'error' }); } };
  const granted = (purpose) => (consents.data || []).find((c) => c.purpose === purpose)?.decision === 'granted';

  return (
    <div className="jr-page jr-page--narrow">
      <PageHeader icon="settings" title={tr('الإعدادات والخصوصية', 'Settings & privacy')} subtitle={tr('بياناتك وتفضيلاتك في مكان واحد.', 'Your details and preferences in one place.')} />

      <Card className="jr-card jr-block">
        <CardHeader icon="user" title={tr('بياناتي', 'My details')} />
        {!form ? <SkeletonRows rows={3} /> : (
          <form className="jr-basics" onSubmit={save} noValidate>
            <Field label={tr('الاسم', 'Name')} htmlFor="st-name" error={getFirstFieldError(errors, 'name')}><TextInput id="st-name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} /></Field>
            <Field label={tr('البريد الإلكتروني', 'Email')} htmlFor="st-email"><TextInput id="st-email" value={session.profile.email} onChange={() => {}} readOnly dir="ltr" /></Field>
            <Field label={tr('الهاتف', 'Phone')} htmlFor="st-phone" error={getFirstFieldError(errors, 'phone')}><TextInput id="st-phone" dir="ltr" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} /></Field>
            <Field label={tr('بلد الإقامة', 'Country')} htmlFor="st-country"><Select id="st-country" value={form.country} onChange={(v) => setForm((f) => ({ ...f, country: v }))} options={(countries.data || []).map((c) => ({ value: c.code, label: c.name }))} /></Field>
            <div className="jr-basics__wide jr-actions"><Button type="submit" icon="check" loading={saving}>{tr('حفظ', 'Save')}</Button></div>
          </form>
        )}
      </Card>

      <Card className="jr-card jr-block">
        <CardHeader icon="sliders" title={tr('المظهر واللغة', 'Appearance & language')} />
        <div className="jr-basics">
          <Field label={tr('لغة الواجهة', 'Interface language')}><Segmented label={tr('لغة الواجهة', 'Interface language')} value={language} onChange={setLanguage} options={[{ value: 'ar', label: 'العربية' }, { value: 'en', label: 'English' }]} /></Field>
          <Field label={tr('المظهر', 'Theme')}><Segmented label={tr('المظهر', 'Theme')} value={theme} onChange={setTheme} options={[{ value: 'light', label: tr('فاتح', 'Light') }, { value: 'dark', label: tr('داكن', 'Dark') }]} /></Field>
        </div>
      </Card>

      <Card className="jr-card jr-block">
        <CardHeader icon="shield" title={tr('الخصوصية والموافقات', 'Privacy & consents')} />
        {consents.error && <LoadError message={consents.errorMessage} onRetry={() => consents.reload()} />}
        <div className="jr-switches">{CONSENTS.map((c) => <Switch key={c.purpose} checked={granted(c.purpose)} onChange={(on) => decide(c.purpose, on)} label={tx(c.label)} description={tx(c.hint)} />)}</div>
        <p className="jr-lead"><Link className="ud-linkbtn" to={PATHS.USER_CONTEXTS}>{tr('إدارة السياقات المحفوظة', 'Manage saved contexts')}</Link></p>
      </Card>

      <Card className="jr-card jr-block">
        <CardHeader icon="download" title={tr('بياناتي', 'My data')} />
        <p className="jr-lead">{tr('يمكنك طلب نسخة من بياناتك أو طلب حذف حسابك.', 'You can ask for a copy of your data or for your account to be deleted.')}</p>
        <div className="jr-actions jr-actions--start"><Button variant="secondary" icon="download" onClick={() => ask('export')}>{tr('طلب نسخة من بياناتي', 'Request a data export')}</Button><Button variant="ghost" onClick={() => ask('deletion')}>{tr('طلب حذف الحساب', 'Request account deletion')}</Button></div>
        {(requests.data || []).length > 0 && <ul className="jr-rows">{requests.data.map((r) => <li key={r.id}><span className="jr-rows__copy"><b>{r.type === 'export' ? tr('نسخة من البيانات', 'Data export') : tr('حذف الحساب', 'Account deletion')}</b><small>{fmtDateShort(r.requestedAt)}</small></span><StatusPill tone={r.status === 'completed' ? 'success' : 'neutral'}>{tx(REQUEST_STATUS[r.status] || [r.status, r.status])}</StatusPill></li>)}</ul>}
      </Card>
    </div>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBrandFeedback } from '../../../../components/BrandFeedback/BrandFeedback';
import { getErrorMessage } from '../../../../api/errorHandler';
import { PATHS } from '../../../../routes/paths';
import { expertProfileService } from '../../../../services/expert/expertProfileService';
import UdIcon from '../../../userDashboard/components/UdIcon';
import { Avatar, Button, Card, CardHeader, Chip, Field, StatusPill, TextArea, TextInput } from '../../../userDashboard/components/ui';
import { useUserI18n } from '../../../userDashboard/i18n/UserI18nContext';
import { fieldErrors } from '../../common/parts';
import { profilePayload } from '../../data/expertProfileData';
import { LANGUAGE_LABEL, MISSING_TARGET, PUBLICATION_LABEL } from '../../utils/expertStatuses';

const BIO_MIN = 80;

function Tags({ id, value, onChange, placeholder }) {
  const { tr } = useUserI18n();
  const [text, setText] = useState('');
  const add = () => { const v = text.trim(); if (v && !value.includes(v) && value.length < 10) onChange([...value, v]); setText(''); };
  return (
    <div className="ex-tags">
      <div className="ex-tags__row">
        <TextInput id={id} value={text} onChange={setText} placeholder={placeholder} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); add(); } }} />
        <Button type="button" variant="secondary" icon="plus" onClick={add} disabled={!text.trim()}>{tr('إضافة', 'Add')}</Button>
      </div>
      {value.length > 0 && <div className="ex-chips">{value.map((tag) => <Chip key={tag}>{tag}<button type="button" className="ex-chips__x" onClick={() => onChange(value.filter((x) => x !== tag))} aria-label={tr('إزالة', 'Remove') + ' ' + tag}><UdIcon name="x" size={12} /></button></Chip>)}</div>}
    </div>
  );
}

/** Public profile: what clients read. Publishing is allowed only when the API reports no missing requirement. */
export default function ProfileTab({ workspace, onChange }) {
  const { tr, tx } = useUserI18n();
  const { notify } = useBrandFeedback();
  const fileRef = useRef(null);
  const { profile, publication, account } = workspace;
  const [form, setForm] = useState({ professionalTitle: profile.professionalTitle, yearsExperience: profile.yearsExperience, bio: profile.bio, specialties: profile.specialties, publicLanguages: profile.publicLanguages });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState('');
  useEffect(() => { setForm({ professionalTitle: profile.professionalTitle, yearsExperience: profile.yearsExperience, bio: profile.bio, specialties: profile.specialties, publicLanguages: profile.publicLanguages }); }, [profile.professionalTitle, profile.bio, profile.yearsExperience, profile.specialties, profile.publicLanguages]);
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const run = async (name, call, success) => {
    setBusy(name); setErrors({});
    try { await call(); await onChange(); if (success) notify({ message: success, tone: 'success' }); return true; } catch (error) {
      setErrors(fieldErrors(error)); notify({ message: getErrorMessage(error), tone: 'error' }); return false;
    } finally { setBusy(''); }
  };
  const local = {};
  if (!form.professionalTitle.trim()) local.professionalTitle = tr('اكتب مسماك المهني.', 'Add your professional title.');
  if (form.bio.trim().length < BIO_MIN) local.bio = tr(`النبذة قصيرة: ${form.bio.trim().length} من ${BIO_MIN} حرفًا.`, `Too short: ${form.bio.trim().length} of ${BIO_MIN} characters.`);
  if (!form.publicLanguages.length) local.publicLanguages = tr('اختر لغة واحدة على الأقل.', 'Pick at least one language.');
  const [tried, setTried] = useState(false);
  const shown = { ...(tried ? local : {}), ...errors };
  const save = (event) => { event.preventDefault(); setTried(true); if (Object.keys(local).length) return; run('save', () => expertProfileService.updateProfile(profilePayload(form)), tr('حُفظ ملفك.', 'Your profile was saved.')); };
  const toggleLang = (code) => set('publicLanguages')(form.publicLanguages.includes(code) ? form.publicLanguages.filter((c) => c !== code) : [...form.publicLanguages, code]);
  const upload = (event) => { const file = event.target.files?.[0]; event.target.value = ''; if (file) run('avatar', () => expertProfileService.uploadAvatar(file), tr('تم تحديث الصورة.', 'Photo updated.')); };
  const tabOf = (code) => ({ kyc: PATHS.EXPERT_KYC, profile: null, availability: `${PATHS.EXPERT_PROFILE}?tab=availability`, scopes: `${PATHS.EXPERT_PROFILE}?tab=scopes` }[MISSING_TARGET[code]]);

  return (
    <>
      <Card className="jr-card jr-block">
        <CardHeader icon={profile.isPublished ? 'eye' : 'eyeOff'} title={tr('ظهور ملفك للعملاء', 'Your public visibility')} aside={<StatusPill tone={publication.publiclyVisible ? 'success' : 'neutral'}>{publication.publiclyVisible ? tr('ظاهر للعملاء', 'Visible') : tr('غير ظاهر', 'Hidden')}</StatusPill>} />
        {publication.missingRequirements.length > 0 ? (
          <>
            <p className="jr-lead">{tr('أكمل هذه الأمور ليصبح ملفك جاهزًا للنشر:', 'Complete these to get ready to publish:')}</p>
            <ul className="ex-todo">{publication.missingRequirements.map((code) => { const to = tabOf(code); return <li key={code}><UdIcon name="alert" size={16} /><span>{tx(PUBLICATION_LABEL[code] || [code, code])}</span>{to && <Link className="ud-linkbtn" to={to}>{tr('اذهب', 'Go')}</Link>}</li>; })}</ul>
          </>
        ) : (
          <div className="jr-actions jr-actions--start">
            {profile.isPublished
              ? <><Button variant="secondary" icon="eyeOff" loading={busy === 'unpublish'} onClick={() => run('unpublish', () => expertProfileService.unpublish(), tr('أُخفي ملفك.', 'Your profile is hidden.'))}>{tr('إخفاء الملف', 'Hide profile')}</Button>{publication.publicPath && <Button variant="ghost" icon="externalLink" to={publication.publicPath}>{tr('عرض ملفي العام', 'View public profile')}</Button>}</>
              : <Button icon="eye" loading={busy === 'publish'} onClick={() => run('publish', () => expertProfileService.publish(), tr('ملفك ظاهر للعملاء الآن.', 'Your profile is now visible.'))}>{tr('انشر ملفي', 'Publish profile')}</Button>}
          </div>
        )}
      </Card>

      <Card className="jr-card jr-block">
        <CardHeader icon="user" title={tr('ملفي المهني', 'My professional profile')} />
        <form onSubmit={save} noValidate className="ex-form">
          <div className="ex-avatar">
            <Avatar src={profile.avatarUrl} name={account.name} size={72} />
            <div><b>{account.name}</b><small>{account.email}</small>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={upload} />
              <Button type="button" size="sm" variant="secondary" icon="upload" loading={busy === 'avatar'} onClick={() => fileRef.current?.click()}>{tr('تغيير الصورة', 'Change photo')}</Button></div>
          </div>
          <div className="jr-basics">
            <Field label={tr('المسمى المهني', 'Professional title')} required htmlFor="pf-title" error={shown.professionalTitle}><TextInput id="pf-title" value={form.professionalTitle} onChange={set('professionalTitle')} maxLength={120} /></Field>
            <Field label={tr('سنوات الخبرة', 'Years of experience')} htmlFor="pf-years" error={shown.yearsExperience}><TextInput id="pf-years" type="number" min="0" max="60" dir="ltr" value={form.yearsExperience} onChange={set('yearsExperience')} /></Field>
          </div>
          <Field label={tr('نبذة تعريفية', 'About you')} required htmlFor="pf-bio" error={shown.bio} hint={tr(`${BIO_MIN} حرفًا على الأقل. اكتب ما يهم العميل: تخصصك وخبرتك وكيف تساعده.`, `At least ${BIO_MIN} characters. Say what matters to a client: your focus, experience and how you help.`)}><TextArea id="pf-bio" rows={5} value={form.bio} onChange={set('bio')} maxLength={1500} invalid={Boolean(shown.bio)} /></Field>
          <Field label={tr('التخصصات', 'Specialties')} htmlFor="pf-spec" optional hint={tr('اضغط Enter بعد كل تخصص.', 'Press Enter after each one.')}><Tags id="pf-spec" value={form.specialties} onChange={set('specialties')} placeholder={tr('مثال: عقود الشركات', 'e.g. Corporate contracts')} /></Field>
          <Field label={tr('اللغات الظاهرة للعملاء', 'Languages clients see')} required error={shown.publicLanguages}>
            <div className="ex-chips ex-chips--pick" role="group">{Object.entries(LANGUAGE_LABEL).map(([code, label]) => <button key={code} type="button" aria-pressed={form.publicLanguages.includes(code)} className={`ud-chip${form.publicLanguages.includes(code) ? ' is-on' : ''}`} onClick={() => toggleLang(code)}>{form.publicLanguages.includes(code) && <UdIcon name="check" size={13} stroke={3} />}{tx(label)}</button>)}</div>
          </Field>
          <div className="jr-actions"><Button type="submit" icon="check" loading={busy === 'save'}>{tr('حفظ الملف', 'Save profile')}</Button></div>
        </form>
      </Card>
    </>
  );
}

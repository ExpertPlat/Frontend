import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBrandFeedback } from '../../../../components/BrandFeedback/BrandFeedback';
import { getErrorMessage } from '../../../../api/errorHandler';
import { PATHS } from '../../../../routes/paths';
import { useIdempotentAction, useResource } from '../../../../services/hooks';
import { expertOfferingsService } from '../../../../services/expert/expertWorkService';
import { catalogService } from '../../../../services/user/accountService';
import UdIcon from '../../../userDashboard/components/UdIcon';
import { Button, Card, CardHeader, Checkbox, Field, PageHeader, Select, SkeletonRows, TextArea } from '../../../userDashboard/components/ui';
import { useUserI18n } from '../../../userDashboard/i18n/UserI18nContext';
import { ResourceError, fieldErrors } from '../../common/parts';
import { SERVICE_MODES } from '../../data/expertProfileData';
import { LANGUAGE_LABEL, SERVICE_MODE_LABEL } from '../../utils/expertStatuses';

/** Create or edit one offering. The catalog service cannot change after creation. */
export default function ExpertOfferingForm() {
  const { offeringId } = useParams();
  const editing = Boolean(offeringId);
  const navigate = useNavigate();
  const { tr, tx } = useUserI18n();
  const { notify } = useBrandFeedback();
  const create = useIdempotentAction('offering');
  const existing = useResource(() => expertOfferingsService.get(offeringId), [offeringId], { enabled: editing });
  const eligible = useResource(() => expertOfferingsService.eligibleServices(), [], { enabled: !editing });
  const countries = useResource(() => catalogService.countries(), []);
  const [form, setForm] = useState({ catalogEntryId: '', deliveryModes: [], languages: ['ar'], jurisdictionCodes: [], summary: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (existing.data) setForm({ catalogEntryId: existing.data.catalogEntryId, deliveryModes: existing.data.deliveryModes, languages: existing.data.languages, jurisdictionCodes: existing.data.jurisdictionCodes || [], summary: existing.data.summary || '' }); }, [existing.data]);
  const service = editing ? existing.data?.service : (eligible.data || []).find((s) => s.id === Number(form.catalogEntryId));
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const toggle = (key, value) => set({ [key]: form[key].includes(value) ? form[key].filter((x) => x !== value) : [...form[key], value] });
  const modes = service?.deliveryModes || SERVICE_MODES;
  const err = (key) => { const v = errors[key]; return Array.isArray(v) ? v[0] : v; };

  const save = async (event) => {
    event.preventDefault();
    const local = {};
    if (!editing && !form.catalogEntryId) local.catalogEntryId = tr('اختر الخدمة.', 'Pick the service.');
    if (!form.deliveryModes.length) local.deliveryModes = tr('اختر طريقة تقديم واحدة على الأقل.', 'Pick at least one delivery mode.');
    if (!form.languages.length) local.languages = tr('اختر لغة واحدة على الأقل.', 'Pick at least one language.');
    setErrors(local); if (Object.keys(local).length) return;
    setSaving(true);
    try {
      const payload = { ...form, catalogEntryId: Number(form.catalogEntryId) };
      if (editing) await expertOfferingsService.update(existing.data, payload);
      else { const r = await create.run(({ idempotencyKey }) => expertOfferingsService.create(payload, { idempotencyKey })); if (!r.ok) throw r.error; }
      notify({ message: tr('حُفظت الخدمة.', 'Service saved.'), tone: 'success' }); navigate(PATHS.EXPERT_OFFERINGS);
    } catch (error) {
      if (error.status === 409) await existing.reload({ silent: true });
      setErrors(fieldErrors(error)); notify({ message: getErrorMessage(error), tone: 'error' });
    } finally { setSaving(false); }
  };

  return (
    <div className="jr-page jr-page--narrow">
      <PageHeader icon="briefcase" title={editing ? tr('تعديل الخدمة', 'Edit service') : tr('خدمة جديدة', 'New service')} subtitle={<Button variant="ghost" size="sm" icon="arrowRight" iconDir to={PATHS.EXPERT_OFFERINGS}>{tr('كل الخدمات', 'All services')}</Button>} />
      <ResourceError resource={editing ? existing : eligible} />
      {(editing ? existing.loading : eligible.loading) && <Card className="jr-card"><SkeletonRows rows={3} /></Card>}
      {(editing ? existing.data : eligible.data) && (
        <form onSubmit={save} noValidate className="ex-form">
          <Card className="jr-card jr-block">
            <CardHeader icon="briefcase" title={tr('الخدمة', 'Service')} />
            {editing
              ? <p className="jr-lead"><b>{service?.label}</b></p>
              : <Field label={tr('اختر من خدماتك المؤهلة', 'Pick one of your eligible services')} required htmlFor="of-svc" error={err('catalogEntryId')}>
                <Select id="of-svc" value={String(form.catalogEntryId)} onChange={(v) => set({ catalogEntryId: v, deliveryModes: [] })} placeholder={tr('اختر', 'Choose')} options={(eligible.data || []).map((s) => ({ value: String(s.id), label: s.label }))} />
              </Field>}
            {service?.summary && <p className="jr-lead">{service.summary}</p>}
          </Card>
          <Card className="jr-card jr-block">
            <CardHeader icon="video" title={tr('كيف تقدّمها', 'How you deliver it')} />
            <Field error={err('deliveryModes')}><div className="ex-checks">{modes.map((m) => <Checkbox key={m} id={`dm-${m}`} checked={form.deliveryModes.includes(m)} onChange={() => toggle('deliveryModes', m)} label={tx(SERVICE_MODE_LABEL[m] || [m, m])} />)}</div></Field>
            <Field label={tr('اللغات', 'Languages')} error={err('languages')}><div className="ex-checks">{Object.entries(LANGUAGE_LABEL).map(([code, label]) => <Checkbox key={code} id={`lg-${code}`} checked={form.languages.includes(code)} onChange={() => toggle('languages', code)} label={tx(label)} />)}</div></Field>
          </Card>
          <Card className="jr-card jr-block">
            <CardHeader icon="globe" title={tr('الدول والوصف', 'Countries and description')} />
            <Field label={tr('الدول التي تخدمها', 'Countries you cover')} optional error={err('jurisdictionCodes')} hint={tr('اتركها فارغة إن كانت الخدمة غير مقيّدة بدولة.', 'Leave empty if the service is not tied to a country.')}>
              <div className="ex-checks">{(service?.jurisdictionCodes || (countries.data || []).map((c) => c.code)).map((code) => <Checkbox key={code} id={`jc-${code}`} checked={form.jurisdictionCodes.includes(code)} onChange={() => toggle('jurisdictionCodes', code)} label={(countries.data || []).find((c) => c.code === code)?.name || code} />)}</div>
            </Field>
            <Field label={tr('وصف مختصر للعميل', 'Short description for clients')} optional htmlFor="of-sum" error={err('summary')}><TextArea id="of-sum" rows={4} maxLength={500} value={form.summary} onChange={(v) => set({ summary: v })} /></Field>
          </Card>
          <div className="jr-confirmbar"><span><UdIcon name="info" size={16} />{tr('تُنشر الخدمة من صفحة الخدمات بعد الحفظ.', 'Publish the service from the list after saving.')}</span><Button type="submit" icon="check" loading={saving}>{tr('حفظ', 'Save')}</Button></div>
        </form>
      )}
    </div>
  );
}

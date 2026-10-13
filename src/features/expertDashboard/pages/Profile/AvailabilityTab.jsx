import React, { useState } from 'react';
import { useBrandFeedback } from '../../../../components/BrandFeedback/BrandFeedback';
import { getErrorMessage } from '../../../../api/errorHandler';
import { expertProfileService } from '../../../../services/expert/expertProfileService';
import UdIcon from '../../../userDashboard/components/UdIcon';
import { Button, Card, CardHeader, Checkbox, Chip, Field, Select, Switch, TextInput } from '../../../userDashboard/components/ui';
import { useUserI18n } from '../../../userDashboard/i18n/UserI18nContext';
import { fieldErrors } from '../../common/parts';
import { SERVICE_MODES, availabilityPayload, getAvailabilityValidationErrors } from '../../data/expertProfileData';
import { DAY_LABEL, SERVICE_MODE_LABEL, TIMEZONES } from '../../utils/expertStatuses';

const MESSAGES = {
  timezone: ['اختر منطقة زمنية صحيحة.', 'Pick a valid time zone.'],
  serviceModes: ['اختر نوع خدمة واحدًا على الأقل.', 'Pick at least one service type.'],
  weeklySchedule: ['جدول الأسبوع غير صالح.', 'The weekly schedule is not valid.'],
  windowRequired: ['أضف فترة عمل لليوم المفعّل.', 'Add a time window for the enabled day.'],
  windowMax: ['حتى 3 فترات في اليوم.', 'Up to 3 windows per day.'],
  startTime: ['اكتب وقت البداية.', 'Add a start time.'],
  endTime: ['اكتب وقت النهاية.', 'Add an end time.'],
  endAfterStart: ['النهاية بعد البداية.', 'The end is after the start.'],
  blackoutDates: ['تواريخ الإجازة يجب أن تكون اليوم أو بعده بلا تكرار.', 'Days off must be today or later, no duplicates.'],
  capacity: ['السعة بين 1 و50.', 'Capacity is between 1 and 50.'],
  responseTime: ['وقت الرد بين 1 و336 ساعة.', 'Response time is between 1 and 336 hours.'],
};

/** Working hours, days off and how many requests the expert accepts. */
export default function AvailabilityTab({ workspace, onChange }) {
  const { tr, tx, language } = useUserI18n();
  const { notify } = useBrandFeedback();
  const [form, setForm] = useState(() => structuredClone(workspace.availability));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [newDay, setNewDay] = useState('');
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setDay = (index, patch) => setForm((f) => ({ ...f, weeklySchedule: f.weeklySchedule.map((d, i) => (i === index ? { ...d, ...patch } : d)) }));
  const setWindow = (di, wi, patch) => setDay(di, { windows: form.weeklySchedule[di].windows.map((w, i) => (i === wi ? { ...w, ...patch } : w)) });
  const toggleDay = (index, enabled) => setDay(index, { enabled, windows: enabled && form.weeklySchedule[index].windows.length === 0 ? [{ start: '09:00', end: '17:00' }] : form.weeklySchedule[index].windows });
  const toggleMode = (mode) => set({ serviceModes: form.serviceModes.includes(mode) ? form.serviceModes.filter((m) => m !== mode) : [...form.serviceModes, mode] });
  const text = (key) => MESSAGES[key]?.[language === 'en' ? 1 : 0];
  const err = (key) => { const v = errors[key]; return Array.isArray(v) ? v[0] : v; };

  const save = async (event) => {
    event.preventDefault();
    const local = getAvailabilityValidationErrors(form, (key) => text(key.split('.').pop()) || key);
    if (Object.keys(local).length) { setErrors(local); notify({ message: tr('راجع الحقول المظللة.', 'Check the highlighted fields.'), tone: 'error' }); return; }
    setSaving(true); setErrors({});
    try { await expertProfileService.updateAvailability(availabilityPayload(form)); await onChange(); notify({ message: tr('حُفظت إتاحتك.', 'Availability saved.'), tone: 'success' }); } catch (error) {
      setErrors(fieldErrors(error)); notify({ message: getErrorMessage(error), tone: 'error' });
    } finally { setSaving(false); }
  };
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form onSubmit={save} noValidate className="ex-form">
      <Card className="jr-card jr-block">
        <CardHeader icon="video" title={tr('أنواع الخدمة', 'Service types')} />
        <Field error={err('serviceModes')}>
          <div className="ex-checks">{SERVICE_MODES.map((mode) => <Checkbox key={mode} id={`sm-${mode}`} checked={form.serviceModes.includes(mode)} onChange={() => toggleMode(mode)} label={tx(SERVICE_MODE_LABEL[mode])} />)}</div>
        </Field>
      </Card>

      <Card className="jr-card jr-block">
        <CardHeader icon="clock" title={tr('ساعات العمل', 'Working hours')} />
        <Field label={tr('المنطقة الزمنية', 'Time zone')} htmlFor="av-tz" error={err('timezone')} hint={tr('تُعرض مواعيد جلساتك وفق هذه المنطقة.', 'Your session times follow this zone.')}>
          <Select id="av-tz" value={form.timezone} onChange={(v) => set({ timezone: v })} options={[...new Set([form.timezone, ...TIMEZONES])].map((z) => ({ value: z, label: z }))} />
        </Field>
        <ul className="ex-week">
          {form.weeklySchedule.map((day, di) => (
            <li key={day.day} className={day.enabled ? 'is-on' : ''}>
              <Switch checked={day.enabled} onChange={(on) => toggleDay(di, on)} label={tx(DAY_LABEL[day.day])} />
              {day.enabled && (
                <div className="ex-week__windows">
                  {day.windows.map((w, wi) => (
                    <div key={wi} className="ex-window">
                      <input type="time" dir="ltr" aria-label={tr('من', 'From')} value={w.start} onChange={(e) => setWindow(di, wi, { start: e.target.value })} />
                      <span aria-hidden="true">–</span>
                      <input type="time" dir="ltr" aria-label={tr('إلى', 'To')} value={w.end} onChange={(e) => setWindow(di, wi, { end: e.target.value })} />
                      <button type="button" className="ex-icon" onClick={() => setDay(di, { windows: day.windows.filter((_, i) => i !== wi) })} aria-label={tr('حذف الفترة', 'Remove window')}><UdIcon name="trash" size={15} /></button>
                      {(err(`weeklySchedule.${di}.windows.${wi}.end`) || err(`weeklySchedule.${di}.windows.${wi}.start`)) && <small className="ex-err">{err(`weeklySchedule.${di}.windows.${wi}.end`) || err(`weeklySchedule.${di}.windows.${wi}.start`)}</small>}
                    </div>
                  ))}
                  {err(`weeklySchedule.${di}.windows`) && <small className="ex-err">{err(`weeklySchedule.${di}.windows`)}</small>}
                  {day.windows.length < 3 && <Button type="button" size="sm" variant="ghost" icon="plus" onClick={() => setDay(di, { windows: [...day.windows, { start: '09:00', end: '17:00' }] })}>{tr('فترة أخرى', 'Another window')}</Button>}
                </div>
              )}
            </li>
          ))}
        </ul>
        {err('weeklySchedule') && <small className="ex-err">{err('weeklySchedule')}</small>}
      </Card>

      <Card className="jr-card jr-block">
        <CardHeader icon="calendar" title={tr('أيام الإجازة', 'Days off')} />
        <Field error={err('blackoutDates')}>
          <div className="ex-tags__row">
            <div className="ud-input"><input type="date" dir="ltr" min={today} value={newDay} onChange={(e) => setNewDay(e.target.value)} aria-label={tr('تاريخ إجازة', 'Day off')} /></div>
            <Button type="button" variant="secondary" icon="plus" disabled={!newDay || form.blackoutDates.includes(newDay)} onClick={() => { set({ blackoutDates: [...form.blackoutDates, newDay].sort() }); setNewDay(''); }}>{tr('إضافة', 'Add')}</Button>
          </div>
        </Field>
        {form.blackoutDates.length > 0 && <div className="ex-chips">{form.blackoutDates.map((d) => <Chip key={d} icon="calendar"><bdi dir="ltr">{d}</bdi><button type="button" className="ex-chips__x" onClick={() => set({ blackoutDates: form.blackoutDates.filter((x) => x !== d) })} aria-label={tr('إزالة', 'Remove')}><UdIcon name="x" size={12} /></button></Chip>)}</div>}
      </Card>

      <Card className="jr-card jr-block">
        <CardHeader icon="sliders" title={tr('استقبال الطلبات', 'Taking requests')} />
        <Switch checked={form.acceptingNewRequests} onChange={(on) => set({ acceptingNewRequests: on })} label={tr('أستقبل طلبات جديدة', 'I am taking new requests')} description={tr('أطفئه عند الانشغال؛ لن يُرشَّح ملفك لعملاء جدد.', 'Turn off when busy; clients will not be matched to you.')} />
        <div className="jr-basics">
          <Field label={tr('أقصى عدد طلبات جارية', 'Max open requests')} htmlFor="av-cap" error={err('maxActiveRequests')}><TextInput id="av-cap" type="number" min="1" max="50" dir="ltr" value={form.maxActiveRequests} onChange={(v) => set({ maxActiveRequests: v })} /></Field>
          <Field label={tr('وقت الرد المعتاد (ساعات)', 'Usual response time (hours)')} htmlFor="av-resp" error={err('responseTimeHours')}><TextInput id="av-resp" type="number" min="1" max="336" dir="ltr" value={form.responseTimeHours} onChange={(v) => set({ responseTimeHours: v })} /></Field>
        </div>
      </Card>

      <div className="jr-confirmbar"><span /><Button type="submit" icon="check" loading={saving}>{tr('حفظ الإتاحة', 'Save availability')}</Button></div>
    </form>
  );
}

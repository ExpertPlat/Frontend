import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBrandFeedback } from '../../../components/BrandFeedback/BrandFeedback';
import { getFieldErrors, getFirstFieldError } from '../../../api/errorHandler';
import { useIdempotentAction, useResource } from '../../../services/hooks';
import { casesService } from '../../../services/user/casesService';
import { catalogService } from '../../../services/user/accountService';
import { useUserI18n } from '../i18n/UserI18nContext';
import UdIcon from '../components/UdIcon';
import { Button, Card, Field, PageHeader, Segmented, Select } from '../components/ui';
import { CASE_LANGUAGES, URGENCY } from '../utils/statuses';
import { stagePath } from './journeyData';
import { NewCaseFrame } from './JourneyLayout';
import { useVoiceDictation } from './useVoiceDictation';

/** Stage 1: the person describes the case in their own words, typed or spoken. POST /api/v2/user/cases */
export default function DescribeStep() {
  const { tr, tx, language } = useUserI18n();
  const navigate = useNavigate();
  const { notify } = useBrandFeedback();
  const countries = useResource(() => catalogService.countries(), []);
  const [form, setForm] = useState({ story: '', language: 'ar', residence: 'EG', caseCountry: 'AE', urgency: 'normal' });
  const [fieldErrors, setFieldErrors] = useState({});
  const { busy, run } = useIdempotentAction('case');
  const set = (changes) => setForm((current) => ({ ...current, ...changes }));
  const voice = useVoiceDictation({ language: form.language, onText: (story) => set({ story }) });

  const clock = `${String(Math.floor(voice.seconds / 60)).padStart(2, '0')}:${String(voice.seconds % 60).padStart(2, '0')}`;
  const ready = form.story.trim().length > 0 && !voice.recording;
  const countryOptions = (countries.data || []).map((item) => ({ value: item.code, label: item.name }));

  const submit = async (event) => {
    event.preventDefault();
    if (!ready || busy) return;
    setFieldErrors({});
    const result = await run((options) => casesService.create(form, options));
    if (!result.ok) { setFieldErrors(getFieldErrors(result.error)); notify({ message: result.message, tone: 'error' }); return; }
    navigate(stagePath(result.data.id, 'analysis'));
  };

  return (
    <NewCaseFrame>
      <form className="jr-page jr-page--narrow" onSubmit={submit} noValidate>
        <PageHeader icon="edit" title={tr('احكِ لنا حالتك', 'Tell us about your case')} subtitle={tr('اكتب بلغتك وبطريقتك. لا تحتاج أن تعرف التخصص المناسب، نحدده لك.', 'Write in your own words and language. You do not need to know the right specialty; we will work it out.')} />

        <Card className="jr-card">
          <Field label={tr('ما هي مشكلتك؟', 'What is your situation?')} htmlFor="jr-story" error={getFirstFieldError(fieldErrors, 'story')} hint={tr('اذكر ما تريد تحقيقه وما الذي لا تعرفه. التفاصيل القليلة تكفي.', 'Say what you want to achieve and what you do not know. A few details are enough.')}>
            <div className={`ud-input ud-input--area jr-story${voice.recording ? ' is-live' : ''}`}>
              <textarea id="jr-story" rows={8} value={form.story} readOnly={voice.recording} onChange={(event) => set({ story: event.target.value })} placeholder={tr('مثال: عندي مشروع وأريد أن أوسّعه لكن لا أعرف من أين أبدأ…', 'Example: I have a business I want to expand but I do not know where to start…')} />
            </div>
          </Field>
          {voice.supported && (
            <div className={`jr-voice${voice.recording ? ' is-recording' : ''}`}>
              {voice.recording ? (
                <>
                  <button type="button" className="jr-mic is-stop" onClick={() => voice.stop(form.story.trim().length > 0)} aria-label={tr('إيقاف التسجيل', 'Stop recording')}><UdIcon name="stop" size={22} /></button>
                  <div className="jr-voice__live" aria-live="polite">
                    <b><i aria-hidden="true" />{tr('جارٍ الاستماع… تحدّث بلغتك', 'Listening… speak in your own language')}</b>
                    <span className="jr-wave" aria-hidden="true">{Array.from({ length: 36 }, (_, index) => <i key={index} style={{ '--d': `${(index * 83) % 900}ms`, '--h': `${30 + ((index * 37) % 70)}%` }} />)}</span>
                  </div>
                  <time className="jr-voice__clock" dir="ltr">{clock}</time>
                </>
              ) : (
                <>
                  <button type="button" className="jr-mic" onClick={() => voice.start(form.story)} aria-label={voice.done ? tr('سجّل مرة أخرى', 'Record again') : tr('سجّل حالتك بصوتك', 'Record your case by voice')}><UdIcon name="mic" size={24} /></button>
                  <div className="jr-voice__copy">
                    {voice.done
                      ? <><b className="is-ok"><UdIcon name="checkCircle" size={17} />{tr('حوّلنا صوتك إلى نص. يمكنك تعديله', 'We turned your voice into text. You can edit it')}</b><small>{tr('اضغط على الميكروفون لتسجيل مرة أخرى', 'Tap the microphone to record again')}</small></>
                      : <><b>{tr('تحدّث بدل أن تكتب', 'Speak instead of typing')}</b><small>{tr('اضغط على الميكروفون وتحدّث بلغتك أو بلهجتك، ونكتب لك الكلام.', 'Tap the microphone and speak in your language or dialect; we write it for you.')}</small></>}
                  </div>
                </>
              )}
            </div>
          )}
        </Card>

        <Card className="jr-card">
          <div className="jr-basics">
            <Field label={tr('لغة الشرح', 'Language you write in')} className="jr-basics__wide">
              <Segmented label={tr('لغة الشرح', 'Language you write in')} value={form.language} onChange={(value) => set({ language: value })} options={CASE_LANGUAGES.map((item) => ({ value: item.id, label: tx(item.label) }))} />
              {form.language === 'ar' && <p className="ud-field__note">{tx(CASE_LANGUAGES[0].hint)}</p>}
            </Field>
            <Field label={tr('بلد إقامتك', 'Country you live in')} htmlFor="jr-res"><Select id="jr-res" value={form.residence} onChange={(value) => set({ residence: value })} options={countryOptions} /></Field>
            <Field label={tr('بلد الحالة', 'Country the case concerns')} htmlFor="jr-case"><Select id="jr-case" value={form.caseCountry} onChange={(value) => set({ caseCountry: value })} options={countryOptions} /></Field>
            <Field label={tr('درجة الاستعجال', 'Urgency')} className="jr-basics__wide">
              <Segmented label={tr('درجة الاستعجال', 'Urgency')} value={form.urgency} onChange={(value) => set({ urgency: value })} options={URGENCY.map((item) => ({ value: item.id, label: tx(item.label) }))} />
            </Field>
          </div>
          <p className="jr-remote"><UdIcon name="video" size={17} />{tr('جميع الجلسات تتم عن بُعد عبر مكالمة فيديو.', 'All sessions take place remotely over video.')}</p>
        </Card>

        <div className="jr-actions">
          <Button type="submit" size="lg" icon="sparkle" loading={busy} disabled={!ready}>{tr('حلّل حالتي', 'Analyse my case')}</Button>
        </div>
      </form>
    </NewCaseFrame>
  );
}

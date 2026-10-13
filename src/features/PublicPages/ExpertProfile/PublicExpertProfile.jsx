import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AdminIcon from '../../adminDashboard/components/AdminIcon/AdminIcon';
import LocaleSwitch from '../../../components/LocaleSwitch/LocaleSwitch';
import { useLocale } from '../../../context/LocaleContext';
import { expertProfileService } from '../../../services/expert/expertProfileService';
import { getErrorMessage } from '../../../api/errorHandler';
import { PATHS } from '../../../routes/paths';
import { resolveAssetUrl } from '../../../utils/resolveAssetUrl';
import './PublicExpertProfile.css';

const serviceLabels = {
  ar: {
    written_consultation: 'استشارة كتابية',
    video_consultation: 'استشارة فيديو',
    audio_consultation: 'استشارة صوتية',
    document_review: 'مراجعة مستندات',
    project_advisory: 'استشارة مشروع',
  },
  en: {
    written_consultation: 'Written consultation',
    video_consultation: 'Video consultation',
    audio_consultation: 'Audio consultation',
    document_review: 'Document review',
    project_advisory: 'Project advisory',
  },
};

const dayLabels = {
  ar: { mon: 'الاثنين', tue: 'الثلاثاء', wed: 'الأربعاء', thu: 'الخميس', fri: 'الجمعة', sat: 'السبت', sun: 'الأحد' },
  en: { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' },
};

const initials = (name) => String(name || 'E').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

export default function PublicExpertProfile() {
  const { expertSlug } = useParams();
  const { locale, dir, tr } = useLocale();
  const [expert, setExpert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    expertProfileService.getPublicProfile(expertSlug)
      .then((payload) => { if (active) setExpert(payload?.data?.expert || null); })
      .catch((requestError) => { if (active) setError(getErrorMessage(requestError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [expertSlug]);

  const activeDays = useMemo(
    () => (expert?.availability?.weeklySchedule || []).filter((day) => day.enabled && day.windows?.length),
    [expert],
  );

  if (loading) return <main className="public-expert-state" dir={dir}><span/><h1>{tr('جارٍ تحميل ملف الخبير', 'Loading expert profile')}</h1></main>;
  if (error || !expert) {
    return (
      <main className="public-expert-state is-error" dir={dir}>
        <AdminIcon name="info" size={30}/>
        <h1>{tr('الملف غير متاح', 'Profile unavailable')}</h1>
        <p>{error || tr('هذا الملف غير منشور أو لم يعد نطاق اعتماده فعالًا.', 'This profile is not published or no longer has an effective verified scope.')}</p>
        <Link to={PATHS.HOME}>{tr('العودة للرئيسية', 'Back to home')}</Link>
      </main>
    );
  }

  return (
    <main className="public-expert-page" dir={dir}>
      <header className="public-expert-nav">
        <Link to={PATHS.HOME} className="public-expert-brand"><span>S</span><b>SolveIt</b></Link>
        <div className="public-expert-nav__actions"><LocaleSwitch/><Link to={PATHS.LOGIN}>{tr('تسجيل الدخول', 'Sign in')}</Link></div>
      </header>

      <section className="public-expert-hero">
        <div className="public-expert-hero__glow"/>
        <div className="public-expert-identity">
          <div className="public-expert-avatar">{expert.avatarUrl ? <img src={resolveAssetUrl(expert.avatarUrl)} alt={expert.name}/> : <b>{initials(expert.name)}</b>}</div>
          <div>
            <span className="public-expert-verified"><AdminIcon name="verified" size={17}/>{tr('خبير معتمد من SolveIt', 'SolveIt verified expert')}</span>
            <h1>{expert.name}</h1>
            <h2>{expert.professionalTitle}</h2>
            <p><AdminIcon name="globe" size={15}/>{expert.country || tr('متاح عن بُعد', 'Available remotely')} · {(expert.languages || []).map((language) => language === 'ar' ? tr('العربية', 'Arabic') : language === 'en' ? tr('الإنجليزية', 'English') : language).join(' / ')}</p>
          </div>
        </div>
        <aside>
          <small>{tr('حالة استقبال الطلبات', 'Request availability')}</small>
          <b>{expert.availability?.acceptingNewRequests ? tr('متاح لطلبات جديدة', 'Accepting new requests') : tr('غير متاح مؤقتًا', 'Temporarily unavailable')}</b>
          <p>{tr('زمن الرد المتوقع', 'Expected response time')}: {expert.availability?.responseTimeHours || '—'} {tr('ساعة', 'hours')}</p>
          <small className="public-expert-sprint-note">{tr('الحجز وطلب الاستشارة سيُفعّلان في مرحلة لاحقة بعد اكتمال مسار الخدمة.', 'Booking and consultation requests will be enabled in a later service-flow sprint.')}</small>
        </aside>
      </section>

      <div className="public-expert-grid">
        <div className="public-expert-content">
          <section>
            <span>{tr('نبذة مهنية', 'Professional summary')}</span>
            <h2>{tr('خبرة واضحة ضمن نطاق موثّق', 'Professional experience within a verified scope')}</h2>
            <p className="public-expert-bio">{expert.bio}</p>
            <div className="public-expert-tags">{(expert.specialties || []).map((item) => <b key={item}>{item}</b>)}</div>
          </section>

          <section>
            <span>{tr('نطاق الاعتماد', 'Verified scope')}</span>
            <h2>{tr('ما الذي تم التحقق منه؟', 'What has been verified?')}</h2>
            <div className="public-scope-list">
              {(expert.verification?.scopes || []).map((scope) => (
                <article key={scope.id}>
                  <div><AdminIcon name="shield" size={21}/></div>
                  <div>
                    <small>{scope.domain} · {scope.jurisdiction}{scope.jurisdictionCountry ? ` · ${scope.jurisdictionCountry}` : ''}</small>
                    <h3>{scope.role}</h3>
                    <p>{(scope.serviceTypes || []).map((item) => serviceLabels[locale]?.[item] || item).join(' · ')}</p>
                  </div>
                  <span>{tr('فعّال', 'Active')}</span>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="public-expert-side">
          <section>
            <span>{tr('معلومات سريعة', 'Quick facts')}</span>
            <dl>
              <div><dt>{tr('سنوات الخبرة', 'Years of experience')}</dt><dd>{expert.yearsExperience ?? '—'}</dd></div>
              <div><dt>{tr('نطاقات معتمدة', 'Verified scopes')}</dt><dd>{expert.verification?.scopes?.length || 0}</dd></div>
              <div><dt>{tr('طرق الخدمة', 'Service modes')}</dt><dd>{expert.availability?.serviceModes?.length || 0}</dd></div>
            </dl>
          </section>
          <section>
            <span>{tr('التوفر الأسبوعي', 'Weekly availability')}</span>
            {activeDays.length ? (
              <div className="public-availability-list">
                {activeDays.map((day) => <div key={day.day}><b>{dayLabels[locale]?.[day.day] || day.day}</b><small>{day.windows.map((window) => `${window.start}–${window.end}`).join(locale === 'ar' ? '، ' : ', ')}</small></div>)}
              </div>
            ) : <p>{tr('لم يحدد الخبير مواعيد عامة حاليًا.', 'The expert has not published weekly availability yet.')}</p>}
            <small className="public-timezone">{expert.availability?.timezone}</small>
          </section>
        </aside>
      </div>
    </main>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../../../../components/Icon/Icon';
import useLandingDestinations from '../../../../../hooks/useLandingDestinations';
import { experts, expertsEn } from '../../data/landingData';
import { useLocale } from '../../../../../context/LocaleContext';

function ExpertsSection() {
  const { locale, tr } = useLocale();
  const { browseExpertsPath } = useLandingDestinations();
  return (
    <section className="lp-section lp-experts" id="experts">
      <div className="container">
        <div className="lp-head lp-head--split" data-reveal>
          <div><span className="lp-kicker">{tr('الخبرة المناسبة', 'The right expertise')}</span><h2>{tr('الخبير المناسب، للسؤال المناسب.', 'The right expert for the right question.')}</h2></div>
          <p>{tr('المطابقة تبدأ من تفاصيل الحالة: المجال واللغة والبلد والتوفر، ثم يراجع الخبير الملاءمة قبل بدء الخدمة.', 'Matching considers the field, language, country, and availability. An expert reviews suitability before work starts.')}</p>
        </div>
        <div className="lp-experts__layout">
          <div className="lp-match" data-reveal>
            <div className="lp-match__head"><span><Icon name="spark" size={18} />{tr('مطابقة الحالة', 'Case matching')}</span><em>{tr('مثال توضيحي', 'Illustrative')}</em></div>
            <h3>{tr('ما نوع الخبرة التي تحتاجها هذه الحالة؟', 'What expertise does this case need?')}</h3>
            <dl>
              <div><dt>{tr('المجال الرئيسي', 'Primary field')}</dt><dd>{tr('قانوني', 'Legal')}</dd></div>
              <div><dt>{tr('مجال مساند', 'Supporting field')}</dt><dd>{tr('تقني', 'Technology')}</dd></div>
              <div><dt>{tr('اللغة', 'Language')}</dt><dd>{tr('العربية', 'Arabic')}</dd></div>
              <div><dt>{tr('طريقة التقديم', 'Delivery')}</dt><dd><Icon name="video" size={15} />{tr('فيديو عن بُعد', 'Remote video')}</dd></div>
            </dl>
            <div className="lp-match__score"><span>{tr('ملاءمة السياق', 'Context fit')}</span><div><i style={{ width: '86%' }} /></div><b>{tr('عالية', 'High')}</b></div>
          </div>
          <div className="lp-expertlist">
            {(locale === 'ar' ? experts : expertsEn).map(([initials, role, specialty, language], index) => (
              <article className="lp-expert" data-reveal style={{ '--delay': `${index * 65}ms` }} key={role}>
                <span className="lp-expert__avatar">{initials}</span>
                <div className="lp-expert__body"><span className="lp-expert__tag"><Icon name="check" size={13} />{tr('مثال: خبير متحقَّق', 'Example: verified expert')}</span><h3>{role}</h3><p>{specialty}</p><small>{language}</small></div>
                <Link to={browseExpertsPath} aria-label={`${tr('استعرض خبراء', 'Browse experts in')} ${role}`}><Icon name="arrow" size={18} /></Link>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ExpertsSection;

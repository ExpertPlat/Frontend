import React from 'react';
import Icon from '../../../../../components/Icon/Icon';
import { landingSteps, landingStepsEn } from '../../data/landingData';
import { useLocale } from '../../../../../context/LocaleContext';

function HowItWorksSection() {
  const { locale, tr } = useLocale();
  const steps = locale === 'ar' ? landingSteps : landingStepsEn;
  return (
    <section className="lp-section lp-how" id="how">
      <div className="container">
        <div className="lp-head" data-reveal>
          <span className="lp-kicker">{tr('كيف تعمل المنصة؟', 'How it works')}</span>
          <h2>{tr('من وصف بسيط… إلى قرار أوضح.', 'From a simple description to a clearer decision.')}</h2>
          <p>{tr('لا تحتاج أن تعرف من هو الخبير المناسب قبل أن تبدأ. تبدأ الرحلة من حاجتك، ثم تتحول الحالة إلى مسار منظم يمكن مراجعته.', 'You do not need to know which expert to ask first. Start with your need and build a structured case you can revisit.')}</p>
        </div>

        <ol className="lp-steps">
          {steps.map(([no, title, text, icon], index) => (
            <li className="lp-step" data-reveal style={{ '--delay': `${index * 80}ms` }} key={no}>
              <span className="lp-step__no">{no}</span>
              <span className="lp-step__icon"><Icon name={icon} size={24} /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>

        <div className="lp-remote" data-reveal>
          <div className="lp-remote__copy">
            <span className="lp-remote__badge"><Icon name="globe" size={20} /></span>
            <div>
              <b>{tr('كل الخدمات تُقدَّم عن بُعد', 'Every service is delivered remotely')}</b>
              <p>{tr('اختر طريقة تقديم الخدمة التي تناسبك، من أي مكان وفي الوقت المتفق عليه.', 'Choose the delivery format that suits you, from anywhere and at the agreed time.')}</p>
            </div>
          </div>
          <ul className="lp-remote__modes">
            <li><Icon name="video" size={20} />{tr('مكالمة فيديو', 'Video call')}</li>
            <li><Icon name="phone" size={20} />{tr('مكالمة صوتية', 'Audio call')}</li>
            <li><Icon name="pen" size={20} />{tr('استشارة مكتوبة', 'Written consultation')}</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export default HowItWorksSection;

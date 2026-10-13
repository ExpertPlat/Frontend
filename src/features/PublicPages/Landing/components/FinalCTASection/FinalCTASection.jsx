import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../../../../components/Icon/Icon';
import useLandingDestinations from '../../../../../hooks/useLandingDestinations';
import { useLocale } from '../../../../../context/LocaleContext';
import { LogoImage } from '../../../../../components/Logo/Logo';

function FinalCTASection() {
  const { tr } = useLocale();
  const { startCasePath } = useLandingDestinations();
  return (
    <section className="lp-cta" id="start">
      <div className="container">
        <div className="lp-cta__box" data-reveal>
          <LogoImage variant="mark" tone="light" className="lp-cta__mark" alt="" />
          <span className="lp-pill lp-pill--light"><span className="lp-pill__dot" />{tr('ابدأ من حاجتك', 'Start with your need')}</span>
          <h2>{tr('لست بحاجة لمعرفة من تحتاج أولًا.', 'You do not need to know whom to ask first.')}</h2>
          <p>{tr('ابدأ بشرح حالتك، ودع الخطوة التالية تصبح أوضح.', 'Describe your situation and find a clearer next step.')}</p>
          <div className="lp-cta__actions">
            <Link className="lp-btn lp-btn--cream lp-btn--lg" to={startCasePath}>{tr('ابدأ حالتك الآن', 'Start your case')} <Icon name="arrow" size={18} /></Link>
            <a className="lp-cta__link" href="#how">{tr('كيف تعمل المنصة؟', 'How does it work?')}</a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FinalCTASection;

import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../../../../components/Icon/Icon';
import useLandingDestinations from '../../../../../hooks/useLandingDestinations';
import { useCases, useCasesEn } from '../../data/landingData';
import { useLocale } from '../../../../../context/LocaleContext';

function UseCasesSection() {
  const { locale, tr } = useLocale();
  const { startCasePath } = useLandingDestinations();
  const [active, setActive] = useState(0);
  const tabRefs = useRef([]);
  const items = locale === 'ar' ? useCases : useCasesEn;
  const item = items[active];

  const onKeyDown = (event) => {
    const rtl = document.documentElement.dir === 'rtl' || locale === 'ar';
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const backward = rtl ? 'ArrowRight' : 'ArrowLeft';
    let next = null;
    if (event.key === forward) next = (active + 1) % items.length;
    if (event.key === backward) next = (active - 1 + items.length) % items.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = items.length - 1;
    if (next === null) return;
    event.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <section className="lp-section lp-cases" id="cases">
      <div className="container">
        <div className="lp-head lp-head--split" data-reveal>
          <div><span className="lp-kicker">{tr('أمثلة يفهمها الجميع', 'Real examples')}</span><h2>{tr('حالات تبدأ من الحياة الحقيقية.', 'Cases that start in real life.')}</h2></div>
          <p>{tr('قد تحتاج خبيرًا واحدًا، وقد تحتاج أكثر من تخصص. عدد الخبراء يتبع حاجة الحالة، وليس قالبًا ثابتًا.', 'Some cases need one expert, others need several. The team follows the actual need.')}</p>
        </div>

        <div className="lp-usecase" data-reveal>
          <div className="lp-usecase__tabs" role="tablist" aria-label={tr('أمثلة على الحالات', 'Example cases')} onKeyDown={onKeyDown}>
            {items.map((entry, index) => (
              <button key={entry.tag} ref={(node) => { tabRefs.current[index] = node; }} type="button" role="tab" id={`usecase-tab-${index}`} aria-selected={active === index} aria-controls="usecase-panel" tabIndex={active === index ? 0 : -1} className={active === index ? 'is-active' : ''} onClick={() => setActive(index)}>
                <span><Icon name={entry.icon} size={20} /></span>
                <b>{entry.tag}</b>
              </button>
            ))}
          </div>

          <div className="lp-usecase__panel" role="tabpanel" id="usecase-panel" aria-labelledby={`usecase-tab-${active}`} key={`${locale}-${active}`}>
            <div className="lp-usecase__story">
              <span className="lp-usecase__quote" aria-hidden="true">“</span>
              <h3>{item.q}</h3>
              <div className="lp-usecase__label">{tr('الخبراء الذين قد ينضمون', 'Experts who may join')}</div>
              <div className="lp-pills">{item.experts.map((name) => <span key={name}><Icon name="user" size={15} />{name}</span>)}</div>
              <p className="lp-usecase__out"><Icon name="check" size={18} />{item.out}</p>
              <Link className="lp-btn lp-btn--primary" to={startCasePath}>{tr('ابدأ حالة مشابهة', 'Start a similar case')} <Icon name="arrow" size={16} /></Link>
            </div>
            <div className="lp-usecase__case" aria-hidden="true">
              <div className="lp-usecase__casehead"><Icon name="case" size={18} /><b>{tr('داخل الحالة', 'Inside the case')}</b></div>
              <ul>{item.facts.map((fact, index) => <li key={fact}><span>{index + 1}</span>{fact}</li>)}</ul>
              <div className="lp-usecase__delivery"><Icon name="video" size={16} />{tr('تُقدَّم الخدمة عن بُعد', 'Delivered remotely')}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default UseCasesSection;

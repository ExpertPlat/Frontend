import React, { useState } from 'react';
import Icon from '../../../../../components/Icon/Icon';
import { faqItems, faqItemsEn } from '../../data/landingData';
import { useLocale } from '../../../../../context/LocaleContext';

function FaqSection() {
  const { locale, tr } = useLocale();
  const [open, setOpen] = useState(0);
  const items = locale === 'ar' ? faqItems : faqItemsEn;
  return (
    <section className="lp-section lp-faq" id="faq">
      <div className="container lp-faq__grid">
        <div className="lp-head lp-faq__head" data-reveal>
          <span className="lp-kicker">{tr('الأسئلة الشائعة', 'FAQ')}</span>
          <h2>{tr('أسئلة قبل أن تبدأ؟', 'Questions before you start?')}</h2>
          <p>{tr('إجابات مختصرة عن أكثر ما يسأل عنه الناس: الخدمات عن بُعد، السعر، الخصوصية، ودور الذكاء الاصطناعي.', 'Short answers to what people ask most: remote services, pricing, privacy, and the role of AI.')}</p>
        </div>
        <div className="lp-faq__list" data-reveal style={{ '--delay': '90ms' }}>
          {items.map(([question, answer], index) => {
            const isOpen = open === index;
            return (
              <div className={`lp-faq__item${isOpen ? ' is-open' : ''}`} key={question}>
                <h3>
                  <button type="button" id={`faq-q-${index}`} aria-expanded={isOpen} aria-controls={`faq-a-${index}`} onClick={() => setOpen(isOpen ? -1 : index)}>
                    <span>{question}</span><i><Icon name="plus" size={18} /></i>
                  </button>
                </h3>
                <div className="lp-faq__answer" id={`faq-a-${index}`} role="region" aria-labelledby={`faq-q-${index}`}><div><p>{answer}</p></div></div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FaqSection;

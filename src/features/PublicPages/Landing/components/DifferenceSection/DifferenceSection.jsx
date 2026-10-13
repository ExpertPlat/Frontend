import React from 'react';
import Icon from '../../../../../components/Icon/Icon';
import { useLocale } from '../../../../../context/LocaleContext';

function DifferenceSection() {
  const { tr } = useLocale();
  return (
    <section className="lp-section lp-diff" id="about">
      <div className="container">
        <div className="lp-head lp-head--center" data-reveal>
          <span className="lp-kicker">{tr('الفرق الحقيقي', 'The difference')}</span>
          <h2>{tr('مشكلتك ليست مجموعة محادثات منفصلة.', 'Your problem is more than a set of separate chats.')}</h2>
          <p>{tr('بدل أن تجمع النصائح بنفسك، تبقى الأسئلة والمستندات ومساهمات المختصين داخل سياق واحد يوضح ما الذي بُني عليه كل رأي.', 'Questions, documents, and expert input stay together, so you can see what each recommendation is based on.')}</p>
        </div>

        <div className="lp-compare">
          <article className="lp-compare__card lp-compare__card--before" data-reveal>
            <span className="lp-compare__label">{tr('بدون سياق موحد', 'Without shared context')}</span>
            <div className="lp-scatter" aria-hidden="true">
              <div className="lp-scatter__item lp-scatter__item--1"><b>{tr('رأي قانوني', 'Legal opinion')}</b><small>{tr('في محادثة منفصلة', 'In a separate chat')}</small></div>
              <div className="lp-scatter__item lp-scatter__item--2"><b>PDF</b><small>{tr('نسخة مختلفة', 'Another version')}</small></div>
              <div className="lp-scatter__item lp-scatter__item--3"><b>{tr('ملاحظة مالية', 'Finance note')}</b><small>{tr('غير مرتبطة بشيء', 'Linked to nothing')}</small></div>
            </div>
            <h3>{tr('آراء كثيرة، وربطها عليك.', 'Many opinions. You connect the dots.')}</h3>
          </article>

          <article className="lp-compare__card lp-compare__card--after" data-reveal style={{ '--delay': '100ms' }}>
            <span className="lp-compare__label">{tr('مع الحالة', 'With your case')}</span>
            <div className="lp-unified" aria-hidden="true">
              <div className="lp-unified__core"><Icon name="case" size={20} /><b>{tr('الحالة', 'Case')}</b><small>{tr('سياق واحد', 'One context')}</small></div>
              <ul>
                <li><Icon name="check" size={15} />{tr('قانوني', 'Legal')}</li>
                <li><Icon name="check" size={15} />{tr('تقني', 'Tech')}</li>
                <li><Icon name="check" size={15} />{tr('مالي', 'Finance')}</li>
              </ul>
              <div className="lp-unified__out"><Icon name="spark" size={16} />{tr('قرار موحّد', 'Clear decision')}</div>
            </div>
            <h3>{tr('سياق واحد. قرار أوضح.', 'One context. A clearer decision.')}</h3>
          </article>
        </div>
      </div>
    </section>
  );
}

export default DifferenceSection;

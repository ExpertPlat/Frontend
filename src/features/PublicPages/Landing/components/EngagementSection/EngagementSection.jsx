import React from 'react';
import Icon from '../../../../../components/Icon/Icon';
import { engagementSteps, engagementStepsEn } from '../../data/landingData';
import { useLocale } from '../../../../../context/LocaleContext';

function EngagementSection() {
  const { locale, tr } = useLocale();
  const steps = locale === 'ar' ? engagementSteps : engagementStepsEn;
  return (
    <section className="lp-section lp-process" id="process">
      <div className="container">
        <div className="lp-head lp-head--center" data-reveal>
          <span className="lp-kicker">{tr('بعد المطابقة', 'After matching')}</span>
          <h2>{tr('خطوات واضحة من الدعوة حتى التقييم.', 'Clear steps from invitation to review.')}</h2>
          <p>{tr('لا مفاجآت: ترى العرض والسعر والمخرجات قبل أن تلتزم، ولا يبدأ العمل قبل تأكيد التمويل.', 'No surprises: you see the proposal, price, and deliverables before you commit, and work does not start before funding is confirmed.')}</p>
        </div>
        <div className="lp-process__grid">
          <ol className="lp-process__steps">
            {steps.map(([title, text, icon], index) => (
              <li data-reveal style={{ '--delay': `${index * 60}ms` }} key={title}>
                <span className="lp-process__node"><Icon name={icon} size={20} /></span>
                <div><h3>{title}</h3><p>{text}</p></div>
              </li>
            ))}
          </ol>
          <aside className="lp-proposal" data-reveal style={{ '--delay': '120ms' }} role="img" aria-label={tr('مثال على عرض خبير', 'Example expert proposal')}>
            <div className="lp-proposal__head"><span>{tr('عرض الخبير', 'Expert proposal')}</span><em>{tr('مثال توضيحي', 'Illustrative')}</em></div>
            <div className="lp-proposal__price"><small>{tr('السعر الذي يحدده الخبير', 'Price set by the expert')}</small><b>{tr('يظهر هنا بالتفصيل', 'Shown here in full')}</b></div>
            <ul>
              <li><Icon name="check" size={16} />{tr('مخرجات واضحة ومرحلية', 'Clear, milestone-based deliverables')}</li>
              <li><Icon name="clock" size={16} />{tr('مدة التنفيذ وصلاحية العرض', 'Timeline and offer validity')}</li>
              <li><Icon name="video" size={16} />{tr('طريقة التقديم: عن بُعد', 'Delivery method: remote')}</li>
            </ul>
            <div className="lp-proposal__actions"><span className="is-primary">{tr('قبول العرض', 'Accept')}</span><span>{tr('طلب تعديل', 'Request changes')}</span></div>
            <small className="lp-proposal__note"><Icon name="lock" size={14} />{tr('السعر يحدده الخبير فقط، وأي تعديل لاحق يكون بإصدار جديد.', 'Only the expert sets the price. Any later change comes as a new version.')}</small>
          </aside>
        </div>
      </div>
    </section>
  );
}

export default EngagementSection;

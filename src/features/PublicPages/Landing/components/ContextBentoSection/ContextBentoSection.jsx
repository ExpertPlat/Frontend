import React from 'react';
import Icon from '../../../../../components/Icon/Icon';
import { contextItems, contextItemsEn } from '../../data/landingData';
import { useLocale } from '../../../../../context/LocaleContext';

function ContextBentoSection() {
  const { locale, tr } = useLocale();
  return (
    <section className="lp-section lp-context" id="services">
      <div className="container">
        <div className="lp-head" data-reveal>
          <span className="lp-kicker">{tr('داخل كل حالة', 'Inside every case')}</span>
          <h2>{tr('كل ما تحتاجه، مترابط في مكان واحد.', 'Everything connected in one place.')}</h2>
          <p>{tr('الحالة تجمع الأسئلة والمستندات والخبراء والجلسات والمخرجات في مساحة واحدة، مع إبراز الإجراء التالي.', 'Your case brings questions, documents, experts, sessions, and outcomes together, with a clear next step.')}</p>
        </div>

        <div className="lp-bento">
          <article className="lp-bento__main" data-reveal>
            <div className="lp-window" role="img" aria-label={tr('مثال على خط زمني لحالة', 'Example case timeline')}>
              <div className="lp-window__bar"><i /><i /><i /></div>
              <div className="lp-window__top"><div><small>{tr('حالة نشطة', 'Active case')}</small><b>{tr('قرار شراء عقار', 'Property purchase')}</b></div><span className="lp-window__live"><i />{tr('محدّثة الآن', 'Updated now')}</span></div>
              <ol className="lp-timeline">
                <li className="is-done"><span><Icon name="check" size={15} /></span><div><b>{tr('تقرير المعاينة', 'Inspection report')}</b><small>{tr('تمت المراجعة بواسطة الخبير الهندسي', 'Reviewed by the engineer')}</small></div><em>{tr('مكتمل', 'Done')}</em></li>
                <li className="is-active"><span>2</span><div><b>{tr('مراجعة الالتزامات', 'Review obligations')}</b><small>{tr('مرتبطة بنتائج المعاينة والمستندات', 'Linked to inspection and documents')}</small></div><em>{tr('قيد العمل', 'In progress')}</em></li>
                <li><span>3</span><div><b>{tr('الخطوة التالية', 'Next step')}</b><small>{tr('تتحدد بعد اعتماد المراجعة الحالية', 'Set after the current review')}</small></div><em>{tr('لاحقًا', 'Later')}</em></li>
              </ol>
            </div>
          </article>
          {(locale === 'ar' ? contextItems : contextItemsEn).map(([title, text, icon], index) => (
            <article className="lp-bento__card" data-reveal style={{ '--delay': `${index * 45}ms` }} key={title}>
              <span><Icon name={icon} size={22} /></span><h3>{title}</h3><p>{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ContextBentoSection;

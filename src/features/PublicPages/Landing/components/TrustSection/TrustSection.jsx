import React from 'react';
import Icon from '../../../../../components/Icon/Icon';
import { useLocale } from '../../../../../context/LocaleContext';

function TrustSection() {
  const { tr } = useLocale();
  return (
    <section className="lp-section lp-trust" id="trust">
      <div className="container lp-trust__grid">
        <div className="lp-trust__copy" data-reveal>
          <span className="lp-kicker lp-kicker--light">{tr('الثقة والخصوصية', 'Trust and privacy')}</span>
          <h2>{tr('سياق مشترك، وليس وصولًا مفتوحًا.', 'Shared context, controlled access.')}</h2>
          <p>{tr('الانضمام إلى الحالة لا يعني فتح كل معلوماتك. المشاركة تكون محددة لكل خبير وفق المهمة والغرض والصلاحية.', 'Joining a case does not expose all your information. Each expert sees only what their task and permission allow.')}</p>
          <ul className="lp-trust__points">
            <li><span><Icon name="shield" size={20} /></span><div><b>{tr('مشاركة محددة', 'Controlled sharing')}</b><small>{tr('تعتمد ملخص حالتك قبل إرساله لأي خبير.', 'You approve your case brief before any expert receives it.')}</small></div></li>
            <li><span><Icon name="file" size={20} /></span><div><b>{tr('مصدر ونسخة واضحة', 'Clear source and version')}</b><small>{tr('كل مستند وملخص له نسخة يمكن الرجوع إليها.', 'Every document and brief has a version you can trace.')}</small></div></li>
            <li><span><Icon name="lock" size={20} /></span><div><b>{tr('صلاحيات قابلة للمراجعة', 'Reviewable permissions')}</b><small>{tr('تسحب الوصول إلى أي مستند في أي وقت.', 'Withdraw access to any document at any time.')}</small></div></li>
          </ul>
        </div>

        <div className="lp-perm" data-reveal style={{ '--delay': '100ms' }} role="img" aria-label={tr('مثال على مشاركة مستند بصلاحية محددة', 'Example of sharing a document with scoped permission')}>
          <div className="lp-perm__doc"><span><Icon name="file" size={26} /></span><div><b>{tr('تقرير المعاينة.pdf', 'inspection-report.pdf')}</b><small>{tr('مستند من الحالة', 'Case document')}</small></div></div>
          <div className="lp-perm__link"><i /><em>{tr('السماح بالمشاركة', 'Allow access')}</em><i /></div>
          <div className="lp-perm__control"><span><Icon name="lock" size={20} /></span><div><b>{tr('صلاحية محددة', 'Scoped permission')}</b><small>{tr('عرض فقط • لهذه المهمة', 'View only • for this task')}</small></div><strong>{tr('مفعّلة', 'Active')}</strong></div>
          <div className="lp-perm__link"><i /><em>{tr('يصل فقط للمصرّح له', 'Only authorized experts')}</em><i /></div>
          <div className="lp-perm__expert"><span>{tr('خ', 'E')}</span><div><b>{tr('الخبير المختص', 'Assigned expert')}</b><small>{tr('مهمة: مراجعة نقطة محددة', 'Task: review a specific point')}</small></div><Icon name="check" size={20} /></div>
        </div>
      </div>
    </section>
  );
}

export default TrustSection;

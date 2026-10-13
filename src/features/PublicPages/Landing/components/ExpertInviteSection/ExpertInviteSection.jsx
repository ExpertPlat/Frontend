import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../../../../components/Icon/Icon';
import useLandingDestinations from '../../../../../hooks/useLandingDestinations';
import { useLocale } from '../../../../../context/LocaleContext';
import { PATHS } from '../../../../../routes/paths';

function ExpertInviteSection() {
  const { tr } = useLocale();
  const { expertPath } = useLandingDestinations();
  return (
    <section className="lp-section lp-invite" id="join">
      <div className="container lp-invite__inner" data-reveal>
        <div className="lp-invite__copy">
          <span className="lp-kicker">{tr('للخبراء والمكاتب', 'For experts and firms')}</span>
          <h2>{tr('خبرتك أقوى عندما تستطيع الاستعانة بالخبرة المكملة.', 'Your expertise goes further with complementary specialists.')}</h2>
          <p>{tr('شارك في سؤال محدد، قدّم مراجعة مستقلة، أو استعن بمختص مكمل لحالة من مكتبك الحالي مع وضوح المهمة والصلاحية.', 'Answer a focused question, provide an independent review, or bring another specialist into a case with clear roles and permissions.')}</p>
          <ul className="lp-checks">
            <li><Icon name="check" size={16} />{tr('تحدد سعرك ومخرجاتك بنفسك', 'Set your own price and deliverables')}</li>
            <li><Icon name="check" size={16} />{tr('تقدّم خدماتك عن بُعد من أي مكان', 'Serve clients remotely from anywhere')}</li>
            <li><Icon name="check" size={16} />{tr('تحقق مهني قبل نشر ملفك', 'Professional verification before you go live')}</li>
          </ul>
          <div className="lp-invite__actions">
            <Link className="lp-btn lp-btn--primary lp-btn--lg" to={expertPath}>{tr('انضم كخبير', 'Join as expert')} <Icon name="arrow" size={17} /></Link>
            <Link className="lp-btn lp-btn--ghost lp-btn--lg" to={PATHS.EXPERT_LOGIN}>{tr('لدي حساب خبير', 'I have an expert account')}</Link>
          </div>
        </div>
        <div className="lp-invite__visual" aria-hidden="true">
          <div className="lp-hub"><span>{tr('خبرتك', 'Your work')}</span></div>
          <span className="lp-node lp-node--1"><Icon name="search" size={16} />{tr('مراجعة مستقلة', 'Independent review')}</span>
          <span className="lp-node lp-node--2"><Icon name="spark" size={16} />{tr('مساهمة محددة', 'Focused input')}</span>
          <span className="lp-node lp-node--3"><Icon name="nodes" size={16} />{tr('تنسيق حالة', 'Coordinate case')}</span>
        </div>
      </div>
    </section>
  );
}

export default ExpertInviteSection;

import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../../../../components/Icon/Icon';
import useLandingDestinations from '../../../../../hooks/useLandingDestinations';
import BackgroundNetwork from '../BackgroundNetwork/BackgroundNetwork';
import heroTeamImage from '../../../../../assets/images/hero-team-hd.jpg';
import { useLocale } from '../../../../../context/LocaleContext';

function HeroSection() {
  const { tr } = useLocale();
  const { startCasePath } = useLandingDestinations();
  return (
    <section className="lp-hero" id="top">
      <div className="lp-hero__bg" aria-hidden="true"><span className="lp-hero__glow lp-hero__glow--a" /><span className="lp-hero__glow lp-hero__glow--b" /><span className="lp-hero__dots" /></div>

      <div className="container lp-hero__grid">
        <div className="lp-hero__copy" data-reveal>
          <span className="lp-pill"><span className="lp-pill__dot" />{tr('كل الخدمات عن بُعد • خبراء وسياق موحّد', 'All services remote • Experts and one shared context')}</span>
          <h1 className="lp-hero__title">
            <span>{tr('من تعقيد الحالة', 'From a complex problem')}</span>
            <span>{tr('إلى', 'to')} <em>{tr('وضوح القرار', 'a clearer decision')}</em></span>
          </h1>
          <p className="lp-hero__lead">{tr('اشرح حالتك مرة واحدة، ودع المنصة تنظّم التفاصيل وتوصلك بالخبرات المناسبة ضمن سياق واحد واضح، بجلسة فيديو أو صوت أو استشارة مكتوبة.', 'Describe your situation once. SolveIt organizes the details and connects you with the right expertise in one clear space, through video, audio, or a written consultation.')}</p>
          <div className="lp-hero__actions">
            <Link className="lp-btn lp-btn--primary lp-btn--lg" to={startCasePath}>{tr('ابدأ حالتك', 'Start your case')} <Icon name="arrow" size={18} /></Link>
            <a className="lp-btn lp-btn--outline lp-btn--lg" href="#how"><Icon name="play" size={19} /> {tr('شاهد كيف تعمل', 'See how it works')}</a>
          </div>
          <ul className="lp-hero__proof">
            <li><Icon name="shield" size={18} />{tr('وصول بصلاحيات واضحة', 'Clear access permissions')}</li>
            <li><Icon name="file" size={18} />{tr('السعر يحدده الخبير بعرض مكتوب', 'Expert-set, written pricing')}</li>
            <li><Icon name="nodes" size={18} />{tr('خبير واحد أو أكثر حسب الحاجة', 'One or more experts as needed')}</li>
          </ul>
        </div>

        <div className="lp-hero__visual" data-reveal style={{ '--delay': '140ms' }}>
          <BackgroundNetwork />
          <div className="lp-hero__frame">
            <img src={heroTeamImage} alt={tr('فريق من المختصين يناقش حالة مشتركة', 'A team of specialists discussing a shared case')} />
            <span className="lp-hero__shade" />
          </div>

          <div className="lp-float lp-float--remote"><Icon name="video" size={18} />{tr('جلسة فيديو عن بُعد', 'Remote video session')}</div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;

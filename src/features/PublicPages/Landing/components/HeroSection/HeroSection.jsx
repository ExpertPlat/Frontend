import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../../../../components/Icon/Icon';
import useLandingDestinations from '../../../../../hooks/useLandingDestinations';
import TrustBar from '../TrustBar/TrustBar';
import heroTeamImage from '../../../../../assets/images/hero-final.webp';
import { useLocale } from '../../../../../context/LocaleContext';

/**
 * Hero "Midnight Stage": one deep-teal panel that is identical in light and dark mode.
 * Copy on one side, the photo with three glass cards on the other, and the trust strip along the bottom edge.
 */
function HeroSection() {
  const { tr } = useLocale();
  const { startCasePath } = useLandingDestinations();
  return (
    <section className="lp-hero" id="top">
      <div className="lp-stage">
        <span className="lp-stage__grain" aria-hidden="true" />
        <span className="lp-stage__arc" aria-hidden="true" />
        <span className="lp-stage__arc lp-stage__arc--b" aria-hidden="true" />
        <svg className="lp-stage__net" viewBox="0 0 1376 790" preserveAspectRatio="none" aria-hidden="true">
          <g>
            <line x1="800" y1="90" x2="980" y2="170" /><line x1="980" y1="170" x2="1190" y2="110" />
            <line x1="980" y1="170" x2="1100" y2="330" /><line x1="1190" y1="110" x2="1300" y2="250" />
            <circle cx="800" cy="90" r="3.5" /><circle cx="980" cy="170" r="4.5" /><circle cx="1190" cy="110" r="3.5" />
            <circle cx="1100" cy="330" r="3.5" /><circle cx="1300" cy="250" r="4" />
          </g>
        </svg>

        <div className="lp-stage__grid">
          <div className="lp-hero__copy" data-reveal>
            <span className="lp-pill"><span className="lp-pill__dot" />{tr('خبرة موثوقة · حلول تصنع وضوحًا', 'EXPERT GUIDANCE · MEANINGFUL SOLUTIONS')}</span>
            <h1 className="lp-hero__title">
              <span>{tr('حيث تلتقي الخبرة', 'Where Expertise')}</span>
              <span>{tr('', 'Meets ')}<em>{tr('بوضوح الرؤية.', 'Clarity.')}</em></span>
            </h1>
            <p className="lp-hero__lead">{tr('تواصل مع خبراء موثوقين، وتجاوز القرارات المعقدة بثقة، ضمن تجربة سلسة في مكان واحد.', 'Connect with trusted experts, navigate complex decisions, and move forward with confidence — all in one seamless experience.')}</p>
            <div className="lp-hero__actions">
              <Link className="lp-btn lp-btn--primary lp-btn--lg" to={startCasePath}>{tr('ابحث عن خبير', 'Find an Expert')} <Icon name="arrow" size={18} /></Link>
              <a className="lp-btn lp-btn--stage lp-btn--lg" href="#how">{tr('استكشف الخدمات', 'Explore Services')}</a>
            </div>
          </div>

          <div className="lp-hero__visual" data-reveal style={{ '--delay': '140ms' }}>
            <div className="lp-hero__frame">
              <img src={heroTeamImage} alt={tr('فريق من المختصين يناقش حالة مشتركة', 'A team of specialists discussing a shared case')} />
              <span className="lp-hero__shade" />
            </div>

            <div className="lp-gl lp-gl--offer">
              <div className="lp-gl__head">{tr('عرض مكتوب من الخبير', 'WRITTEN OFFER FROM THE EXPERT')}</div>
              <div className="lp-gl__row">
                <span className="lp-gl__avatar">{tr('ق', 'L')}</span>
                <div><b>{tr('خبير قانوني', 'Legal expert')}</b><small><Icon name="shield" size={14} />{tr('موثّق', 'Verified')}</small></div>
              </div>
              <div className="lp-gl__price"><small>{tr('السعر · مثال توضيحي', 'PRICE · EXAMPLE')}</small><b>{tr('450 د.إ', 'AED 450')}</b></div>
            </div>
          </div>
        </div>

        <TrustBar />
      </div>
    </section>
  );
}

export default HeroSection;

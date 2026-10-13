import React from 'react';
import Navbar from '../../../components/Navbar/Navbar';
import Footer from '../../../components/Footer/Footer';
import HeroSection from './components/HeroSection/HeroSection';
import TrustBar from './components/TrustBar/TrustBar';
import HowItWorksSection from './components/HowItWorksSection/HowItWorksSection';
import DifferenceSection from './components/DifferenceSection/DifferenceSection';
import ContextBentoSection from './components/ContextBentoSection/ContextBentoSection';
import UseCasesSection from './components/UseCasesSection/UseCasesSection';
import TrustSection from './components/TrustSection/TrustSection';
import ExpertsSection from './components/ExpertsSection/ExpertsSection';
import EngagementSection from './components/EngagementSection/EngagementSection';
import FaqSection from './components/FaqSection/FaqSection';
import ExpertInviteSection from './components/ExpertInviteSection/ExpertInviteSection';
import FinalCTASection from './components/FinalCTASection/FinalCTASection';
import useReveal from '../../../hooks/useReveal';
import usePageScroll from '../../../hooks/usePageScroll';
import './Landing.css';
import { useLocale } from '../../../context/LocaleContext';

export default function Landing() {
  const { dir, locale } = useLocale();
  useReveal();
  usePageScroll();

  return (
    <div className={`landing-page landing-page--${locale}`} dir={dir}>
      <Navbar />
      <main>
        <HeroSection />
        <TrustBar />
        <HowItWorksSection />
        <DifferenceSection />
        <ContextBentoSection />
        <UseCasesSection />
        <TrustSection />
        <ExpertsSection />
        <EngagementSection />
        <FaqSection />
        <ExpertInviteSection />
        <FinalCTASection />
      </main>
      <Footer />
    </div>
  );
}

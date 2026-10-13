import React from 'react';
import { useLocation } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import useReveal from './hooks/useReveal';
import usePageScroll from './hooks/usePageScroll';
import { BrandFeedbackProvider } from './components/BrandFeedback/BrandFeedback';
import DemoSwitcher from './features/demo/DemoSwitcher';
import './styles/dashboardBrand.css';

function useRouteScroll() {
  const { pathname, hash } = useLocation();

  React.useEffect(() => {
    if (hash) {
      let id = hash.slice(1);

      try {
        id = decodeURIComponent(id);
      } catch {
        // Keep the raw hash when it contains malformed escape sequences.
      }

      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [hash, pathname]);
}

export default function App() {
  const { pathname } = useLocation();

  useReveal(pathname);
  usePageScroll();
  useRouteScroll();
  return <BrandFeedbackProvider><AppRoutes /><DemoSwitcher /></BrandFeedbackProvider>;
}

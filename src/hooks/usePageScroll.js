import { useEffect } from 'react';

export default function usePageScroll() {
  useEffect(() => {
    let ticking = false;
    const update = () => {
      document.documentElement.style.setProperty('--page-scroll', `${window.scrollY}px`);
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
}

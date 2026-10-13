import { useEffect } from 'react';

export default function useReveal(dependency) {
  useEffect(() => {
    const nodes = [...document.querySelectorAll('[data-reveal]')];
    if (!('IntersectionObserver' in window)) {
      nodes.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }),
      { threshold: 0.14, rootMargin: '0px 0px -6% 0px' },
    );
    nodes.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [dependency]);
}

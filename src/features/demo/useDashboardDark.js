import { useEffect, useState } from 'react';

/** True while a dashboard shell (.ud, .ex…) is in dark theme. Trial UI lives outside those shells, so it follows them here. */
export default function useDashboardDark() {
  const read = () => typeof document !== 'undefined' && !!document.querySelector('[data-theme="dark"]');
  const [dark, setDark] = useState(read);
  useEffect(() => {
    const update = () => setDark(read());
    const mo = new MutationObserver(update);
    mo.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['data-theme'], childList: true });
    update();
    return () => mo.disconnect();
  }, []);
  return dark;
}

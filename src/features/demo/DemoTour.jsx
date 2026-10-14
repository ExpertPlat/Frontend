import React, { useCallback, useEffect, useState } from 'react';
import SpotlightTour from './SpotlightTour';
import { DEMO_MODE } from './demoConfig';
import { claimTour, markTourSeen, registerTour, releaseTour, tourSeen } from './tourRegistry';

/**
 * A walkthrough that starts by itself the first time (`auto`), once its first target is on screen, and can be
 * replayed from the "Switch account" menu. Renders nothing outside demo mode.
 */
export default function DemoTour({ id, steps, auto = true, priority = 1, delay = 500, eyebrow, onClose }) {
  const [open, setOpen] = useState(false);
  const start = useCallback(() => { if (claimTour(id)) setOpen(true); }, [id]);

  useEffect(() => (DEMO_MODE ? registerTour(id, priority, start) : undefined), [id, priority, start]);

  useEffect(() => {
    if (!DEMO_MODE || !auto || tourSeen(id)) return undefined;
    let tries = 0;
    let timer = window.setTimeout(function wait() {
      const first = steps[0]?.target;
      if (!first || document.querySelector(first)) start();
      else if (tries++ < 20) timer = window.setTimeout(wait, 250);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [id, auto, delay, steps, start]);

  const close = useCallback(() => { markTourSeen(id); releaseTour(id); setOpen(false); onClose?.(); }, [id, onClose]);
  useEffect(() => () => releaseTour(id), [id]);

  if (!DEMO_MODE) return null;
  return <SpotlightTour open={open} steps={steps} onClose={close} eyebrow={eyebrow} />;
}

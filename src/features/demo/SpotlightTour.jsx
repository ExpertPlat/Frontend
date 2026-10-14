import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocale } from '../../context/LocaleContext';
import DemoIcon from './icons';
import useDashboardDark from './useDashboardDark';
import './tour.css';

const PAD = 8;        // space between the element and the spotlight edge
const RADIUS = 14;    // spotlight corner radius
const GAP = 16;       // space between the spotlight and the card
const MARGIN = 16;    // minimum distance from the viewport edges
const MOBILE = 640;

const reduceMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, min, max) => Math.min(Math.max(v, min), Math.max(min, max));
const fmt = (n, locale) => new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US').format(n);

function holePath(w, h, r) {
  if (!r) return `M0 0H${w}V${h}H0Z`;
  const { x, y, width: cw, height: ch } = r;
  const k = Math.min(RADIUS, cw / 2, ch / 2);
  return `M0 0H${w}V${h}H0Z M${x + k} ${y}H${x + cw - k}A${k} ${k} 0 0 1 ${x + cw} ${y + k}V${y + ch - k}A${k} ${k} 0 0 1 ${x + cw - k} ${y + ch}H${x + k}A${k} ${k} 0 0 1 ${x} ${y + ch - k}V${y + k}A${k} ${k} 0 0 1 ${x + k} ${y}Z`;
}

function place(hole, card, vp, preferred) {
  if (vp.w < MOBILE) {
    const dockTop = hole && hole.y + hole.height / 2 > vp.h * 0.55;
    return { mode: 'sheet', side: dockTop ? 'top' : 'bottom' };
  }
  if (!hole) return { mode: 'center', left: (vp.w - card.w) / 2, top: (vp.h - card.h) / 2 };
  const cx = hole.x + hole.width / 2;
  const cy = hole.y + hole.height / 2;
  const fits = {
    bottom: hole.y + hole.height + GAP + card.h <= vp.h - MARGIN,
    top: hole.y - GAP - card.h >= MARGIN,
    right: hole.x + hole.width + GAP + card.w <= vp.w - MARGIN,
    left: hole.x - GAP - card.w >= MARGIN,
  };
  const order = [preferred, 'bottom', 'top', 'right', 'left'].filter(Boolean);
  const side = order.find((s) => fits[s]);
  if (!side) return { mode: 'center', left: (vp.w - card.w) / 2, top: clamp(vp.h - card.h - MARGIN, MARGIN, vp.h) };
  if (side === 'bottom' || side === 'top') {
    const left = clamp(cx - card.w / 2, MARGIN, vp.w - card.w - MARGIN);
    const top = side === 'bottom' ? hole.y + hole.height + GAP : hole.y - GAP - card.h;
    return { mode: 'anchored', side, left, top, arrow: clamp(cx - left, 24, card.w - 24) };
  }
  const top = clamp(cy - card.h / 2, MARGIN, vp.h - card.h - MARGIN);
  const left = side === 'right' ? hole.x + hole.width + GAP : hole.x - GAP - card.w;
  return { mode: 'anchored', side, left, top, arrow: clamp(cy - top, 24, card.h - 24) };
}

/**
 * Coach-mark walkthrough: the whole screen is blurred and dimmed except the element being explained, which stays
 * sharp and clickable. Steps: [{ target: CSS selector, title: {ar,en}, body: {ar,en}, extra?: node, placement?,
 * onEnter?() }]. Keyboard: Esc closes, arrows move, Enter continues.
 */
export default function SpotlightTour({ open, steps, onClose, eyebrow }) {
  const { tr, locale, dir } = useLocale();
  const dark = useDashboardDark();
  const [index, setIndex] = useState(0);
  const [hole, setHole] = useState(null);
  const [vp, setVp] = useState(() => ({ w: typeof window === 'undefined' ? 1280 : window.innerWidth, h: typeof window === 'undefined' ? 800 : window.innerHeight }));
  const [card, setCard] = useState({ w: 380, h: 220 });
  const cardRef = useRef(null);
  const primaryRef = useRef(null);
  const step = steps[index];
  const last = index === steps.length - 1;

  useEffect(() => { if (open) setIndex(0); }, [open]);

  // Bring the target into view once per step, then follow it every frame (scrolling, menus opening, resizing).
  useEffect(() => {
    if (!open || !step) return undefined;
    step.onEnter?.();
    let raf = 0;
    let scrolled = false;
    const tick = () => {
      const el = step.target ? document.querySelector(step.target) : null;
      if (el && !scrolled) {
        scrolled = true;
        const r0 = el.getBoundingClientRect();
        if (r0.top < 80 || r0.bottom > window.innerHeight - 80) el.scrollIntoView({ block: 'center', behavior: reduceMotion() ? 'auto' : 'smooth' });
      }
      const r = el?.getBoundingClientRect();
      const next = r && r.width > 0 ? { x: Math.round(r.left - PAD), y: Math.round(r.top - PAD), width: Math.round(r.width + PAD * 2), height: Math.round(r.height + PAD * 2) } : null;
      setHole((prev) => (prev && next && prev.x === next.x && prev.y === next.y && prev.width === next.width && prev.height === next.height) || (!prev && !next) ? prev : next);
      setVp((prev) => (prev.w === window.innerWidth && prev.h === window.innerHeight ? prev : { w: window.innerWidth, h: window.innerHeight }));
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [open, step]);

  useLayoutEffect(() => {
    if (!open || !cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    if (Math.abs(r.width - card.w) > 1 || Math.abs(r.height - card.h) > 1) setCard({ w: r.width, h: r.height });
  });

  useEffect(() => { if (open) primaryRef.current?.focus({ preventScroll: true }); }, [open, index]);

  const go = useCallback((delta) => {
    setIndex((i) => {
      const n = i + delta;
      if (n < 0) return 0;
      if (n >= steps.length) { onClose?.('done'); return i; }
      return n;
    });
  }, [steps.length, onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose?.('skip'); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(dir === 'rtl' ? 1 : -1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); go(dir === 'rtl' ? -1 : 1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, go, dir, onClose]);

  if (!open || !step || typeof document === 'undefined') return null;
  const pos = place(hole, card, vp, step.placement);
  const cardStyle = pos.mode === 'sheet' ? undefined : { left: pos.left, top: pos.top, '--arrow': `${pos.arrow ?? 0}px` };
  const clip = `path(evenodd, '${holePath(vp.w, vp.h, hole)}')`;

  return createPortal(
    <div className={`st${dark ? ' is-dark' : ''}`} dir={dir} lang={locale}>
      <div className="st-veil" style={{ clipPath: clip, WebkitClipPath: clip }} aria-hidden="true" />
      {hole && <div className="st-ring" style={{ left: hole.x, top: hole.y, width: hole.width, height: hole.height }} aria-hidden="true" />}
      <section
        ref={cardRef}
        key={index}
        className={`st-card is-${pos.mode}${pos.side ? ` from-${pos.side}` : ''}`}
        style={cardStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="st-title"
        aria-describedby="st-body"
      >
        {pos.mode === 'anchored' && <i className="st-arrow" aria-hidden="true" />}
        <header className="st-card__top">
          <span className="st-eyebrow">{eyebrow ? eyebrow[locale] : tr('جولة تعريفية', 'Quick tour')}<em>{tr('نسخة تجريبية', 'Trial version')}</em></span>
          <button type="button" className="st-x" onClick={() => onClose?.('skip')} aria-label={tr('إغلاق الجولة', 'Close the tour')}><DemoIcon name="close" size={16} /></button>
        </header>
        <h2 id="st-title">{step.title[locale]}</h2>
        <div id="st-body" className="st-body">
          {(Array.isArray(step.body[locale]) ? step.body[locale] : [step.body[locale]]).map((p, i) => <p key={i}>{p}</p>)}
        </div>
        {step.extra}
        <footer className="st-card__foot">
          <span className="st-progress" aria-label={tr(`الخطوة ${fmt(index + 1, locale)} من ${fmt(steps.length, locale)}`, `Step ${index + 1} of ${steps.length}`)}>
            {steps.map((_, i) => <i key={i} className={i === index ? 'is-on' : i < index ? 'is-done' : ''} />)}
            <small>{tr(`${fmt(index + 1, locale)} من ${fmt(steps.length, locale)}`, `${index + 1} of ${steps.length}`)}</small>
          </span>
          <span className="st-actions">
            {index > 0
              ? <button type="button" className="st-btn is-ghost" onClick={() => go(-1)}>{tr('السابق', 'Back')}</button>
              : <button type="button" className="st-btn is-ghost" onClick={() => onClose?.('skip')}>{tr('تخطّي', 'Skip')}</button>}
            <button ref={primaryRef} type="button" className="st-btn" onClick={() => go(1)}>
              {last ? (step.finish ? step.finish[locale] : tr('فهمت', 'Got it')) : tr('التالي', 'Next')}
              {!last && <DemoIcon name="arrowNext" size={16} className="st-btn__arrow" />}
            </button>
          </span>
        </footer>
      </section>
    </div>,
    document.body,
  );
}

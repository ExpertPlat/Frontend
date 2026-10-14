import React from 'react';

/** Line icons for the trial UI (same 24px / 1.8 stroke grid as the auth kit). */
const P = {
  key: <><circle cx="8" cy="15" r="4"/><path d="m10.8 12.2 8.7-8.7M16 6l2.5 2.5M13.5 8.5 16 11"/></>,
  chevron: <path d="m6 9 6 6 6-6"/>,
  swap: <><path d="M16 3l4 4-4 4"/><path d="M20 7H8"/><path d="M8 21l-4-4 4-4"/><path d="M4 17h12"/></>,
  check: <path d="m5 12 4 4 10-10"/>,
  close: <path d="M6 6l12 12M18 6 6 18"/>,
  user: <><circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-4 3.1-6 7-6s6.2 2 7 6"/></>,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12.5h18"/></>,
  shield: <><path d="M12 3 5 6v5c0 4.5 2.7 8.1 7 10 4.3-1.9 7-5.5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></>,
  replay: <><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></>,
  arrowNext: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
};

export default function DemoIcon({ name, size = 18, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      {P[name] || P.check}
    </svg>
  );
}

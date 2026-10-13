import React from 'react';
import { useLocale } from '../../context/LocaleContext';
import { DEMO_MODE } from './demoConfig';
import './demo.css';

/** "Trial" tag for demo experts. Shown to everyone while the trial is on; hidden when the build is not in demo mode. */
export default function DemoBadge({ show = true, compact = false }) {
  const { tr } = useLocale();
  if (!DEMO_MODE || !show) return null;
  return (
    <span className={`demo-badge${compact ? ' is-compact' : ''}`} title={tr('خبير تجريبي لمرحلة التجربة فقط', 'Demo expert for the trial phase only')}>
      <i aria-hidden="true" />{tr('تجريبي', 'Demo')}
    </span>
  );
}

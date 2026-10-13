import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserI18n } from '../i18n/UserI18nContext';
import UdIcon from '../components/UdIcon';
import { STAGES, stagePath } from './journeyData';

/** The five-stage bar shown on top of every journey screen. Stages already reached can be revisited. */
export default function JourneyBar({ step, reached, caseId }) {
  const { tx, tr } = useUserI18n();
  const navigate = useNavigate();
  return (
    <nav className="jr-journey" aria-label={tr('مراحل الرحلة', 'Journey')}>
      <ol>
        {STAGES.map((item, index) => {
          const state = index < step ? 'done' : index === step ? 'current' : 'todo';
          const clickable = caseId != null && index <= reached && index !== step && index > 0;
          return (
            <li key={item.id} className={`is-${state}`} aria-current={state === 'current' ? 'step' : undefined}>
              <button type="button" disabled={!clickable} onClick={() => navigate(stagePath(caseId, item.id))}>
                <span className="jr-journey__node">{state === 'done' ? <UdIcon name="check" size={14} stroke={3} /> : <b>{index + 1}</b>}</span>
                <span className="jr-journey__label">{tx(item.label)}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

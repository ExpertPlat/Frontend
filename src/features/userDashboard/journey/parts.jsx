import React from 'react';
import UdIcon from '../components/UdIcon';
import { Avatar } from '../components/ui';
import { useUserI18n } from '../i18n/UserI18nContext';

export const Stars = ({ value, size = 15 }) => (
  <span className="jr-stars" role="img" aria-label={`${value}/5`}>
    {[1, 2, 3, 4, 5].map((n) => <UdIcon key={n} name="star" size={size} className={n <= Math.round(value) ? 'is-on' : ''} />)}
  </span>
);

export function ExpertLine({ expert, size = 52 }) {
  return <div className="jr-who"><Avatar src={expert.avatarUrl} name={expert.name} size={size} /><span><b>{expert.name}</b><small>{expert.title}</small></span></div>;
}

export function IconLine({ icon }) { return <span className="jr-iconline"><UdIcon name={icon} size={19} /></span>; }

/** Page-level error with a retry button, used when a stage cannot load its data. */
export function LoadError({ message, onRetry }) {
  const { tr } = useUserI18n();
  return (
    <div className="jr-banner is-danger" role="alert">
      <UdIcon name="alert" size={20} /><span>{message}</span>
      {onRetry && <button type="button" className="ud-linkbtn" onClick={onRetry}>{tr('إعادة المحاولة', 'Try again')}</button>}
    </div>
  );
}

/** Formats an {amountMinor, currency, minorUnitExponent} money object. */
export function useMoney() {
  const { fmtMoney } = useUserI18n();
  return (money) => (money ? fmtMoney(money.amountMinor, money.currency) : '—');
}

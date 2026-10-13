import React from 'react';
import { useUserI18n } from '../i18n/UserI18nContext';
import UdIcon from './UdIcon';

/**
 * "Show more" block shared by every sidebar. The panel opens with a height + stagger animation and the button stays
 * at the bottom of the list. Closed items are `inert` so keyboard focus never lands on hidden links.
 * Children get `--i` (their order) for the stagger delay: pass items through `React.Children`.
 */
export default function NavMore({ open, onToggle, collapsed = false, children, id = 'ud-nav-more' }) {
  const { tr } = useUserI18n();
  const label = open ? tr('عرض أقل', 'Show less') : tr('عرض المزيد', 'Show more');
  return (
    <div className={`ud-more${open ? ' is-open' : ''}`}>
      <div className="ud-more__panel" id={id} inert={open ? undefined : true}>
        <div className="ud-more__clip">
          <div className="ud-more__list">
            {React.Children.toArray(children).map((child, index) => <div key={child.key ?? index} className="ud-more__row" style={{ '--i': index }}>{child}</div>)}
          </div>
        </div>
      </div>
      <button type="button" className="ud-more__btn" aria-expanded={open} aria-controls={id} onClick={onToggle} title={collapsed ? label : undefined}>
        <span className="ud-nav__icon"><UdIcon name="chevronDown" size={19} className="ud-more__chev" /></span>
        <span className="ud-nav__label">{label}</span>
      </button>
    </div>
  );
}

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useUserI18n } from '../i18n/UserI18nContext';
import UdIcon from './UdIcon';

export const cx = (...parts) => parts.filter(Boolean).join(' ');

/* ───────────── Page scaffolding ───────────── */

/** Breadcrumb trail. `variant="back"` renders the single "‹ Back to …" link used on form pages. */
export function Breadcrumbs({ items, variant = 'trail', separator = 'chevron', lead = false }) {
  const { tr } = useUserI18n();
  if (variant === 'back') {
    const [item] = items;
    return (
      <nav className="ud-crumbs ud-crumbs--back" aria-label={tr('مسار التنقل', 'Breadcrumb')}>
        <Link to={item.to}><UdIcon name="chevronLeft" size={16} className="ud-dir" />{item.label}</Link>
      </nav>
    );
  }
  return (
    <nav className={cx('ud-crumbs', lead && 'has-lead')} aria-label={tr('مسار التنقل', 'Breadcrumb')}>
      {lead && <UdIcon name="chevronLeft" size={15} className="ud-dir ud-crumbs__lead" />}
      <ol>
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} aria-current={last ? 'page' : undefined}>
              {item.to && !last ? <Link to={item.to}>{item.label}</Link> : <span>{item.label}</span>}
              {!last && <i className="ud-crumbs__sep" aria-hidden="true">{separator === 'slash' ? '/' : <UdIcon name="chevronLeft" size={14} className="ud-dir" />}</i>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function PageHeader({ icon, title, subtitle, actions, titleAligned = false, className = '', headingId }) {
  return (
    <header className={cx('ud-pagehead', titleAligned && 'is-title-aligned', className)}>
      <h1 className="ud-pagehead__title" id={headingId}>
        {icon && <UdIcon name={icon} size={30} className="ud-pagehead__icon" stroke={1.6} />}
        <span>{title}</span>
      </h1>
      {subtitle && <p className="ud-pagehead__sub">{subtitle}</p>}
      {actions && <div className="ud-pagehead__actions">{actions}</div>}
    </header>
  );
}

export function Card({ as: Tag = 'section', className = '', children, ...rest }) {
  return <Tag className={cx('ud-card', className)} {...rest}>{children}</Tag>;
}

export function CardHeader({ icon, title, aside, id }) {
  return (
    <header className="ud-card__head">
      <h2 id={id}>{icon && <UdIcon name={icon} size={20} />}<span>{title}</span></h2>
      {aside}
    </header>
  );
}

/* ───────────── Controls ───────────── */

export function Button({ variant = 'primary', icon, iconEnd, iconDir = false, as, to, children, className = '', size, loading = false, ...rest }) {
  const classes = cx('ud-btn', `ud-btn--${variant}`, size && `ud-btn--${size}`, loading && 'is-loading', className);
  const content = (
    <>
      {icon && <UdIcon name={icon} size={size === 'sm' ? 16 : 19} className={iconDir ? 'ud-dir' : ''} />}
      <span>{children}</span>
      {iconEnd && <UdIcon name={iconEnd} size={size === 'sm' ? 16 : 19} className={iconDir ? 'ud-dir' : ''} />}
    </>
  );
  if (to) return <Link to={to} className={classes} {...rest}>{content}</Link>;
  const Tag = as || 'button';
  return <Tag className={classes} type={Tag === 'button' ? (rest.type || 'button') : undefined} aria-busy={loading || undefined} disabled={loading || rest.disabled} {...rest}>{content}</Tag>;
}

export function IconButton({ icon, label, className = '', size = 18, ...rest }) {
  return <button type="button" className={cx('ud-iconbtn ud-iconbtn--plain', className)} aria-label={label} title={label} {...rest}><UdIcon name={icon} size={size} /></button>;
}

/** Tone-coloured status pill. Never relies on colour alone: the label is always present. */
export function StatusPill({ tone = 'neutral', children, dot = true, className = '' }) {
  return <span className={cx('ud-pill-status', `is-${tone}`, className)}>{dot && <i aria-hidden="true" />}{children}</span>;
}

export function Chip({ icon, tone = 'neutral', children, className = '' }) {
  return <span className={cx('ud-chip', `is-${tone}`, className)}>{icon && <UdIcon name={icon} size={15} />}{children}</span>;
}

export function IconTile({ icon, tone = 'olive', size = 48, iconSize = 22, className = '' }) {
  return <span className={cx('ud-tile', `is-${tone}`, className)} style={{ '--tile': `${size}px` }}><UdIcon name={icon} size={iconSize} /></span>;
}

export function Avatar({ src, name, size = 48, className = '' }) {
  return <span className={cx('ud-avatar', className)} style={{ '--avatar': `${size}px` }}>{src ? <img src={src} alt={name || ''} /> : <UdIcon name="user" size={Math.round(size * 0.5)} />}</span>;
}

/* ───────────── Form fields ───────────── */

export function Field({ label, required, optional, hint, error, counter, htmlFor, children, className = '' }) {
  const { tr } = useUserI18n();
  return (
    <div className={cx('ud-field', error && 'has-error', className)}>
      {label && (
        <label className="ud-field__label" htmlFor={htmlFor}>
          <span>{label}</span>
          {required && <em className="ud-field__req" aria-hidden="true">*</em>}
          {optional && <small>({tr('اختياري', 'optional')})</small>}
        </label>
      )}
      {children}
      {(hint || error) && <p className={cx('ud-field__note', error && 'is-error')} role={error ? 'alert' : undefined}>{error || hint}</p>}
      {counter}
    </div>
  );
}

export function TextInput({ id, value, onChange, placeholder, maxLength, counter = false, invalid, className = '', ...rest }) {
  return (
    <div className={cx('ud-input', counter && 'ud-input--counter', invalid && 'is-invalid', className)}>
      <input id={id} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} maxLength={maxLength} aria-invalid={invalid || undefined} {...rest} />
      {counter && <span className="ud-input__count" dir="ltr">{value.length}/{maxLength}</span>}
    </div>
  );
}

export function TextArea({ id, value, onChange, placeholder, maxLength, rows = 4, invalid, className = '' }) {
  return (
    <div className={cx('ud-input ud-input--area', invalid && 'is-invalid', className)}>
      <textarea id={id} value={value} rows={rows} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} maxLength={maxLength} aria-invalid={invalid || undefined} />
      {maxLength && <span className="ud-input__count" dir="ltr">{value.length}/{maxLength}</span>}
    </div>
  );
}

export function Select({ id, value, onChange, options, placeholder, invalid, className = '' }) {
  return (
    <div className={cx('ud-select', invalid && 'is-invalid', !value && 'is-empty', className)}>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={invalid || undefined}>
        <option value="" disabled hidden>{placeholder}</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <UdIcon name="chevronDown" size={17} />
    </div>
  );
}

export function Checkbox({ checked, onChange, label, disabled, id, className = '' }) {
  const generated = useId();
  const inputId = id || generated;
  return (
    <label className={cx('ud-check', className)} htmlFor={inputId}>
      <input id={inputId} type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
      <span className="ud-check__box" aria-hidden="true"><UdIcon name="check" size={14} stroke={3} /></span>
      {label && <span className="ud-check__label">{label}</span>}
    </label>
  );
}

export function Switch({ checked, onChange, label, description, disabled, id }) {
  const generated = useId();
  const inputId = id || generated;
  return (
    <label className={cx('ud-switch', disabled && 'is-disabled')} htmlFor={inputId}>
      <span className="ud-switch__copy"><b>{label}</b>{description && <small>{description}</small>}</span>
      <input id={inputId} type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
      <span className="ud-switch__track" aria-hidden="true"><i /></span>
    </label>
  );
}

export function Segmented({ value, onChange, options, label }) {
  return (
    <div className="ud-segmented" role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <button key={option.value} type="button" role="radio" aria-checked={value === option.value} className={value === option.value ? 'is-active' : ''} onClick={() => onChange(option.value)}>
          {option.label}{option.count != null && <span>{option.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* ───────────── Stepper (home, case detail, create-case wizard) ───────────── */

/**
 * Steps are laid out with `space-between`; each step centres its circle over its own label and
 * the connector is built from the half-lines of neighbouring steps plus a flexible filler, so the
 * track always runs circle-to-circle exactly like the design, in both RTL and LTR.
 */
export function Stepper({ steps, current = 0, variant = 'check', label, className = '' }) {
  const items = [];
  // The wizard shows the connector leading to the next step as "in progress" (solid), the other steppers stop at the current node.
  const reach = variant === 'wizard' ? current + 1 : current;
  steps.forEach((step, index) => {
    const state = step.state || (index < current ? 'done' : index === current ? 'current' : 'todo');
    if (index > 0) items.push(<li key={`gap-${index}`} className={cx('ud-steps__gap', index <= reach && 'is-reached')} aria-hidden="true" role="presentation" />);
    items.push(
      <li key={step.label} className={cx('ud-steps__item', `is-${state}`, index > 0 && index <= reach && 'has-prev-reached', index < steps.length - 1 && index < reach && 'has-next-reached')} aria-current={state === 'current' ? 'step' : undefined}>
        <span className="ud-steps__node">
          {state === 'done' ? <UdIcon name="check" size={variant === 'wizard' ? 12 : 14} stroke={3} /> : state === 'current' ? <i /> : null}
        </span>
        <span className="ud-steps__label">
          {variant === 'wizard' && <em>{index + 1}</em>}
          <span>{step.label}</span>
        </span>
      </li>,
    );
  });
  return <ol className={cx('ud-steps', `ud-steps--${variant}`, className)} aria-label={label}>{items}</ol>;
}

/* ───────────── Dialog ───────────── */

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function Dialog({ open, onClose, title, description, children, footer, size = 'md', icon, tone = 'olive' }) {
  const { tr } = useUserI18n();
  const panelRef = useRef(null);
  const previous = useRef(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!open) return undefined;
    previous.current = document.activeElement;
    const panel = panelRef.current;
    const focusables = () => Array.from(panel?.querySelectorAll(FOCUSABLE) || []).filter((el) => el.offsetParent !== null);
    window.requestAnimationFrame(() => (focusables()[1] || focusables()[0] || panel)?.focus());
    const onKey = (event) => {
      if (event.key === 'Escape') { event.stopPropagation(); onClose(); return; }
      if (event.key !== 'Tab') return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  const root = document.querySelector('.ud') || document.body;
  return createPortal(
    <div className="ud-modal" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={panelRef} className={cx('ud-dialog', `ud-dialog--${size}`)} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descId : undefined} tabIndex={-1}>
        <header className="ud-dialog__head">
          {icon && <IconTile icon={icon} tone={tone} size={44} iconSize={20} />}
          <div><h2 id={titleId}>{title}</h2>{description && <p id={descId}>{description}</p>}</div>
          <button type="button" className="ud-iconbtn ud-iconbtn--plain" onClick={onClose} aria-label={tr('إغلاق', 'Close')}><UdIcon name="x" size={18} /></button>
        </header>
        <div className="ud-dialog__body">{children}</div>
        {footer && <footer className="ud-dialog__foot">{footer}</footer>}
      </section>
    </div>,
    root,
  );
}

/* ───────────── States ───────────── */

export function EmptyState({ icon = 'file', title, description, action }) {
  return (
    <div className="ud-empty">
      <IconTile icon={icon} tone="peach" size={56} iconSize={26} />
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}


export function SkeletonRows({ rows = 4, height = 64 }) {
  return (
    <div className="ud-skeleton" role="status" aria-live="polite" aria-busy="true">
      {Array.from({ length: rows }, (_, index) => <span key={index} style={{ height }} />)}
    </div>
  );
}

export function useDisclosure(initial = false) {
  const [open, setOpen] = useState(initial);
  return [open, useCallback(() => setOpen(true), []), useCallback(() => setOpen(false), []), setOpen];
}

export function NotFoundState({ title, description, to, label }) {
  return (
    <Card className="ud-notfound">
      <EmptyState icon="search" title={title} description={description} action={<Button to={to} variant="secondary">{label}</Button>} />
    </Card>
  );
}

/** Closes a popover on outside click / Escape. */
export function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => { if (!ref.current?.contains(event.target)) setOpen(false); };
    const onKey = (event) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  return { open, setOpen, ref };
}

/** Kebab menu used at the end of table rows. `items`: [{ label, icon, onClick, danger?, disabled? }] */
export function RowMenu({ label, items }) {
  const menu = usePopover();
  return (
    <div className="ud-menu" ref={menu.ref}>
      <button type="button" className="ud-iconbtn ud-iconbtn--square ud-iconbtn--sm" aria-haspopup="menu" aria-expanded={menu.open} aria-label={label} title={label} onClick={() => menu.setOpen(!menu.open)}>
        <UdIcon name="more" size={17} />
      </button>
      {menu.open && (
        <div className="ud-popover ud-popover--menu" role="menu" aria-label={label}>
          {items.map((item) => (
            <button key={item.label} type="button" role="menuitem" disabled={item.disabled} className={cx('ud-menuitem', item.danger && 'is-danger')} onClick={() => { menu.setOpen(false); item.onClick(); }}>
              {item.icon && <UdIcon name={item.icon} size={17} />}{item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

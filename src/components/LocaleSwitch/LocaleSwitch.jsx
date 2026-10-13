import React, { useEffect, useRef, useState } from 'react';
import { useLocale } from '../../context/LocaleContext';
import AdminIcon from '../../features/adminDashboard/components/AdminIcon/AdminIcon';
import './LocaleSwitch.css';

const LANGUAGES = [
  { value: 'ar', label: 'العربية' },
  { value: 'en', label: 'English' },
];

export default function LocaleSwitch({ contrast = false, value, onChange, ariaLabel }) {
  const { locale: publicLocale, setLocale } = useLocale();
  const locale = value ?? publicLocale;
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const optionRefs = useRef([]);
  const selected = LANGUAGES.find((item) => item.value === locale) || LANGUAGES[0];

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') { setOpen(false); buttonRef.current?.focus(); }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    optionRefs.current[LANGUAGES.findIndex((item) => item.value === locale)]?.focus();
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, locale]);

  const choose = (value) => {
    if (onChange) onChange(value);
    else setLocale(value);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onMenuKeyDown = (event) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const current = optionRefs.current.indexOf(document.activeElement);
    const next = event.key === 'Home' ? 0
      : event.key === 'End' ? LANGUAGES.length - 1
        : (current + (event.key === 'ArrowDown' ? 1 : -1) + LANGUAGES.length) % LANGUAGES.length;
    optionRefs.current[next]?.focus();
  };

  return (
    <div className={`locale-switch ${contrast ? 'locale-switch--contrast' : ''}`} ref={rootRef} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
      <button
        ref={buttonRef}
        className="locale-switch__trigger"
        type="button"
        aria-label={ariaLabel || (locale === 'ar' ? 'تغيير لغة الواجهة' : 'Change interface language')}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => { if (event.key === 'ArrowDown' && !open) { event.preventDefault(); setOpen(true); } }}
      >
        <AdminIcon name="globe" size={18} />
        <span className="locale-switch__label">{selected.label}</span>
        <AdminIcon name="chevron" size={14} className="locale-switch__chevron" />
      </button>
      {open && (
        <div className="locale-switch__menu" role="listbox" aria-label={locale === 'ar' ? 'لغة الواجهة' : 'Interface language'} onKeyDown={onMenuKeyDown}>
          {LANGUAGES.map((item, index) => (
            <button
              key={item.value}
              ref={(element) => { optionRefs.current[index] = element; }}
              className={`locale-switch__option ${locale === item.value ? 'is-selected' : ''}`}
              type="button"
              role="option"
              aria-selected={locale === item.value}
              onClick={() => choose(item.value)}
            >
              <span>{item.label}</span>
              {locale === item.value && <AdminIcon name="check" size={16} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

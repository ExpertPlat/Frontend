import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import AuthIcon from '../AuthIcon/AuthIcon';
import { useLocale } from '../../../../context/LocaleContext';
import './AuthSuccessAlert.css';

export default function AuthSuccessAlert({ title, message, onClose }) {
  const buttonRef = useRef(null);
  const { tr, dir } = useLocale();
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = 'hidden';
    buttonRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab') { event.preventDefault(); buttonRef.current?.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus?.();
    };
  }, [onClose]);
  return createPortal(
    <div className="auth-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="auth-sweet-alert" role="alertdialog" aria-modal="true" aria-labelledby="auth-success-title" aria-describedby="auth-success-message" dir={dir}>
        <span className="auth-sweet-alert__icon" aria-hidden="true"><AuthIcon name="check" size={31}/></span>
        <h2 id="auth-success-title">{title}</h2>
        <p id="auth-success-message">{message}</p>
        <button ref={buttonRef} className="auth-primary-btn" type="button" onClick={onClose}>{tr('حسنًا', 'Got it')}</button>
      </div>
    </div>,
    document.body,
  );
}

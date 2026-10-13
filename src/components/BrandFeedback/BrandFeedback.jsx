import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AdminIcon from '../../features/adminDashboard/components/AdminIcon/AdminIcon';
import './BrandFeedback.css';

const BrandFeedbackContext = createContext(null);

const DEFAULT_CONFIRMATION = Object.freeze({
  title: 'تأكيد الإجراء',
  message: 'هل تريد متابعة هذا الإجراء؟',
  confirmLabel: 'تأكيد',
  cancelLabel: 'إلغاء',
  tone: 'primary',
});

function normalizeNotice(value) {
  if (typeof value === 'string') return { message: value, tone: 'success' };
  return {
    title: value?.title || '',
    message: value?.message || '',
    tone: value?.tone || 'success',
    duration: value?.duration,
  };
}

function toneIcon(tone) {
  if (tone === 'success') return 'check';
  if (tone === 'warning') return 'clock';
  return 'info';
}

export function BrandFeedbackProvider({ children }) {
  const [confirmation, setConfirmation] = useState(null);
  const [notices, setNotices] = useState([]);
  const confirmationResolver = useRef(null);
  const previousFocus = useRef(null);
  const confirmButton = useRef(null);
  const noticeSequence = useRef(0);

  const closeConfirmation = useCallback((accepted) => {
    confirmationResolver.current?.(accepted);
    confirmationResolver.current = null;
    setConfirmation(null);
    window.requestAnimationFrame(() => previousFocus.current?.focus?.());
  }, []);

  const confirm = useCallback((options = {}) => {
    confirmationResolver.current?.(false);
    previousFocus.current = document.activeElement;
    setConfirmation({ ...DEFAULT_CONFIRMATION, ...options });
    return new Promise((resolve) => {
      confirmationResolver.current = resolve;
    });
  }, []);

  const dismissNotice = useCallback((id) => {
    setNotices((current) => current.filter((notice) => notice.id !== id));
  }, []);

  const notify = useCallback((value) => {
    const notice = normalizeNotice(value);
    if (!notice.message) return null;
    const id = `brand-notice-${Date.now()}-${noticeSequence.current += 1}`;
    setNotices((current) => [...current.slice(-2), { ...notice, id }]);
    window.setTimeout(() => dismissNotice(id), notice.duration || 4200);
    return id;
  }, [dismissNotice]);

  useEffect(() => {
    if (!confirmation) return undefined;
    confirmButton.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeConfirmation(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [closeConfirmation, confirmation]);

  useEffect(() => () => confirmationResolver.current?.(false), []);

  const contextValue = useMemo(() => ({ confirm, notify, dismissNotice }), [confirm, dismissNotice, notify]);

  return (
    <BrandFeedbackContext.Provider value={contextValue}>
      {children}

      <div className="brand-notice-viewport" aria-live="polite" aria-atomic="false">
        {notices.map((notice) => (
          <article className={`brand-notice is-${notice.tone}`} key={notice.id} role={notice.tone === 'error' ? 'alert' : 'status'}>
            <span className="brand-notice__icon"><AdminIcon name={toneIcon(notice.tone)} size={19} /></span>
            <div className="brand-notice__copy">
              {notice.title && <b>{notice.title}</b>}
              <p>{notice.message}</p>
            </div>
            <button type="button" aria-label="إغلاق الرسالة" onClick={() => dismissNotice(notice.id)}>
              <AdminIcon name="close" size={17} />
            </button>
          </article>
        ))}
      </div>

      {confirmation && (
        <div className="brand-confirm-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeConfirmation(false);
        }}>
          <section
            className={`brand-confirm is-${confirmation.tone}`}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="brand-confirm-title"
            aria-describedby="brand-confirm-message"
          >
            <span className="brand-confirm__mark"><AdminIcon name={confirmation.tone === 'danger' ? 'info' : 'shield'} size={23} /></span>
            <div className="brand-confirm__copy">
              <small>SOLVEIT · SECURE ACTION</small>
              <h2 id="brand-confirm-title">{confirmation.title}</h2>
              <p id="brand-confirm-message">{confirmation.message}</p>
            </div>
            <div className="brand-confirm__actions">
              <button className="is-cancel" type="button" onClick={() => closeConfirmation(false)}>{confirmation.cancelLabel}</button>
              <button ref={confirmButton} className="is-confirm" type="button" onClick={() => closeConfirmation(true)}>{confirmation.confirmLabel}</button>
            </div>
          </section>
        </div>
      )}
    </BrandFeedbackContext.Provider>
  );
}

export function useBrandFeedback() {
  const context = useContext(BrandFeedbackContext);
  if (!context) throw new Error('useBrandFeedback must be used inside BrandFeedbackProvider.');
  return context;
}

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBrandFeedback } from '../../../components/BrandFeedback/BrandFeedback';
import useAuth from '../../../hooks/useAuth';
import { PATHS } from '../../../routes/paths';
import { useUserI18n } from '../../userDashboard/i18n/UserI18nContext';
import UdIcon from '../../userDashboard/components/UdIcon';
import { usePopover } from '../../userDashboard/components/ui';
import { useAdminSession } from '../session/AdminSessionContext';

const LANGS = [{ id: 'ar', label: 'العربية' }, { id: 'en', label: 'English' }];

/** Work waiting for a person, in the order it is usually handled. `perm` hides a row the admin cannot open. */
const TASKS = [
  { key: 'kycSubmitted', icon: 'shieldCheck', path: PATHS.ADMIN_KYC, label: ['طلبات تحقق جديدة', 'New verification requests'] },
  { key: 'renewals', icon: 'refresh', path: PATHS.ADMIN_RENEWALS, label: ['تجديدات نطاق بانتظار المراجعة', 'Scope renewals to review'] },
  { key: 'refunds', icon: 'banknote', path: `${PATHS.ADMIN_FINANCE}?tab=refunds`, label: ['طلبات استرداد', 'Refund requests'] },
  { key: 'disputes', icon: 'gavel', path: `${PATHS.ADMIN_FINANCE}?tab=disputes`, label: ['نزاعات تحتاج ردًا', 'Disputes needing a response'] },
  { key: 'reviews', icon: 'star', path: PATHS.ADMIN_REVIEWS, label: ['تقييمات بانتظار الإشراف', 'Reviews awaiting moderation'] },
  { key: 'privacy', icon: 'fingerprint', path: PATHS.ADMIN_PRIVACY, label: ['طلبات بيانات جديدة', 'New data requests'] },
  { key: 'waiting', icon: 'clock', path: `${PATHS.ADMIN_CATALOG}?tab=waiting`, label: ['حالات تنتظر توفر خبراء', 'Cases waiting for experts'] },
];

export default function AdminTopbar({ theme, onThemeToggle, language, onLanguageChange, onMenuToggle, menuOpen }) {
  const { tr, tx, fmtNumber } = useUserI18n();
  const { admin, queues, isSuper } = useAdminSession();
  const { logout, logoutAll } = useAuth();
  const { notify } = useBrandFeedback();
  const navigate = useNavigate();
  const langMenu = usePopover();
  const taskMenu = usePopover();
  const profileMenu = usePopover();
  const [busy, setBusy] = useState(false);

  const selectedLang = LANGS.find((item) => item.id === language) || LANGS[0];
  const open = TASKS.filter((task) => queues[task.key] > 0);
  const totalOpen = open.reduce((sum, task) => sum + queues[task.key], 0);
  const roleLabel = isSuper ? tr('مشرف عام', 'Super admin') : (admin?.roles || []).map((name) => name.replace(/_/g, ' ')).join(' · ');

  const signOut = async (everywhere) => {
    if (busy) return;
    setBusy(true);
    profileMenu.setOpen(false);
    try {
      await (everywhere ? logoutAll('admin') : logout('admin'));
      notify({ message: everywhere ? tr('تم تسجيل الخروج من جميع الأجهزة.', 'You have been signed out on all devices.') : tr('تم تسجيل الخروج بأمان.', 'You have been signed out securely.'), tone: 'success' });
    } catch {
      notify({ message: tr('تم إنهاء الجلسة محليًا. سجّل الدخول مجددًا للمتابعة.', 'The local session was closed. Sign in again to continue.'), tone: 'warning' });
    } finally {
      navigate(PATHS.ADMIN_LOGIN, { replace: true });
    }
  };

  const closeOthers = (keep) => { [langMenu, taskMenu, profileMenu].forEach((menu) => { if (menu !== keep) menu.setOpen(false); }); };

  return (
    <header className="ud-topbar ad-topbar">
      <button type="button" className="ud-topbar__menu" aria-label={tr('فتح القائمة', 'Open menu')} aria-controls="ud-sidebar" aria-expanded={menuOpen} onClick={onMenuToggle}>
        <UdIcon name="panel" size={21} />
      </button>

      <div className="ad-topbar__lead">
        <span className="ad-rolechip"><UdIcon name={isSuper ? 'shieldCheck' : 'shield'} size={16} /><span>{roleLabel || tr('مشرف', 'Admin')}</span></span>
      </div>

      <div className="ud-topbar__actions">
        <div className="ud-pop" ref={taskMenu.ref}>
          <button type="button" className="ud-iconbtn ud-iconbtn--bell" aria-label={tr('المهام المعلّقة', 'Pending work')} aria-haspopup="dialog" aria-expanded={taskMenu.open} onClick={() => { taskMenu.setOpen((v) => !v); closeOthers(taskMenu); }}>
            <UdIcon name="inbox" size={20} />
            {totalOpen > 0 && <i className="ud-iconbtn__dot" aria-hidden="true" />}
          </button>
          {taskMenu.open && (
            <div className="ud-popover ud-popover--wide" role="dialog" aria-label={tr('المهام المعلّقة', 'Pending work')}>
              <div className="ud-popover__head">
                <div><b>{tr('بانتظار إجراء منك', 'Waiting for you')}</b><small>{totalOpen > 0 ? tr(`${fmtNumber(totalOpen)} عنصر مفتوح`, `${fmtNumber(totalOpen)} open items`) : tr('لا يوجد عمل معلّق الآن', 'Nothing is waiting right now')}</small></div>
              </div>
              <ul className="ud-popover__list">
                {open.map((task) => (
                  <li key={task.key}>
                    <Link to={task.path} className="ud-notice is-unread" onClick={() => taskMenu.setOpen(false)}>
                      <span className="ud-notice__icon is-warning"><UdIcon name={task.icon} size={17} /></span>
                      <span className="ud-notice__copy"><b>{tx(task.label)}</b><small>{tr(`${fmtNumber(queues[task.key])} بانتظار الإجراء`, `${fmtNumber(queues[task.key])} waiting`)}</small></span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link to={PATHS.ADMIN_DASHBOARD} className="ud-popover__foot" onClick={() => taskMenu.setOpen(false)}>{tr('فتح النظرة العامة', 'Open the overview')}</Link>
            </div>
          )}
        </div>

        <button type="button" className="ud-iconbtn" aria-label={theme === 'dark' ? tr('الوضع الفاتح', 'Light mode') : tr('الوضع الداكن', 'Dark mode')} aria-pressed={theme === 'dark'} onClick={onThemeToggle}>
          <UdIcon name={theme === 'dark' ? 'sun' : 'moon'} size={20} className={theme === 'dark' ? '' : 'is-filled'} />
        </button>

        <div className="ud-pop" ref={langMenu.ref}>
          <button type="button" className="ud-pill ud-pill--lang" aria-haspopup="listbox" aria-expanded={langMenu.open} aria-label={tr('تغيير لغة الواجهة', 'Change interface language')} onClick={() => { langMenu.setOpen((v) => !v); closeOthers(langMenu); }}>
            <UdIcon name="globe" size={19} /><span>{selectedLang.label}</span><UdIcon name="chevronDown" size={16} className="ud-pill__chevron" />
          </button>
          {langMenu.open && (
            <div className="ud-popover ud-popover--menu" role="listbox" aria-label={tr('لغة الواجهة', 'Interface language')}>
              {LANGS.map((item) => (
                <button key={item.id} type="button" role="option" aria-selected={item.id === language} className={`ud-menuitem${item.id === language ? ' is-selected' : ''}`} onClick={() => { onLanguageChange(item.id); langMenu.setOpen(false); }}>
                  <span>{item.label}</span>{item.id === language && <UdIcon name="check" size={16} />}
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="ud-topbar__divider" aria-hidden="true" />

        <div className="ud-pop" ref={profileMenu.ref}>
          <button type="button" className="ud-profile" aria-haspopup="menu" aria-expanded={profileMenu.open} onClick={() => { profileMenu.setOpen((v) => !v); closeOthers(profileMenu); }}>
            <span className="ud-profile__avatar"><UdIcon name="user" size={20} /></span>
            <span className="ud-profile__copy"><b>{admin?.name || '…'}</b><small>{roleLabel}</small></span>
            <UdIcon name="chevronDown" size={16} className="ud-profile__chevron" />
          </button>
          {profileMenu.open && (
            <div className="ud-popover ud-popover--menu ud-popover--profile" role="menu">
              <div className="ud-popover__identity"><span className="ud-profile__avatar"><UdIcon name="user" size={20} /></span><div><b>{admin?.name}</b><small dir="ltr">{admin?.email}</small></div></div>
              <Link to={PATHS.ADMIN_PROFILE} role="menuitem" className="ud-menuitem" onClick={() => profileMenu.setOpen(false)}><UdIcon name="user" size={18} />{tr('حسابي وصلاحياتي', 'My account & permissions')}</Link>
              <button type="button" role="menuitem" className="ud-menuitem" disabled={busy} onClick={() => signOut(true)}><UdIcon name="shield" size={18} />{tr('تسجيل الخروج من كل الأجهزة', 'Sign out on all devices')}</button>
              <button type="button" role="menuitem" className="ud-menuitem is-danger" disabled={busy} onClick={() => signOut(false)}><UdIcon name="logout" size={18} />{tr('تسجيل الخروج', 'Sign out')}</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

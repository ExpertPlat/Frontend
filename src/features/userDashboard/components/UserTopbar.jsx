import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBrandFeedback } from '../../../components/BrandFeedback/BrandFeedback';
import useAuth from '../../../hooks/useAuth';
import { PATHS } from '../../../routes/paths';
import { useUserI18n } from '../i18n/UserI18nContext';
import { useUserSession, notificationPath } from '../session/UserSessionContext';
import { stagePath } from '../journey/journeyData';
import UdIcon from './UdIcon';
import { usePopover } from './ui';

const LANGS = [{ id: 'ar', label: 'العربية' }, { id: 'en', label: 'English' }];

export default function UserTopbar({ theme, onThemeToggle, language, onLanguageChange, onMenuToggle, menuOpen }) {
  const { tr, fmtDate, fmtTime } = useUserI18n();
  const session = useUserSession();
  const { logout, logoutAll } = useAuth();
  const { notify } = useBrandFeedback();
  const navigate = useNavigate();
  const langMenu = usePopover();
  const bellMenu = usePopover();
  const profileMenu = usePopover();
  const [busy, setBusy] = useState(false);

  const unread = session.notifications.filter((item) => item.unread);
  const latest = session.notifications.slice(0, 4);
  const profile = session.profile || { name: '…', fullName: '…', email: '', role: '' };
  const selectedLang = LANGS.find((item) => item.id === language) || LANGS[0];

  const signOut = async (everywhere) => {
    if (busy) return;
    setBusy(true);
    profileMenu.setOpen(false);
    try {
      await (everywhere ? logoutAll('user') : logout('user'));
      notify({ message: everywhere ? tr('تم تسجيل الخروج من جميع الأجهزة.', 'You have been signed out on all devices.') : tr('تم تسجيل الخروج بأمان.', 'You have been signed out securely.'), tone: 'success' });
    } catch {
      notify({ message: tr('تم إنهاء الجلسة محليًا. سجّل الدخول مجددًا للمتابعة.', 'The local session was closed. Sign in again to continue.'), tone: 'warning' });
    } finally {
      navigate(PATHS.LOGIN, { replace: true });
    }
  };

  return (
    <header className="ud-topbar">
      <button type="button" className="ud-topbar__menu" aria-label={tr('فتح القائمة', 'Open menu')} aria-controls="ud-sidebar" aria-expanded={menuOpen} onClick={onMenuToggle}>
        <UdIcon name="panel" size={21} />
      </button>

      <div className="ud-topbar__actions">
        {/* Notifications */}
        <div className="ud-pop" ref={bellMenu.ref}>
          <button type="button" className="ud-iconbtn ud-iconbtn--bell" aria-label={tr('الإشعارات', 'Notifications')} aria-haspopup="dialog" aria-expanded={bellMenu.open} onClick={() => { bellMenu.setOpen((v) => !v); langMenu.setOpen(false); profileMenu.setOpen(false); }}>
            <UdIcon name="bell" size={20} />
            {unread.length > 0 && <i className="ud-iconbtn__dot" aria-hidden="true" />}
          </button>
          {bellMenu.open && (
            <div className="ud-popover ud-popover--wide" role="dialog" aria-label={tr('الإشعارات', 'Notifications')}>
              <div className="ud-popover__head">
                <div><b>{tr('الإشعارات', 'Notifications')}</b><small>{unread.length > 0 ? tr(`${unread.length} غير مقروءة`, `${unread.length} unread`) : tr('لا توجد إشعارات جديدة', 'You are all caught up')}</small></div>
                {unread.length > 0 && <button type="button" className="ud-linkbtn" onClick={session.markAllRead}>{tr('تحديد الكل كمقروء', 'Mark all read')}</button>}
              </div>
              <ul className="ud-popover__list">
                {latest.map((item) => (
                  <li key={item.id}>
                    <Link to={notificationPath(item.target, PATHS, stagePath)} className={`ud-notice${item.unread ? ' is-unread' : ''}`} onClick={() => { session.markRead(item.id); bellMenu.setOpen(false); }}>
                      <span className="ud-notice__icon is-success"><UdIcon name="bell" size={17} /></span>
                      <span className="ud-notice__copy"><b>{item.title}</b><small>{fmtDate(item.createdAt)} • {fmtTime(item.createdAt)}</small></span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link to={PATHS.USER_NOTIFICATIONS} className="ud-popover__foot" onClick={() => bellMenu.setOpen(false)}>{tr('عرض كل الإشعارات', 'View all notifications')}</Link>
            </div>
          )}
        </div>

        {/* Theme */}
        <button type="button" className="ud-iconbtn" aria-label={theme === 'dark' ? tr('الوضع الفاتح', 'Light mode') : tr('الوضع الداكن', 'Dark mode')} aria-pressed={theme === 'dark'} onClick={onThemeToggle}>
          <UdIcon name={theme === 'dark' ? 'sun' : 'moon'} size={20} className={theme === 'dark' ? '' : 'is-filled'} />
        </button>

        {/* Language */}
        <div className="ud-pop" ref={langMenu.ref}>
          <button type="button" className="ud-pill ud-pill--lang" aria-haspopup="listbox" aria-expanded={langMenu.open} aria-label={tr('تغيير لغة الواجهة', 'Change interface language')} onClick={() => { langMenu.setOpen((v) => !v); bellMenu.setOpen(false); profileMenu.setOpen(false); }}>
            <UdIcon name="globe" size={19} />
            <span>{selectedLang.label}</span>
            <UdIcon name="chevronDown" size={16} className="ud-pill__chevron" />
          </button>
          {langMenu.open && (
            <div className="ud-popover ud-popover--menu" role="listbox" aria-label={tr('لغة الواجهة', 'Interface language')}>
              {LANGS.map((item) => (
                <button key={item.id} type="button" role="option" aria-selected={item.id === language} className={`ud-menuitem${item.id === language ? ' is-selected' : ''}`} onClick={() => { onLanguageChange(item.id); langMenu.setOpen(false); }}>
                  <span>{item.label}</span>
                  {item.id === language && <UdIcon name="check" size={16} />}
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="ud-topbar__divider" aria-hidden="true" />

        {/* Profile */}
        <div className="ud-pop" ref={profileMenu.ref}>
          <button type="button" className="ud-profile" aria-haspopup="menu" aria-expanded={profileMenu.open} onClick={() => { profileMenu.setOpen((v) => !v); bellMenu.setOpen(false); langMenu.setOpen(false); }}>
            <span className="ud-profile__avatar"><UdIcon name="user" size={20} /></span>
            <span className="ud-profile__copy"><b>{profile.name}</b><small>{tr('صاحب حالة', 'Case owner')}</small></span>
            <UdIcon name="chevronDown" size={16} className="ud-profile__chevron" />
          </button>
          {profileMenu.open && (
            <div className="ud-popover ud-popover--menu ud-popover--profile" role="menu">
              <div className="ud-popover__identity"><span className="ud-profile__avatar"><UdIcon name="user" size={20} /></span><div><b>{profile.name}</b><small dir="ltr">{profile.email}</small></div></div>
              <Link to={PATHS.USER_SETTINGS} role="menuitem" className="ud-menuitem" onClick={() => profileMenu.setOpen(false)}><UdIcon name="settings" size={18} />{tr('الإعدادات والخصوصية', 'Settings & privacy')}</Link>
              <button type="button" role="menuitem" className="ud-menuitem" onClick={() => { profileMenu.setOpen(false); notify({ message: tr('سيتم توفير مركز المساعدة قريبًا.', 'The help center will be available soon.'), tone: 'warning' }); }}><UdIcon name="help" size={18} />{tr('المساعدة', 'Help')}</button>
              <button type="button" role="menuitem" className="ud-menuitem" disabled={busy} onClick={() => signOut(true)}><UdIcon name="shield" size={18} />{tr('تسجيل الخروج من كل الأجهزة', 'Sign out on all devices')}</button>
              <button type="button" role="menuitem" className="ud-menuitem is-danger" disabled={busy} onClick={() => signOut(false)}><UdIcon name="logout" size={18} />{tr('تسجيل الخروج', 'Sign out')}</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

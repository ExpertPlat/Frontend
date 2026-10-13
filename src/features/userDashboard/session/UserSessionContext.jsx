import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { profileService, userNotificationsService } from '../../../services/user/accountService';
import { useUserI18n } from '../i18n/UserI18nContext';

const UserSessionContext = createContext(null);

/** Signed-in person + notifications, shared by the topbar, the home page and the notifications page. */
export function UserSessionProvider({ onTimezone, children }) {
  const { language } = useUserI18n();
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const loadProfile = useCallback(async () => {
    try { const data = await profileService.me(); setProfile(data); onTimezone?.(data.timezone); } catch { /* the topbar falls back to a neutral label */ }
  }, [onTimezone]);
  const loadNotifications = useCallback(async () => {
    try { setNotifications(await userNotificationsService.list()); } catch { /* keep the previous list */ }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile, language]);
  useEffect(() => {
    loadNotifications();
    const timer = window.setInterval(loadNotifications, 60000);
    return () => window.clearInterval(timer);
  }, [loadNotifications, language]);

  const markRead = useCallback(async (id) => {
    setNotifications((list) => list.map((item) => (item.id === id ? { ...item, unread: false } : item)));
    try { await userNotificationsService.markRead(id); } catch { loadNotifications(); }
  }, [loadNotifications]);
  const markAllRead = useCallback(async () => {
    const unread = notifications.filter((item) => item.unread);
    setNotifications((list) => list.map((item) => ({ ...item, unread: false })));
    try { await Promise.all(unread.map((item) => userNotificationsService.markRead(item.id))); } catch { loadNotifications(); }
  }, [notifications, loadNotifications]);

  const value = useMemo(() => ({ profile, setProfile, notifications, unreadCount: notifications.filter((item) => item.unread).length, markRead, markAllRead, reloadNotifications: loadNotifications }),
    [profile, notifications, markRead, markAllRead, loadNotifications]);
  return <UserSessionContext.Provider value={value}>{children}</UserSessionContext.Provider>;
}

export function useUserSession() {
  const context = useContext(UserSessionContext);
  if (!context) throw new Error('useUserSession must be used inside UserSessionProvider');
  return context;
}

/** Where a notification leads. `target` comes from the API; unknown kinds fall back to the notifications page. */
export function notificationPath(target, PATHS, stagePath) {
  if (!target) return PATHS.USER_NOTIFICATIONS;
  if (target.kind === 'proposal') return stagePath(target.caseId, 'offer');
  if (target.kind === 'invitation') return stagePath(target.caseId, 'offer');
  if (target.kind === 'agreement') return stagePath(target.caseId, 'agreement');
  if (target.kind === 'booking') return PATHS.USER_APPOINTMENTS;
  return PATHS.USER_NOTIFICATIONS;
}

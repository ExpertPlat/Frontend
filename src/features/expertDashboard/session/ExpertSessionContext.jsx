import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { expertProfileService } from '../../../services/expert/expertProfileService';
import { expertAccountService, expertInvitationsService, expertNotificationsService } from '../../../services/expert/expertWorkService';
import { useUserI18n } from '../../userDashboard/i18n/UserI18nContext';

const ExpertSessionContext = createContext(null);

/** Signed-in expert + notifications, shared by the sidebar, the topbar, the home page and the notifications page. */
export function ExpertSessionProvider({ onTimezone, children }) {
  const { language } = useUserI18n();
  const [me, setMe] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [pendingRequests, setPendingRequests] = useState(0);

  const loadMe = useCallback(async () => {
    try {
      const data = await expertAccountService.me();
      setMe(data);
      if (data.kycStatus === 'approved') {
        try { const availability = await expertProfileService.getAvailability(); onTimezone?.(availability?.data?.timezone); } catch { /* the interface falls back to the browser time zone */ }
      }
    } catch { /* the topbar shows a neutral label until the profile loads */ }
  }, [onTimezone]);
  const loadNotifications = useCallback(async () => {
    try { setNotifications(await expertNotificationsService.list()); } catch { /* keep the previous list */ }
    try { setPendingRequests((await expertInvitationsService.list()).filter((item) => item.status === 'pending').length); } catch { setPendingRequests(0); /* 403 until the account is verified */ }
  }, []);

  useEffect(() => { loadMe(); }, [loadMe, language]);
  useEffect(() => {
    loadNotifications();
    const timer = window.setInterval(loadNotifications, 60000);
    return () => window.clearInterval(timer);
  }, [loadNotifications, language]);

  const markRead = useCallback(async (id) => {
    setNotifications((list) => list.map((item) => (item.id === id ? { ...item, unread: false } : item)));
    try { await expertNotificationsService.markRead(id); } catch { loadNotifications(); }
  }, [loadNotifications]);
  const markAllRead = useCallback(async () => {
    const unread = notifications.filter((item) => item.unread);
    setNotifications((list) => list.map((item) => ({ ...item, unread: false })));
    try { await Promise.all(unread.map((item) => expertNotificationsService.markRead(item.id))); } catch { loadNotifications(); }
  }, [notifications, loadNotifications]);

  const value = useMemo(() => ({
    me, reloadMe: loadMe, pendingRequests, notifications, unreadCount: notifications.filter((item) => item.unread).length, markRead, markAllRead, reloadNotifications: loadNotifications,
    verified: me?.kycStatus === 'approved',
  }), [me, loadMe, pendingRequests, notifications, markRead, markAllRead, loadNotifications]);
  return <ExpertSessionContext.Provider value={value}>{children}</ExpertSessionContext.Provider>;
}

export function useExpertSession() {
  const context = useContext(ExpertSessionContext);
  if (!context) throw new Error('useExpertSession must be used inside ExpertSessionProvider');
  return context;
}

/** Where a notification leads. `target` comes from the API; unknown kinds fall back to the notifications page. */
export function expertNotificationPath(target, PATHS) {
  if (!target) return PATHS.EXPERT_NOTIFICATIONS;
  if (target.kind === 'invitation') return PATHS.EXPERT_INVITATION_DETAIL.replace(':invitationId', target.id);
  if (target.kind === 'proposal') return PATHS.EXPERT_PROPOSAL_DETAIL.replace(':proposalId', target.id);
  if (target.kind === 'agreement') return PATHS.EXPERT_AGREEMENT_DETAIL.replace(':agreementId', target.id);
  if (target.kind === 'booking') return PATHS.EXPERT_BOOKING_DETAIL.replace(':bookingId', target.id);
  return PATHS.EXPERT_NOTIFICATIONS;
}

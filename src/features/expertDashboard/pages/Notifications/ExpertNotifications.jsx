import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PATHS } from '../../../../routes/paths';
import UdIcon from '../../../userDashboard/components/UdIcon';
import { Button, Card, EmptyState, PageHeader } from '../../../userDashboard/components/ui';
import { useUserI18n } from '../../../userDashboard/i18n/UserI18nContext';
import { expertNotificationPath, useExpertSession } from '../../session/ExpertSessionContext';

/** Every notification, newest first. */
export default function ExpertNotifications() {
  const { tr, fmtDate, fmtTime } = useUserI18n();
  const { notifications, unreadCount, markRead, markAllRead } = useExpertSession();
  const navigate = useNavigate();
  return (
    <div className="jr-page">
      <PageHeader icon="bell" title={tr('الإشعارات', 'Notifications')} subtitle={unreadCount > 0 ? tr(`${unreadCount} غير مقروءة`, `${unreadCount} unread`) : tr('لا توجد إشعارات جديدة', 'You are all caught up')} actions={unreadCount > 0 && <Button variant="secondary" icon="check" onClick={markAllRead}>{tr('تحديد الكل كمقروء', 'Mark all read')}</Button>} />
      {notifications.length === 0
        ? <Card className="jr-card"><EmptyState icon="bell" title={tr('لا توجد إشعارات', 'No notifications')} description={tr('سنخبرك هنا عند وصول طلب جديد أو ردّ من العميل.', 'We tell you here when a new request or a client reply arrives.')} /></Card>
        : <Card className="jr-card"><ul className="jr-rows">
          {notifications.map((n) => (
            <li key={n.id} className={n.unread ? 'is-unread' : ''}><span className="ud-notice__icon is-success"><UdIcon name="bell" size={17} /></span><span className="jr-rows__copy"><b>{n.title}</b><small>{fmtDate(n.createdAt)} • {fmtTime(n.createdAt)}</small></span>
              <Button size="sm" variant="secondary" onClick={() => { markRead(n.id); navigate(expertNotificationPath(n.target, PATHS)); }}>{tr('فتح', 'Open')}</Button></li>
          ))}
        </ul></Card>}
    </div>
  );
}

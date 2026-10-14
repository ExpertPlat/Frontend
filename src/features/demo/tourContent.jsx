import React from 'react';
import { useLocale } from '../../context/LocaleContext';
import DemoIcon from './icons';

/** The three parties of a case, shown inside tour cards. */
export function RoleFlow() {
  const { tr } = useLocale();
  const roles = [
    ['user', tr('صاحب الحالة', 'Client'), tr('يشرح مشكلته ويختار خبيراً', 'Describes the problem, picks an expert')],
    ['briefcase', tr('الخبير', 'Expert'), tr('يقبل الطلب ويرسل عرضاً', 'Accepts and sends a proposal')],
    ['shield', tr('الإدارة', 'Admin'), tr('تتحقق وتتابع التشغيل', 'Verifies and oversees')],
  ];
  return (
    <div className="st-roles" aria-hidden="true">
      {roles.map(([icon, name, what], i) => (
        <React.Fragment key={icon}>
          {i > 0 && <i />}
          <span className="st-role"><span><DemoIcon name={icon} size={17} /></span><b>{name}</b><small>{what}</small></span>
        </React.Fragment>
      ))}
    </div>
  );
}

/** A complete demo run, step by step. */
export function JourneySteps() {
  const { tr } = useLocale();
  return (
    <ol className="st-steps">
      <li><b>{tr('كصاحب حالة:', 'As the client:')}</b> {tr('اكتب مشكلتك وادعُ خبيراً.', 'describe a problem and invite an expert.')}</li>
      <li><b>{tr('بدّل إلى الخبير:', 'Switch to the expert:')}</b> {tr('اقبل الطلب وأرسل عرضاً.', 'accept the request and send a proposal.')}</li>
      <li><b>{tr('عد كصاحب حالة:', 'Back as the client:')}</b> {tr('اقبل العرض، ادفع واحجز الموعد.', 'accept, pay and book the session.')}</li>
      <li><b>{tr('ادخل كإدارة:', 'Sign in as admin:')}</b> {tr('شاهد الحالة من جهة التشغيل.', 'see the case from the operations side.')}</li>
    </ol>
  );
}

import React from 'react';
import Icon from '../../../../../components/Icon/Icon';
import { useLocale } from '../../../../../context/LocaleContext';

function TrustBar() {
  const { tr } = useLocale();
  const items = [
    ['video', tr('خدمات عن بُعد بالكامل', '100% remote services'), tr('فيديو أو صوت أو مكتوب', 'Video, audio, or written')],
    ['lock', tr('مشاركة بإذنك فقط', 'Shared only with your OK'), tr('أنت تختار ما يراه الخبير', 'You choose what the expert sees')],
    ['file', tr('عرض مكتوب بسعر واضح', 'A written, priced proposal'), tr('قبل أي التزام مالي', 'Before any payment')],
    ['check', tr('تحقق مهني للخبراء', 'Verified professionals'), tr('قبل نشر الملف والخدمات', 'Before profiles go live')],
  ];
  return (
    <div className="container lp-trustbar-wrap">
      <ul className="lp-trustbar" data-reveal>
        {items.map(([icon, title, text]) => (
          <li key={icon}><span><Icon name={icon} size={22} /></span><div><b>{title}</b><small>{text}</small></div></li>
        ))}
      </ul>
    </div>
  );
}

export default TrustBar;

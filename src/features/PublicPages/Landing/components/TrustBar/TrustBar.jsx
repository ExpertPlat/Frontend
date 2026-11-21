import React from 'react';
import Icon from '../../../../../components/Icon/Icon';
import { useLocale } from '../../../../../context/LocaleContext';

/** Four reassurance points. Rendered along the bottom edge of the hero stage. */
function TrustBar() {
  const { tr } = useLocale();
  const items = [
    ['video', tr('خدمات عن بُعد 100%', '100% remote services'), tr('فيديو، صوت، أو كتابة', 'Video, audio, or written')],
    ['lock', tr('مشاركة بإذنك فقط', 'Shared only with your OK'), tr('أنت تختار ما يراه الخبير', 'You choose what the expert sees')],
    ['file', tr('عرض مكتوب بسعر واضح', 'A written, priced proposal'), tr('قبل أي التزام مالي', 'Before any payment')],
    ['shield', tr('خبراء موثّقون', 'Verified professionals'), tr('قبل نشر الملف', 'Before profiles go live')],
  ];
  return (
    <ul className="lp-stage__strip">
      {items.map(([icon, title, text]) => (
        <li key={icon}><Icon name={icon} size={22} /><div><b>{title}</b><small>{text}</small></div></li>
      ))}
    </ul>
  );
}

export default TrustBar;

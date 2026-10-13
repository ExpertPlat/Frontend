import React from 'react';

const Icon = ({ name, size = 22 }) => {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const paths = {
    arrow: <><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></>,
    case: <><rect x="3.5" y="4" width="17" height="16" rx="4"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
    nodes: <><circle cx="12" cy="12" r="2.5"/><circle cx="4.5" cy="6" r="2"/><circle cx="19.5" cy="6" r="2"/><circle cx="4.5" cy="18" r="2"/><circle cx="19.5" cy="18" r="2"/><path d="m10 10-4-3M14 10l4-3M10 14l-4 3M14 14l4 3"/></>,
    spark: <><path d="m12 3 1.1 3.2L16 7.5l-2.9 1.3L12 12l-1.1-3.2L8 7.5l2.9-1.3L12 3Z"/><path d="m18 14 .8 2.1 2.2.9-2.2.9L18 20l-.8-2.1L15 17l2.2-.9L18 14Z"/></>,
    shield: <><path d="M12 3 5 6v5c0 4.5 2.7 8.1 7 10 4.3-1.9 7-5.5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></>,
    file: <><path d="M7 3.5h7l3 3V20H7z"/><path d="M14 3.5V7h3M9 11h6M9 15h6"/></>,
    check: <path d="m5 12 4 4 10-10"/>,
    search: <><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></>,
    user: <><circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-4 3.1-6 7-6s6.2 2 7 6"/></>,
    lock: <><rect x="5" y="10" width="14" height="10" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    clock: <><circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/></>,
    video: <><rect x="3" y="6" width="13" height="12" rx="3"/><path d="m16 10.5 5-3v9l-5-3"/></>,
    phone: <><path d="M5 4.5h3.2l1.5 4-2 1.3a11 11 0 0 0 5.5 5.5l1.3-2 4 1.5V19a1.5 1.5 0 0 1-1.6 1.5C10.7 20 4 13.3 3.5 6.1A1.5 1.5 0 0 1 5 4.5Z"/></>,
    pen: <><path d="m4 20 1-4L16.5 4.5a2 2 0 0 1 3 3L8 19l-4 1Z"/><path d="m14.5 6.5 3 3"/></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
    close: <><path d="M6 6l12 12M18 6 6 18"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    play: <><circle cx="12" cy="12" r="9"/><path d="m10.5 8.8 4.5 3.2-4.5 3.2Z"/></>,
    star: <><path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8 6.8 19.6l1-5.8-4.3-4.1 5.9-.8L12 3.5Z"/></>,
    card: <><rect x="3" y="5.5" width="18" height="13" rx="3"/><path d="M3 10h18M7 15h3"/></>,
    calendar: <><rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M4 10h16"/></>,
    globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9S14.500 18.400 12 21c-2.500-2.600-3.700-5.600-3.700-9S9.500 5.600 12 3Z"/></>,
    layers: <><path d="m12 4 9 5-9 5-9-5 9-5Z"/><path d="m3 14 9 5 9-5"/></>,
    users: <><circle cx="9" cy="8.500" r="3.200"/><path d="M3 19c.700-3.400 2.700-5 6-5s5.300 1.600 6 5"/><path d="M16 5.500a3 3 0 0 1 0 6M18.500 14.200c1.400.7 2.300 2.200 2.700 4.800"/></>,
    chevron: <path d="m6 9 6 6 6-6"/>,
    arrowUp: <><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></>,
  };
  return <svg {...common} className={name === 'arrow' ? 'ic-arrow' : undefined}>{paths[name] || paths.spark}</svg>;
};

export default Icon;

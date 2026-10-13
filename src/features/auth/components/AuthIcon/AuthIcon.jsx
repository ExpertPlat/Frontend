import React from 'react';

const AuthIcon = ({ name, size = 20 }) => {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    className: name === 'arrow' ? 'auth-arrow' : undefined,
  };
  const paths = {
    mail: <><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/></>,
    lock: <><rect x="5" y="10" width="14" height="10" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    user: <><circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-4 3.1-6 7-6s6.2 2 7 6"/></>,
    eye: <><path d="M2.5 12s3.4-5.5 9.5-5.5S21.5 12 21.5 12s-3.4 5.5-9.5 5.5S2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.4"/></>,
    eyeOff: <><path d="m3 3 18 18"/><path d="M10.6 6.6A9.5 9.5 0 0 1 12 6.5c6.1 0 9.5 5.5 9.5 5.5a15 15 0 0 1-2.1 2.7M6.1 6.1C3.8 7.6 2.5 12 2.5 12s3.4 5.5 9.5 5.5a9.8 9.8 0 0 0 3.1-.5"/></>,
    arrow: <><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></>,
    check: <path d="m5 12 4 4 10-10"/>,
    shield: <><path d="M12 3 5 6v5c0 4.5 2.7 8.1 7 10 4.3-1.9 7-5.5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></>,
    nodes: <><circle cx="12" cy="12" r="2.3"/><circle cx="5" cy="6" r="1.7"/><circle cx="19" cy="6" r="1.7"/><circle cx="5" cy="18" r="1.7"/><path d="m10 10-4-3M14 10l4-3M10 14l-4 3"/></>,
    close: <><path d="M6 6l12 12M18 6 6 18"/></>,
  };
  return <svg {...common}>{paths[name] || paths.check}</svg>;
};

export default AuthIcon;

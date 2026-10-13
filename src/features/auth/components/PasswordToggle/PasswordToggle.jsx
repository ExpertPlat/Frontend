import React from 'react';
import AuthIcon from '../AuthIcon/AuthIcon';

export default function PasswordToggle({ visible, onClick, label }) {
  return (
    <button className="auth-icon-btn" type="button" onClick={onClick} aria-label={label}>
      <AuthIcon name={visible ? 'eyeOff' : 'eye'} size={19}/>
    </button>
  );
}

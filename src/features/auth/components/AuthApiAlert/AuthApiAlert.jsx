import React from 'react';
import AuthIcon from '../AuthIcon/AuthIcon';

export default function AuthApiAlert({ message, tone = 'error' }) {
  if (!message) return null;
  return (
    <div className={`auth-api-alert is-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <AuthIcon name={tone === 'success' ? 'check' : 'shield'} size={16} />
      <span>{message}</span>
    </div>
  );
}

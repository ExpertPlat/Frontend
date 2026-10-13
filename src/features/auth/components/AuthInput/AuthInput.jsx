import React from 'react';
import AuthIcon from '../AuthIcon/AuthIcon';

export default function AuthInput({ id, label, icon, type = 'text', value, onChange, placeholder, autoComplete, error, endAction }) {
  return (
    <div className={`auth-field ${error ? 'auth-field--error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <div className="auth-input-wrap">
        <span className="auth-input-icon"><AuthIcon name={icon} size={19}/></span>
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        {endAction}
      </div>
      {error && <small className="auth-error" id={`${id}-error`}>{error}</small>}
    </div>
  );
}

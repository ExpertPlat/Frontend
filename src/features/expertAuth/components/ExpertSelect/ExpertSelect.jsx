import React from 'react';
import AuthIcon from '../../../auth/components/AuthIcon/AuthIcon';

export default function ExpertSelect({ id, label, icon = 'nodes', value, onChange, children, error }) {
  return (
    <div className={`auth-field ${error ? 'auth-field--error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <div className="auth-input-wrap auth-select-wrap">
        <span className="auth-input-icon"><AuthIcon name={icon} size={19}/></span>
        <select
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        >
          {children}
        </select>
      </div>
      {error && <small className="auth-error" id={`${id}-error`}>{error}</small>}
    </div>
  );
}

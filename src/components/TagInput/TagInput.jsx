import React, { useMemo, useState } from 'react';
import AdminIcon from '../../features/adminDashboard/components/AdminIcon/AdminIcon';
import { mergeUniqueTags } from './tagUtils';
import './TagInput.css';

export default function TagInput({
  id,
  value = [],
  onChange,
  placeholder = '',
  addLabel = 'إضافة',
  removeLabel = 'إزالة',
  maxTags = 12,
  disabled = false,
  invalid = false,
}) {
  const [draft, setDraft] = useState('');
  const tags = useMemo(() => (Array.isArray(value) ? value : []), [value]);

  const commit = (rawValue = draft) => {
    if (disabled || !String(rawValue || '').trim()) return;
    onChange?.(mergeUniqueTags(tags, rawValue, maxTags));
    setDraft('');
  };

  const remove = (index) => {
    if (disabled) return;
    onChange?.(tags.filter((_, tagIndex) => tagIndex !== index));
  };

  const onKeyDown = (event) => {
    if (['Enter', ',', '،'].includes(event.key)) {
      event.preventDefault();
      commit();
      return;
    }
    if (event.key === 'Backspace' && !draft && tags.length) remove(tags.length - 1);
  };

  const onPaste = (event) => {
    const pasted = event.clipboardData.getData('text');
    if (!/[,،;\n]/.test(pasted)) return;
    event.preventDefault();
    commit(pasted);
  };

  return (
    <div className={`brand-tag-input${invalid ? ' is-invalid' : ''}${disabled ? ' is-disabled' : ''}`}>
      <div className="brand-tag-input__tags" aria-live="polite">
        {tags.map((tag, index) => (
          <span className="brand-tag" key={`${tag}-${index}`}>
            <b>{tag}</b>
            <button type="button" disabled={disabled} aria-label={`${removeLabel}: ${tag}`} onClick={() => remove(index)}>
              <AdminIcon name="close" size={13} />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          disabled={disabled || tags.length >= maxTags}
          aria-invalid={invalid}
          autoComplete="off"
          placeholder={tags.length ? '' : placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onBlur={() => commit()}
        />
      </div>
      <button className="brand-tag-input__add" type="button" disabled={disabled || !draft.trim() || tags.length >= maxTags} onMouseDown={(event) => event.preventDefault()} onClick={() => commit()}>
        <AdminIcon name="plus" size={14} />{addLabel}
      </button>
      <small className="brand-tag-input__counter">{tags.length}/{maxTags}</small>
    </div>
  );
}

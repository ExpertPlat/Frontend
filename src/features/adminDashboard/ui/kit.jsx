import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getErrorMessage, getFieldErrors } from '../../../api/errorHandler';
import { useBrandFeedback } from '../../../components/BrandFeedback/BrandFeedback';
import { useUserI18n } from '../../userDashboard/i18n/UserI18nContext';
import UdIcon from '../../userDashboard/components/UdIcon';
import { Button, Card, CardHeader, Dialog, EmptyState, SkeletonRows, StatusPill, cx } from '../../userDashboard/components/ui';
import { pick } from './statuses';

/* ───────────── small display parts ───────────── */

/** `map` is one of the tables in statuses.js; `value` is what the API returned. */
export function Status({ map, value, meta }) {
  const { tx } = useUserI18n();
  const found = meta || pick(map, value);
  return <StatusPill tone={found.tone}>{tx(found.label)}</StatusPill>;
}

/** Looks a `[ar, en]` label up in a dictionary and falls back to the raw value. */
export function useLabel() {
  const { tx } = useUserI18n();
  return (dictionary, key) => (dictionary?.[key] ? tx(dictionary[key]) : (key ?? '—'));
}

export function Person({ name, sub, to, icon = 'user' }) {
  const body = (
    <>
      <span className="ad-person__avatar"><UdIcon name={icon} size={16} /></span>
      <span className="ad-person__copy"><b>{name || '—'}</b>{sub && <small dir="auto">{sub}</small>}</span>
    </>
  );
  return to ? <Link className="ad-person" to={to}>{body}</Link> : <span className="ad-person">{body}</span>;
}

export function Money({ minor, currency = 'AED', strong = false, tone }) {
  const { fmtMoney } = useUserI18n();
  if (minor === undefined || minor === null) return <span className="ad-muted">—</span>;
  return <span className={cx('ad-money', strong && 'is-strong', tone && `is-${tone}`)} dir="ltr">{fmtMoney(minor, currency)}</span>;
}

export function Rating({ value }) {
  if (value === undefined || value === null) return <span className="ad-muted">—</span>;
  return <span className="ad-rating" dir="ltr"><UdIcon name="star" size={14} />{Number(value).toFixed(1)}</span>;
}

export function When({ value, time = false }) {
  const { fmtDateShort, fmtDateTime } = useUserI18n();
  if (!value) return <span className="ad-muted">—</span>;
  return <time dateTime={value}>{time ? fmtDateTime(value) : fmtDateShort(value)}</time>;
}

/** Stat tile: a number, a label and (optionally) a link to the queue behind it. */
export function Stat({ icon, tone = 'olive', label, value, hint, to, attention = false }) {
  const body = (
    <>
      <span className={cx('ad-stat__icon', `is-${tone}`)}><UdIcon name={icon} size={20} /></span>
      <span className="ad-stat__copy"><small>{label}</small><b>{value}</b>{hint && <em>{hint}</em>}</span>
      {to && <UdIcon name="chevronLeft" size={16} className="ud-dir ad-stat__go" />}
    </>
  );
  return to
    ? <Link to={to} className={cx('ad-stat', attention && 'is-attention')}>{body}</Link>
    : <div className={cx('ad-stat', attention && 'is-attention')}>{body}</div>;
}

export function Notice({ tone = 'info', icon, children, action }) {
  const glyph = icon || ({ info: 'info', warning: 'alert', danger: 'alert', success: 'checkCircle' }[tone] || 'info');
  return <div className={cx('ad-notice', `is-${tone}`)} role={tone === 'danger' ? 'alert' : 'status'}><UdIcon name={glyph} size={19} /><span>{children}</span>{action}</div>;
}

export function LoadFailed({ message, onRetry }) {
  const { tr } = useUserI18n();
  return <Notice tone="danger" action={onRetry && <button type="button" className="ud-linkbtn" onClick={onRetry}>{tr('إعادة المحاولة', 'Try again')}</button>}>{message}</Notice>;
}

export function Section({ icon, title, aside, children, className = '', flush = false }) {
  return (
    <Card className={cx('ad-section', flush && 'is-flush', className)}>
      <CardHeader icon={icon} title={title} aside={aside} />
      {children}
    </Card>
  );
}

/** Label/value grid used on every detail page. `items`: [[label, value, { wide?: true }]]. */
export function KV({ items, columns = 2 }) {
  return (
    <dl className="ad-kv" style={{ '--cols': columns }}>
      {items.filter(Boolean).map(([label, value, opts]) => (
        <div key={label} className={opts?.wide ? 'is-wide' : undefined}>
          <dt>{label}</dt>
          <dd>{value === undefined || value === null || value === '' ? <span className="ad-muted">—</span> : value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Timeline({ items, empty }) {
  if (!items?.length) return <p className="ad-muted ad-pad">{empty}</p>;
  return (
    <ol className="ad-timeline">
      {items.map((item, index) => (
        <li key={item.key ?? index} className={item.tone ? `is-${item.tone}` : undefined}>
          <i aria-hidden="true" />
          <div>
            <b>{item.title}</b>
            {item.note && <p>{item.note}</p>}
            {item.at && <small><When value={item.at} time /></small>}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function Tabs({ tabs, value, onChange, label }) {
  return (
    <div className="ad-tabs" role="tablist" aria-label={label}>
      {tabs.map((tab) => (
        <button key={tab.id} type="button" role="tab" aria-selected={tab.id === value} className={cx('ad-tab', tab.id === value && 'is-active')} onClick={() => onChange(tab.id)}>
          {tab.icon && <UdIcon name={tab.icon} size={17} />}
          <span>{tab.label}</span>
          {tab.count !== undefined && tab.count !== null && <em>{tab.count}</em>}
        </button>
      ))}
    </div>
  );
}

/* ───────────── lists ───────────── */

/**
 * Responsive table. On phones every row turns into a labelled card (no sideways scrolling).
 * columns: [{ key, header, render(row), align, className, primary }]. `to(row)` makes the first cell a link to the detail page.
 */
export function DataTable({ columns, rows, rowKey = 'id', loading, error, onRetry, empty, to, caption }) {
  const { tr } = useUserI18n();
  if (error) return <div className="ad-pad"><LoadFailed message={getErrorMessage(error)} onRetry={onRetry} /></div>;
  if (loading && !rows?.length) return <div className="ad-pad"><SkeletonRows rows={5} height={52} /></div>;
  if (!rows?.length) return <div className="ad-pad">{empty || <EmptyState icon="inbox" title={tr('لا توجد نتائج', 'No results')} description={tr('جرّب تغيير عوامل التصفية.', 'Try changing the filters.')} />}</div>;
  return (
    <div className={cx('ad-tablewrap', loading && 'is-refreshing')}>
      <table className="ad-table">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>{columns.map((column) => <th key={column.key} scope="col" className={cx(column.align && `is-${column.align}`, column.className)}>{column.header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={typeof rowKey === 'function' ? rowKey(row) : row[rowKey]}>
              {columns.map((column, index) => {
                const content = column.render ? column.render(row) : row[column.key];
                const href = index === 0 && to ? to(row) : null;
                return (
                  <td key={column.key} data-label={column.header} className={cx(column.align && `is-${column.align}`, column.className, column.primary && 'is-primary')}>
                    {href ? <Link className="ad-rowlink" to={href}>{content}</Link> : content}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pager({ meta, onPage }) {
  const { tr, fmtNumber } = useUserI18n();
  if (!meta || meta.lastPage <= 1) return meta?.total ? <div className="ad-pager"><span>{tr(`${fmtNumber(meta.total)} نتيجة`, `${fmtNumber(meta.total)} results`)}</span></div> : null;
  const { currentPage: page, lastPage: last, total, perPage } = meta;
  const from = (page - 1) * perPage + 1;
  const to = Math.min(total, page * perPage);
  return (
    <nav className="ad-pager" aria-label={tr('التنقل بين الصفحات', 'Pagination')}>
      <span>{tr(`${fmtNumber(from)}–${fmtNumber(to)} من ${fmtNumber(total)}`, `${fmtNumber(from)}–${fmtNumber(to)} of ${fmtNumber(total)}`)}</span>
      <div>
        <button type="button" className="ad-iconbtn" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label={tr('الصفحة السابقة', 'Previous page')}><UdIcon name="chevronRight" size={17} className="ud-dir" /></button>
        <b>{fmtNumber(page)} / {fmtNumber(last)}</b>
        <button type="button" className="ad-iconbtn" disabled={page >= last} onClick={() => onPage(page + 1)} aria-label={tr('الصفحة التالية', 'Next page')}><UdIcon name="chevronLeft" size={17} className="ud-dir" /></button>
      </div>
    </nav>
  );
}

export function SearchBox({ value, onChange, placeholder }) {
  const { tr } = useUserI18n();
  return (
    <label className="ad-search">
      <UdIcon name="search" size={18} />
      <input type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder || tr('بحث…', 'Search…')} aria-label={placeholder || tr('بحث', 'Search')} />
    </label>
  );
}

export function FilterSelect({ value, onChange, options, label }) {
  return (
    <label className="ad-filter">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} aria-label={label}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <UdIcon name="chevronDown" size={16} />
    </label>
  );
}

export function FilterBar({ children, trailing }) {
  return <div className="ad-filterbar"><div className="ad-filterbar__fields">{children}</div>{trailing && <div className="ad-filterbar__trail">{trailing}</div>}</div>;
}

const useDebounced = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const handle = window.setTimeout(() => setDebounced(value), delay); return () => window.clearTimeout(handle); }, [value, delay]);
  return debounced;
};

/**
 * Server-side list state: filters + page → `fetcher(query)` → { items, meta }. The page resets when a filter changes,
 * the search text is debounced, and the list reloads on language change (the API answers in Accept-Language).
 */
export function usePagedList(fetcher, initialFilters = {}, { perPage = 10, enabled = true } = {}) {
  const { language } = useUserI18n();
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ items: [], meta: null, loading: enabled, error: null });
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const seq = useRef(0);
  const search = useDebounced(filters.search ?? '');
  const query = useMemo(() => {
    const out = { page, perPage };
    Object.entries({ ...filters, search }).forEach(([key, value]) => { if (value !== '' && value !== undefined && value !== null) out[key] = value; });
    return out;
  }, [filters, search, page, perPage]);
  const key = JSON.stringify(query);

  const load = useCallback(async ({ silent = false } = {}) => {
    const mine = ++seq.current;
    if (!silent) setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const result = await fetcherRef.current(JSON.parse(key));
      if (mine === seq.current) setState({ items: result.items, meta: result.meta, loading: false, error: null });
    } catch (error) {
      if (mine === seq.current) setState((current) => ({ ...current, loading: false, error }));
    }
  }, [key]);
  useEffect(() => { if (enabled) load(); }, [load, language, enabled]);

  const setFilter = useCallback((name, value) => { setPage(1); setFilters((current) => ({ ...current, [name]: value })); }, []);
  return { ...state, filters, setFilter, page, setPage, reload: load };
}

/* ───────────── actions ───────────── */

/**
 * Runs a write call: toast on success, a clear message on failure, a reload on 409 ("changed elsewhere"),
 * and the 422 field errors handed back so a dialog can show them next to the right field.
 */
export function useAdminAction(reload) {
  const { notify } = useBrandFeedback();
  const { tr } = useUserI18n();
  const [busy, setBusy] = useState(false);
  const run = useCallback(async (fn, { success } = {}) => {
    setBusy(true);
    try {
      const data = await fn();
      if (success) notify({ message: success, tone: 'success' });
      return { ok: true, data, fieldErrors: {}, message: '' };
    } catch (error) {
      const message = getErrorMessage(error);
      const conflict = error?.status === 409;
      if (conflict) { notify({ message: `${message} ${tr('تم تحديث البيانات.', 'The data was refreshed.')}`, tone: 'warning' }); reload?.({ silent: true }); }
      return { ok: false, error, fieldErrors: getFieldErrors(error), message, conflict };
    } finally {
      setBusy(false);
    }
  }, [notify, reload, tr]);
  return { busy, run };
}

/**
 * Confirmation dialog for a state change. Extra inputs go in `children`; `canSubmit` gates the confirm button;
 * `error` is the server message shown inside the dialog so the person never loses what they typed.
 */
export function ActionDialog({ open, onClose, title, description, icon = 'shield', tone = 'olive', confirmLabel, variant = 'primary', children, onSubmit, busy, canSubmit = true, error, size = 'md' }) {
  const { tr } = useUserI18n();
  return (
    <Dialog
      open={open}
      onClose={busy ? () => {} : onClose}
      title={title}
      description={description}
      icon={icon}
      tone={tone}
      size={size}
      footer={(
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>{tr('تراجع', 'Cancel')}</Button>
          <Button variant={variant} loading={busy} disabled={!canSubmit} onClick={onSubmit}>{confirmLabel || tr('تأكيد', 'Confirm')}</Button>
        </>
      )}
    >
      <form className="ad-dialogform" onSubmit={(event) => { event.preventDefault(); if (canSubmit && !busy) onSubmit(); }}>
        {children}
        {error && <Notice tone="danger">{error}</Notice>}
      </form>
    </Dialog>
  );
}

export { Button, Card, EmptyState, SkeletonRows };

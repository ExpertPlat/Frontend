import React, { createContext, useContext, useMemo } from 'react';
import { setApiLanguage } from '../../../services/config.js';

const UserI18nContext = createContext(null);

const browserZone = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; } };

/**
 * The API returns canonical UTC instants ("2026-10-12T06:00:00Z"). They are stored and compared as UTC and only
 * formatted here, at the UI edge, in the person's timezone (profile timezone, else the browser's).
 * Values without an offset are treated as UTC.
 */
const toDate = (value) => {
  if (value instanceof Date) return value;
  const text = String(value);
  return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(text) ? text : `${text}Z`);
};

export function UserI18nProvider({ language = 'ar', onLanguageChange, theme = 'light', onThemeChange, timezone, children }) {
  const value = useMemo(() => {
    setApiLanguage(language);
    const zone = timezone || browserZone();
    const UTC = { timeZone: zone };
    const ar = language === 'ar';
    const locale = ar ? 'ar-EG-u-nu-latn' : 'en-GB';

    /** Inline bilingual string: tr('عربي', 'English'). */
    const tr = (arabic, english) => (ar ? arabic : english);
    /** Picks from a [arabic, english] tuple . Plain strings pass through. */
    const tx = (entry) => (Array.isArray(entry) ? (ar ? entry[0] : entry[1]) : entry);

    const formatters = {
      date: new Intl.DateTimeFormat(locale, { ...UTC, day: 'numeric', month: 'long', year: 'numeric' }),
      dateShort: new Intl.DateTimeFormat(locale, { ...UTC, day: 'numeric', month: 'short', year: 'numeric' }),
      dayMonth: new Intl.DateTimeFormat(locale, { ...UTC, day: 'numeric', month: 'long' }),
      weekdayDate: new Intl.DateTimeFormat(locale, { ...UTC, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      weekday: new Intl.DateTimeFormat(locale, { ...UTC, weekday: 'long' }),
      month: new Intl.DateTimeFormat(locale, { ...UTC, month: 'long' }),
      time: new Intl.DateTimeFormat(locale, { ...UTC, hour: '2-digit', minute: '2-digit', hour12: true }),
    };

    const fmtDate = (iso) => formatters.date.format(toDate(iso));
    const fmtDateShort = (iso) => formatters.dateShort.format(toDate(iso));
    const fmtDayMonth = (iso) => formatters.dayMonth.format(toDate(iso));
    const fmtWeekdayDate = (iso) => formatters.weekdayDate.format(toDate(iso));
    const fmtWeekday = (iso) => formatters.weekday.format(toDate(iso));
    const fmtMonth = (iso) => formatters.month.format(toDate(iso));
    const clock = new Intl.DateTimeFormat('en-GB', { ...UTC, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    const clockParts = (date) => { const [h, m] = clock.format(date).split(':').map(Number); return { hours: h, hh: String((h % 12) || 12).padStart(2, '0'), mm: String(m).padStart(2, '0') }; };
    const fmtTime = (iso, { long = false } = {}) => {
      const date = toDate(iso);
      if (!long) return formatters.time.format(date);
      const { hours, hh, mm } = clockParts(date);
      return ar ? `${hh}:${mm} ${hours < 12 ? 'صباحًا' : 'مساءً'}` : `${hh}:${mm} ${hours < 12 ? 'am' : 'pm'}`;
    };
    const fmtDateTime = (iso) => `${fmtDate(iso)} • ${fmtTime(iso)}`;
    /** "7 يناير 2026، 10:30 ص" — the compact stamp used in detail panels. */
    const fmtStamp = (iso) => {
      const { hours, hh, mm } = clockParts(toDate(iso));
      return ar ? `${fmtDate(iso)}، ${hh}:${mm} ${hours < 12 ? 'ص' : 'م'}` : `${fmtDate(iso)}, ${hh}:${mm} ${hours < 12 ? 'am' : 'pm'}`;
    };
    const fmtNumber = (number) => new Intl.NumberFormat(locale).format(number);
    /** Money is stored in minor units + ISO currency, never as floats. */
    const fmtMoney = (minor, currency = 'USD') => new Intl.NumberFormat(locale, {
      style: 'currency', currency, minimumFractionDigits: minor % 100 === 0 ? 0 : 2,
    }).format(minor / 100);

    return {
      language,
      dir: ar ? 'rtl' : 'ltr',
      isRtl: ar,
      tr,
      tx,
      fmtDate,
      fmtDateShort,
      fmtDayMonth,
      fmtWeekdayDate,
      fmtWeekday,
      fmtMonth,
      fmtTime,
      fmtDateTime,
      fmtStamp,
      timezone: timezone || browserZone(),
      setLanguage: onLanguageChange,
      theme,
      setTheme: onThemeChange,
      fmtNumber,
      fmtMoney,
    };
  }, [language, onLanguageChange, theme, onThemeChange, timezone]);

  return <UserI18nContext.Provider value={value}>{children}</UserI18nContext.Provider>;
}

export function useUserI18n() {
  const context = useContext(UserI18nContext);
  if (!context) throw new Error('useUserI18n must be used inside UserI18nProvider');
  return context;
}

export const getUserDirection = (language) => (language === 'ar' ? 'rtl' : 'ltr');

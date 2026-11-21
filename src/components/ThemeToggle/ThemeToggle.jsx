import { useTheme } from '../../context/ThemeContext';
import { useLocale } from '../../context/LocaleContext';

/** Light/dark switch for the public site and auth screens. Dashboards keep their own topbar button. */
export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const { tr } = useLocale();
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      className={`theme-toggle${className ? ` ${className}` : ''}`}
      onClick={toggleTheme}
      aria-pressed={dark}
      aria-label={dark ? tr('الوضع الفاتح', 'Light mode') : tr('الوضع الداكن', 'Dark mode')}
      title={dark ? tr('الوضع الفاتح', 'Light mode') : tr('الوضع الداكن', 'Dark mode')}
    >
      {dark ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2" /><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" /></svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.2 14.6A8.4 8.4 0 0 1 9.4 3.8a8.4 8.4 0 1 0 10.8 10.8Z" /></svg>
      )}
    </button>
  );
}

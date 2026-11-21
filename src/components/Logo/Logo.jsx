import React from 'react';
import { Link } from 'react-router-dom';
import wordmark from '../../assets/images/solveit-logo-on-light.webp';
import wordmarkLight from '../../assets/images/solveit-logo-on-dark.webp';
import mark from '../../assets/images/solveit-mark-on-light.webp';
import markLight from '../../assets/images/solveit-mark-on-dark.webp';
import { PATHS } from '../../routes/paths';
import './Logo.css';

/**
 * SolveIt brand logo (transparent PNGs, cropped to the artwork).
 *  - variant "wordmark": the full logo with tagline (default)
 *  - variant "mark":     the "S" symbol only
 *  - tone "light":       light artwork for dark backgrounds (also reachable through variant="light")
 * Pass `to={null}` to render a plain, non-clickable image.
 */
const SOURCES = {
  wordmark: { default: wordmark, light: wordmarkLight },
  mark: { default: mark, light: markLight },
};

export function LogoImage({ variant = 'wordmark', tone = 'default', className = '', alt = 'SolveIt' }) {
  const source = SOURCES[variant] || SOURCES.wordmark;
  const classes = `brand__img brand__img--${variant}${className ? ` ${className}` : ''}`;
  if (tone === 'light') return <img className={classes} src={source.light} alt={alt} draggable="false" />;
  // Default tone follows the theme: deep-teal artwork on light, light artwork on dark.
  return (
    <>
      <img className={`${classes} brand__img--on-light`} src={source.default} alt={alt} draggable="false" />
      <img className={`${classes} brand__img--on-dark`} src={source.light} alt="" aria-hidden="true" draggable="false" />
    </>
  );
}

const Logo = ({ variant = 'wordmark', tone, className = '', to = PATHS.HOME, label = 'SolveIt - الرئيسية' }) => {
  const resolvedTone = tone || (variant === 'light' ? 'light' : 'default');
  const resolvedVariant = variant === 'mark' ? 'mark' : 'wordmark';
  const classes = `brand brand--${resolvedVariant}${resolvedTone === 'light' ? ' brand--light' : ''}${className ? ` ${className}` : ''}`;
  const image = <LogoImage variant={resolvedVariant} tone={resolvedTone} alt={to ? '' : 'SolveIt'} />;

  if (!to) return <span className={classes}>{image}</span>;
  return <Link to={to} className={classes} aria-label={label}>{image}</Link>;
};

export default Logo;

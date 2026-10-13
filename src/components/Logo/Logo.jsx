import React from 'react';
import { Link } from 'react-router-dom';
import wordmark from '../../assets/images/solveit-wordmark.png';
import wordmarkLight from '../../assets/images/solveit-wordmark-light.png';
import mark from '../../assets/images/solveit-mark.png';
import markLight from '../../assets/images/solveit-mark-light.png';
import { PATHS } from '../../routes/paths';
import './Logo.css';

/**
 * SolveIt brand logo (transparent PNGs, cropped to the artwork).
 *  - variant "wordmark": the full "Solve" lettering (default)
 *  - variant "mark":     the "S" symbol only
 *  - tone "light":       cream artwork for dark backgrounds (also reachable through variant="light")
 * Pass `to={null}` to render a plain, non-clickable image.
 */
const SOURCES = {
  wordmark: { default: wordmark, light: wordmarkLight },
  mark: { default: mark, light: markLight },
};

export function LogoImage({ variant = 'wordmark', tone = 'default', className = '', alt = 'SolveIt' }) {
  const source = SOURCES[variant] || SOURCES.wordmark;
  return <img className={`brand__img brand__img--${variant}${className ? ` ${className}` : ''}`} src={source[tone === 'light' ? 'light' : 'default']} alt={alt} draggable="false" />;
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

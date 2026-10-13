import React from 'react';
import wordmark from '../../../assets/images/solveit-wordmark.png';
import wordmarkLight from '../../../assets/images/solveit-wordmark-light.png';
import mark from '../../../assets/images/solveit-mark.png';
import markLight from '../../../assets/images/solveit-mark-light.png';

/**
 * Brand assets (transparent PNGs, already cropped to the artwork):
 * - `wordmark`: the full "Solve" lettering used in the expanded sidebar.
 * - `mark`: the "S" symbol used when the sidebar is collapsed.
 * The light variants are used on the dark theme.
 */
const SOURCES = {
  wordmark: { default: wordmark, light: wordmarkLight },
  mark: { default: mark, light: markLight },
};

export default function Logo({ variant = 'wordmark', className = '' }) {
  const source = SOURCES[variant] || SOURCES.wordmark;
  return (
    <span className={`ud-logo ud-logo--${variant}${className ? ` ${className}` : ''}`} role="img" aria-label="SolveIt">
      <img className="ud-logo__img ud-logo__img--default" src={source.default} alt="" draggable="false" />
      <img className="ud-logo__img ud-logo__img--light" src={source.light} alt="" draggable="false" />
    </span>
  );
}

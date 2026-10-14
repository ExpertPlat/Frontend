/**
 * Tiny registry so "Replay the walkthrough" opens the most relevant tour on screen (a page tour beats the global
 * switcher tour), and two tours never start on top of each other.
 */
const tours = new Map();
let active = null;

export function registerTour(id, priority, open) {
  tours.set(id, { priority, open });
  return () => tours.delete(id);
}

export function replayBestTour() {
  const best = [...tours.entries()].sort((a, b) => b[1].priority - a[1].priority)[0];
  best?.[1].open();
}

export function claimTour(id) {
  if (active && active !== id) return false;
  active = id;
  return true;
}

export function releaseTour(id) {
  if (active === id) active = null;
}

const SEEN = (id) => `solveit-tour-${id}-v2`;
export function tourSeen(id) {
  try { return localStorage.getItem(SEEN(id)) === '1'; } catch { return true; }
}
export function markTourSeen(id) {
  try { localStorage.setItem(SEEN(id), '1'); } catch { /* storage can be blocked */ }
}

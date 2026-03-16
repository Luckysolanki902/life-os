// @/lib/better.ts

/**
 * Logarithmic "better" percentage that grows fast early and slows down over time.
 * ~1% at 50 pts, ~3% at 150 pts, ~5% at 500 pts, ~10% at 5000 pts, ~15% at 50k pts.
 * Feels rewarding at low totals without inflating at high totals.
 */
export const getBetterPercentage = (points: number): number => {
  if (points <= 0) return 0;
  // log10 scale: 50pts→~1.7→~2%, 150→~2.2→~3%, 1000→3→~5%, 10000→4→~8%
  const raw = Math.log10(points) * 2.5 - 2;
  return Math.max(0, Math.round(raw * 10) / 10);
};
export type StampGridLayout = {
  cols: number;
  rows: number;
  gap: number;
  sizePx: number;
};

function gapForStampCount(stampCount: number): number {
  if (stampCount <= 10) return 6;
  if (stampCount <= 20) return 5;
  return 4;
}

function isEvenRowDistribution(
  stampCount: number,
  cols: number,
  rows: number,
): boolean {
  const lastRowCount = stampCount - cols * (rows - 1);
  return lastRowCount === cols;
}

/** Max 5 stamps per row on mobile (PRD §1.5). */
export function computeStampGridLayout(
  stampCount: number,
  innerWidth: number,
): StampGridLayout {
  if (stampCount <= 0) {
    return { cols: 1, rows: 1, gap: 6, sizePx: 32 };
  }

  const minPx = 12;
  const maxPx = 44;
  const maxRows = 6;
  const maxCols = 5;
  const gap = gapForStampCount(stampCount);

  const maxColsByWidth = Math.max(
    1,
    Math.min(maxCols, Math.floor((innerWidth + gap) / (minPx + gap))),
  );

  let best: StampGridLayout | null = null;
  let bestScore = -Infinity;
  const maxRowCandidates = Math.min(maxRows, stampCount);

  for (let rows = 1; rows <= maxRowCandidates; rows++) {
    const cols = Math.ceil(stampCount / rows);
    if (cols > stampCount) continue;
    if (cols > maxColsByWidth) continue;

    const sizeByWidth = (innerWidth - gap * (cols - 1)) / cols;
    if (sizeByWidth < minPx) continue;

    const sizePx = Math.min(maxPx, Math.floor(sizeByWidth));
    const evenRows = isEvenRowDistribution(stampCount, cols, rows);
    const dividesCleanly = stampCount % rows === 0;

    let score = sizePx;
    if (evenRows) score += 100;
    if (dividesCleanly) score += 25;
    if (stampCount <= 10 && rows === 2 && evenRows) score += 15;
    if (rows === 1 && stampCount > 12) score -= 30;

    if (score > bestScore) {
      bestScore = score;
      best = { cols, rows, gap, sizePx };
    }
  }

  if (best) return best;

  const cols = Math.min(stampCount, maxColsByWidth);
  const rows = Math.ceil(stampCount / cols);
  const sizePx = Math.min(
    maxPx,
    Math.max(minPx, Math.floor((innerWidth - gap * (cols - 1)) / cols)),
  );

  return { cols, rows, gap, sizePx };
}

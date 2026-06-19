export type StampGridLayout = {
  cols: number;
  rows: number;
  gap: number;
  sizePx: number;
};

type Orientation = "landscape" | "portrait";

function gapForStampCount(stampCount: number): number {
  if (stampCount <= 10) return 6;
  if (stampCount <= 20) return 5;
  return 4;
}

/** Every full row has `cols` slots; last row has `stampCount - cols * (rows - 1)`. */
function isEvenRowDistribution(
  stampCount: number,
  cols: number,
  rows: number,
): boolean {
  const lastRowCount = stampCount - cols * (rows - 1);
  return lastRowCount === cols;
}

/**
 * Picks columns from available width and row count so stamps are as large as
 * possible with the same number of items in each row (when mathematically possible).
 */
export function computeStampGridLayout(
  stampCount: number,
  innerWidth: number,
  orientation: Orientation,
): StampGridLayout {
  if (stampCount <= 0) {
    return { cols: 1, rows: 1, gap: 6, sizePx: 32 };
  }

  const minPx = 12;
  const maxPx = orientation === "landscape" ? 46 : 42;
  const maxRows = orientation === "landscape" ? 4 : 6;
  const gap = gapForStampCount(stampCount);

  const maxColsByWidth = Math.max(
    1,
    Math.floor((innerWidth + gap) / (minPx + gap)),
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

    // Mild preference for ~2 rows on small cards when still even
    if (stampCount <= 10 && rows === 2 && evenRows) score += 15;

    // Avoid a single very long row when many stamps fit better in multiple rows
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
    Math.max(
      minPx,
      Math.floor((innerWidth - gap * (cols - 1)) / cols),
    ),
  );

  return { cols, rows, gap, sizePx };
}

export function stampGridBlockHeight(layout: StampGridLayout): number {
  return layout.rows * layout.sizePx + (layout.rows - 1) * layout.gap;
}

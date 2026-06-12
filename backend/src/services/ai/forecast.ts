/**
 * Lightweight demand forecasting.
 *
 * Combines a least-squares linear trend with multiplicative weekly seasonality.
 * This is intentionally dependency-free (no Python/ML service required) and
 * gives sensible 7 / 30 / 90 / 365-day projections from a daily history. Swap
 * in Prophet/XGBoost behind the same interface when a data-science service is
 * available.
 */

export interface ForecastPoint {
  dayOffset: number; // 1 = tomorrow
  value: number;
}

export interface ForecastResult {
  horizon: number;
  daily: ForecastPoint[];
  total: number;
  dailyAverage: number;
  trendPerDay: number;
  confidence: number; // 0..1, based on history length & noise
}

/** Ordinary least squares slope/intercept for y over x = 0..n-1. */
function linearRegression(y: number[]): { slope: number; intercept: number } {
  const n = y.length;
  if (n === 0) return { slope: 0, intercept: 0 };
  const xMean = (n - 1) / 2;
  const yMean = y.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (y[i] - yMean);
    den += (i - xMean) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  return { slope, intercept: yMean - slope * xMean };
}

/** Multiplicative weekly seasonal factors (length 7), normalised to mean 1. */
function weeklySeasonality(history: number[]): number[] {
  const buckets: number[][] = Array.from({ length: 7 }, () => []);
  const offset = history.length % 7;
  history.forEach((v, i) => buckets[(i + offset) % 7].push(v));
  const overall = mean(history) || 1;
  const factors = buckets.map((b) => (b.length ? mean(b) / overall : 1));
  const fMean = mean(factors) || 1;
  return factors.map((f) => f / fMean);
}

function mean(a: number[]): number {
  return a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
}

function noiseRatio(history: number[]): number {
  const m = mean(history);
  if (m === 0) return 1;
  const variance = mean(history.map((v) => (v - m) ** 2));
  return Math.sqrt(variance) / m; // coefficient of variation
}

/**
 * Forecast `horizon` days of demand from a daily `history` (oldest first).
 */
export function forecastDemand(history: number[], horizon: number): ForecastResult {
  const clean = history.map((v) => (Number.isFinite(v) ? Math.max(0, v) : 0));
  const { slope, intercept } = linearRegression(clean);
  const season = weeklySeasonality(clean);
  const n = clean.length;

  const daily: ForecastPoint[] = [];
  for (let h = 1; h <= horizon; h++) {
    const trend = intercept + slope * (n - 1 + h);
    const seasonal = season[(n + h - 1) % 7];
    daily.push({ dayOffset: h, value: Math.max(0, trend * seasonal) });
  }

  const total = daily.reduce((a, p) => a + p.value, 0);
  // Confidence rises with more history, falls with noise.
  const lengthScore = Math.min(1, n / 60);
  const stabilityScore = Math.max(0, 1 - noiseRatio(clean));
  const confidence = Number((0.4 + 0.6 * (0.5 * lengthScore + 0.5 * stabilityScore)).toFixed(2));

  return {
    horizon,
    daily,
    total: Number(total.toFixed(1)),
    dailyAverage: Number((total / horizon).toFixed(2)),
    trendPerDay: Number(slope.toFixed(3)),
    confidence: Math.min(0.95, confidence),
  };
}

/** Convenience: standard horizons used across the dashboard. */
export function forecastStandardHorizons(history: number[]) {
  return {
    d7: forecastDemand(history, 7),
    d30: forecastDemand(history, 30),
    d90: forecastDemand(history, 90),
    d365: forecastDemand(history, 365),
  };
}

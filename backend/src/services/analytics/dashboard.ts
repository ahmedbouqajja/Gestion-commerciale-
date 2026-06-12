/**
 * Dashboard analytics — pure functions over sale records.
 * Computes the KPI cards, period comparisons, movers and automatic alerts
 * shown on the AI dashboard.
 */

export interface SaleRecord {
  date: Date;
  productSku: string;
  productName: string;
  storeCode: string;
  storeName: string;
  quantity: number;
  revenue: number;
}

export interface KpiCard {
  label: string;
  value: number;
  /** % change vs the comparison period (N-1), when available. */
  changePct?: number;
}

export interface Mover {
  sku: string;
  name: string;
  revenue: number;
  changePct: number;
}

export interface StorePerformance {
  code: string;
  name: string;
  revenue: number;
  changePct: number;
}

export interface Alert {
  level: "INFO" | "WARNING" | "CRITICAL";
  message: string;
}

export interface DashboardSummary {
  kpis: KpiCard[];
  topGrowers: Mover[];
  topDecliners: Mover[];
  topStores: StorePerformance[];
  strugglingStores: StorePerformance[];
  alerts: Alert[];
}

const DAY = 86_400_000;

function sum(records: SaleRecord[]): number {
  return records.reduce((a, r) => a + r.revenue, 0);
}

function within(records: SaleRecord[], from: Date, to: Date): SaleRecord[] {
  return records.filter((r) => r.date >= from && r.date < to);
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function groupBy<T>(records: SaleRecord[], key: (r: SaleRecord) => string, meta: (r: SaleRecord) => T) {
  const map = new Map<string, { revenue: number; meta: T }>();
  for (const r of records) {
    const k = key(r);
    const entry = map.get(k) ?? { revenue: 0, meta: meta(r) };
    entry.revenue += r.revenue;
    map.set(k, entry);
  }
  return map;
}

/**
 * Build the full dashboard summary as of `asOf` (defaults to now).
 */
export function buildDashboard(records: SaleRecord[], asOf: Date = new Date()): DashboardSummary {
  const startOfDay = new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), asOf.getUTCDate()));
  const weekStart = new Date(startOfDay.getTime() - 7 * DAY);
  const monthStart = new Date(startOfDay.getTime() - 30 * DAY);
  const yearAgoMonthStart = new Date(monthStart.getTime() - 365 * DAY);
  const yearAgoNow = new Date(startOfDay.getTime() - 365 * DAY);

  const dayRev = sum(within(records, startOfDay, new Date(startOfDay.getTime() + DAY)));
  const weekRev = sum(within(records, weekStart, startOfDay));
  const monthRev = sum(within(records, monthStart, startOfDay));

  // Year-on-year comparison for the trailing 30 days.
  const monthRevN1 = sum(within(records, yearAgoMonthStart, yearAgoNow));

  const kpis: KpiCard[] = [
    { label: "CA du jour", value: round(dayRev) },
    { label: "CA 7 jours", value: round(weekRev) },
    { label: "CA 30 jours", value: round(monthRev), changePct: pctChange(monthRev, monthRevN1) },
    { label: "Évolution vs N-1", value: round(monthRev - monthRevN1), changePct: pctChange(monthRev, monthRevN1) },
  ];

  // Movers: trailing 30 days vs the 30 days before that.
  const prevMonthStart = new Date(monthStart.getTime() - 30 * DAY);
  const current = within(records, monthStart, startOfDay);
  const previous = within(records, prevMonthStart, monthStart);

  const movers = buildMovers(current, previous);
  const stores = buildStores(current, previous);

  const alerts = buildAlerts(movers, stores, dayRev, weekRev);

  return {
    kpis,
    topGrowers: movers.filter((m) => m.changePct > 0).slice(0, 5),
    topDecliners: movers.filter((m) => m.changePct < 0).reverse().slice(0, 5),
    topStores: stores.slice(0, 5),
    strugglingStores: stores.filter((s) => s.changePct < 0).reverse().slice(0, 5),
    alerts,
  };
}

function buildMovers(current: SaleRecord[], previous: SaleRecord[]): Mover[] {
  const cur = groupBy(current, (r) => r.productSku, (r) => r.productName);
  const prev = groupBy(previous, (r) => r.productSku, (r) => r.productName);
  const movers: Mover[] = [];
  for (const [sku, { revenue, meta }] of cur) {
    movers.push({ sku, name: meta, revenue: round(revenue), changePct: pctChange(revenue, prev.get(sku)?.revenue ?? 0) });
  }
  return movers.sort((a, b) => b.changePct - a.changePct);
}

function buildStores(current: SaleRecord[], previous: SaleRecord[]): StorePerformance[] {
  const cur = groupBy(current, (r) => r.storeCode, (r) => r.storeName);
  const prev = groupBy(previous, (r) => r.storeCode, (r) => r.storeName);
  const stores: StorePerformance[] = [];
  for (const [code, { revenue, meta }] of cur) {
    stores.push({ code, name: meta, revenue: round(revenue), changePct: pctChange(revenue, prev.get(code)?.revenue ?? 0) });
  }
  return stores.sort((a, b) => b.revenue - a.revenue);
}

function buildAlerts(movers: Mover[], stores: StorePerformance[], dayRev: number, weekRev: number): Alert[] {
  const alerts: Alert[] = [];
  const crashing = movers.filter((m) => m.changePct <= -30);
  for (const m of crashing.slice(0, 3)) {
    alerts.push({ level: "WARNING", message: `Chute des ventes de ${m.name} (${m.changePct}%).` });
  }
  const strugglingStore = stores.filter((s) => s.changePct <= -20)[0];
  if (strugglingStore) {
    alerts.push({ level: "CRITICAL", message: `Magasin ${strugglingStore.name} en difficulté (${strugglingStore.changePct}%).` });
  }
  if (weekRev > 0 && dayRev < (weekRev / 7) * 0.5) {
    alerts.push({ level: "WARNING", message: "CA du jour nettement sous la moyenne hebdomadaire." });
  }
  if (alerts.length === 0) alerts.push({ level: "INFO", message: "Aucune anomalie détectée. Activité nominale." });
  return alerts;
}

function round(n: number): number {
  return Math.round(n);
}

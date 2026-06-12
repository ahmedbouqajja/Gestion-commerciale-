import { buildDashboard, type DashboardSummary, type SaleRecord } from "./analytics/dashboard.js";
import { getCalendarEvents } from "./ai/calendar.js";
import { getForecast } from "./ai/weather.js";
import { generateRecommendations } from "./ai/recommendationEngine.js";
import { forecastStandardHorizons } from "./ai/forecast.js";
import { ask, type AssistantReply } from "./ai/assistant.js";
import { buildProductSnapshots, buildSaleRecords, STORE_SEEDS } from "./sampleData.js";
import { getDbProductSnapshots, getDbSaleRecords, listDbStores, tenantHasSales } from "./dbSource.js";
import { hasDatabase } from "../config/env.js";
import { keyedTTLCache } from "../lib/cache.js";
import type { ProductSnapshot, Recommendation, WeatherForecast } from "../types/domain.js";

/**
 * Aggregates the AI/analytics pipeline into ready-to-serve payloads for the API.
 *
 * Source selection per tenant:
 *  - PostgreSQL (imported / seeded data) when a database is configured AND the
 *    tenant has sales — so anything imported shows up immediately;
 *  - the synthetic demo dataset otherwise (fresh clone, demo login, empty DB).
 */

// Casablanca by default; could be derived per store.
const DEFAULT_COORDS = { lat: 33.57, lon: -7.59 };
const HISTORY_DAYS = 90;
const DASHBOARD_DAYS = 400; // wide enough for the year-on-year comparison

// Caches keyed per tenant + calendar day.
const sourceCache = keyedTTLCache<"db" | "demo">(5 * 60_000);
const dashboardCache = keyedTTLCache<DashboardSummary>(5 * 60_000);
const recommendationsCache = keyedTTLCache<{ recommendations: Recommendation[]; weather: WeatherForecast[] }>(5 * 60_000);

const dayKey = (d: Date) => d.toISOString().slice(0, 10);
const cacheKey = (tenantId: string | undefined, asOf: Date) => `${tenantId ?? "demo"}:${dayKey(asOf)}`;

async function resolveSource(tenantId: string | undefined, asOf: Date): Promise<"db" | "demo"> {
  if (!hasDatabase || !tenantId) return "demo";
  return sourceCache.get(cacheKey(tenantId, asOf), async () => ((await tenantHasSales(tenantId)) ? "db" : "demo"));
}

async function loadSaleRecords(tenantId: string | undefined, days: number, asOf: Date): Promise<SaleRecord[]> {
  return (await resolveSource(tenantId, asOf)) === "db"
    ? getDbSaleRecords(tenantId!, days, asOf)
    : buildSaleRecords(Math.min(days, 90), asOf);
}

async function loadSnapshots(tenantId: string | undefined, asOf: Date): Promise<ProductSnapshot[]> {
  return (await resolveSource(tenantId, asOf)) === "db"
    ? getDbProductSnapshots(tenantId!, HISTORY_DAYS, asOf)
    : buildProductSnapshots(HISTORY_DAYS);
}

export async function getDashboard(tenantId?: string, asOf = new Date()): Promise<DashboardSummary> {
  return dashboardCache.get(cacheKey(tenantId, asOf), async () =>
    buildDashboard(await loadSaleRecords(tenantId, DASHBOARD_DAYS, asOf), asOf),
  );
}

export async function getContext(asOf = new Date()) {
  const weather = await getForecast(DEFAULT_COORDS.lat, DEFAULT_COORDS.lon, 5);
  const events = getCalendarEvents(asOf, 30);
  return { weather, events };
}

export async function getRecommendations(
  tenantId?: string,
  asOf = new Date(),
): Promise<{ recommendations: Recommendation[]; weather: WeatherForecast[] }> {
  return recommendationsCache.get(cacheKey(tenantId, asOf), async () => {
    const products = await loadSnapshots(tenantId, asOf);
    const { weather, events } = await getContext(asOf);
    return { recommendations: generateRecommendations(products, { weather, events }), weather };
  });
}

export async function getProductForecast(sku: string, tenantId?: string, asOf = new Date()) {
  const products = await loadSnapshots(tenantId, asOf);
  const product = products.find((p) => p.sku === sku);
  if (!product) return null;
  return { sku, name: product.name, ...forecastStandardHorizons(product.salesHistory) };
}

export async function listProducts(tenantId?: string, asOf = new Date()) {
  const snapshots = await loadSnapshots(tenantId, asOf);
  return snapshots.map((s) => {
    const recentAvg = s.salesHistory.slice(-7).reduce((a, b) => a + b, 0) / 7;
    return {
      sku: s.sku,
      name: s.name,
      category: s.category,
      unitPrice: s.unitPrice,
      seasonal: s.seasonal,
      stock: s.stock,
      reorderPoint: s.reorderPoint,
      daysOfCover: recentAvg ? Number((s.stock / recentAvg).toFixed(1)) : null,
    };
  });
}

export async function listStores(tenantId?: string, asOf = new Date()) {
  return (await resolveSource(tenantId, asOf)) === "db" ? listDbStores(tenantId!) : STORE_SEEDS;
}

export async function askAssistant(question: string, tenantId?: string, asOf = new Date()): Promise<AssistantReply> {
  const [dashboard, { recommendations }] = await Promise.all([getDashboard(tenantId, asOf), getRecommendations(tenantId, asOf)]);
  return ask(question, { dashboard, recommendations });
}

/** Invalidate cached aggregates for a tenant (called after a data import). */
export function invalidateTenant(tenantId: string | undefined, asOf = new Date()) {
  // Day-keyed caches; clearing all is simplest and cheap at this scale.
  void tenantId;
  void asOf;
  sourceCache.clear();
  dashboardCache.clear();
  recommendationsCache.clear();
}

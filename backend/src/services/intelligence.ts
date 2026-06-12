import { buildDashboard, type DashboardSummary } from "./analytics/dashboard.js";
import { getCalendarEvents } from "./ai/calendar.js";
import { getForecast } from "./ai/weather.js";
import { generateRecommendations } from "./ai/recommendationEngine.js";
import { forecastStandardHorizons } from "./ai/forecast.js";
import { ask, type AssistantReply } from "./ai/assistant.js";
import { buildProductSnapshots, buildSaleRecords, PRODUCT_SEEDS, STORE_SEEDS } from "./sampleData.js";
import { keyedTTLCache } from "../lib/cache.js";
import type { Recommendation, WeatherForecast } from "../types/domain.js";

/**
 * Aggregates the AI/analytics pipeline into ready-to-serve payloads for the API.
 *
 * Currently sourced from the synthetic demo dataset so the platform is fully
 * explorable without an import. Replace the `buildSaleRecords` /
 * `buildProductSnapshots` calls with per-tenant Prisma queries (filtered by
 * tenantId) to go live — the rest of the pipeline is unchanged.
 */

// Casablanca by default; could be derived per store.
const DEFAULT_COORDS = { lat: 33.57, lon: -7.59 };

// Memoise the heavy pipeline per calendar day (the synthetic dataset only
// changes day to day). Swap for a per-tenant key once data is DB-backed.
const dashboardCache = keyedTTLCache<DashboardSummary>(5 * 60_000);
const recommendationsCache = keyedTTLCache<{ recommendations: Recommendation[]; weather: WeatherForecast[] }>(5 * 60_000);

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

export async function getDashboard(asOf = new Date()): Promise<DashboardSummary> {
  return dashboardCache.get(dayKey(asOf), async () => buildDashboard(buildSaleRecords(90, asOf), asOf));
}

export async function getContext(asOf = new Date()) {
  const weather = await getForecast(DEFAULT_COORDS.lat, DEFAULT_COORDS.lon, 5);
  const events = getCalendarEvents(asOf, 30);
  return { weather, events };
}

export async function getRecommendations(asOf = new Date()): Promise<{
  recommendations: Recommendation[];
  weather: WeatherForecast[];
}> {
  return recommendationsCache.get(dayKey(asOf), async () => {
    const products = buildProductSnapshots(90);
    const { weather, events } = await getContext(asOf);
    return { recommendations: generateRecommendations(products, { weather, events }), weather };
  });
}

export function getProductForecast(sku: string) {
  const products = buildProductSnapshots(90);
  const product = products.find((p) => p.sku === sku);
  if (!product) return null;
  return { sku, name: product.name, ...forecastStandardHorizons(product.salesHistory) };
}

export function listProducts() {
  const snapshots = buildProductSnapshots(90);
  return PRODUCT_SEEDS.map((s) => {
    const snap = snapshots.find((x) => x.sku === s.sku)!;
    const recentAvg = snap.salesHistory.slice(-7).reduce((a, b) => a + b, 0) / 7;
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

export function listStores() {
  return STORE_SEEDS;
}

export async function askAssistant(question: string, asOf = new Date()): Promise<AssistantReply> {
  const [dashboard, { recommendations }] = await Promise.all([getDashboard(asOf), getRecommendations(asOf)]);
  return ask(question, { dashboard, recommendations });
}

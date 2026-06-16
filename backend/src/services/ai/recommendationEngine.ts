import type {
  CalendarEvent,
  Driver,
  ProductSnapshot,
  Recommendation,
  RecommendedAction,
  WeatherForecast,
  WeatherTag,
} from "../../types/domain.js";
import { WEATHER_AFFINITY } from "./weather.js";

/**
 * The "Conseiller Commercial Intelligent".
 *
 * A transparent, rule-based recommendation engine that fuses five demand
 * drivers — sales trend, weather, marketing calendar, seasonality and
 * stock-out risk — into ranked, actionable offer recommendations with an
 * estimated uplift and a confidence score. It runs with zero external
 * dependencies; Claude can optionally rewrite the rationale (see assistant).
 */

export interface EngineContext {
  weather: WeatherForecast[];
  events: CalendarEvent[];
}

interface TrendStat {
  recentAvg: number;
  priorAvg: number;
  growthPct: number; // recent vs prior, %
  daysOfCover: number; // stock / recentAvg
}

function avg(a: number[]): number {
  return a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
}

function computeTrend(p: ProductSnapshot): TrendStat {
  const h = p.salesHistory;
  const window = Math.min(7, Math.floor(h.length / 2) || 1);
  const recent = h.slice(-window);
  const prior = h.slice(-window * 2, -window);
  const recentAvg = avg(recent);
  const priorAvg = avg(prior);
  const growthPct = priorAvg === 0 ? (recentAvg > 0 ? 100 : 0) : ((recentAvg - priorAvg) / priorAvg) * 100;
  const daysOfCover = recentAvg === 0 ? Infinity : p.stock / recentAvg;
  return { recentAvg, priorAvg, growthPct: Number(growthPct.toFixed(1)), daysOfCover: Number(daysOfCover.toFixed(1)) };
}

/** Dominant upcoming weather tags across the forecast horizon. */
function dominantWeatherTags(weather: WeatherForecast[]): WeatherTag[] {
  const counts = new Map<WeatherTag, number>();
  for (const day of weather) for (const t of day.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
}

function weatherMatch(p: ProductSnapshot, tags: WeatherTag[]): { matched: boolean; tag?: WeatherTag } {
  for (const t of tags) {
    if (t === "MILD") continue;
    if (p.weatherTags.includes(t)) return { matched: true, tag: t };
    if (WEATHER_AFFINITY[t]?.includes(p.category)) return { matched: true, tag: t };
  }
  return { matched: false };
}

function calendarMatch(p: ProductSnapshot, events: CalendarEvent[]): CalendarEvent | undefined {
  return events.find((e) => e.productKinds.includes(p.category));
}

const WEATHER_LABELS: Record<WeatherTag, string> = {
  HEATWAVE: "canicule annoncée",
  HEAT: "hausse des températures prévue",
  COLD: "vague de froid prévue",
  RAIN: "épisode pluvieux annoncé",
  MILD: "météo stable",
};

/** Analyse a single product and, if warranted, emit a recommendation. */
export function analyzeProduct(p: ProductSnapshot, ctx: EngineContext): Recommendation | null {
  const trend = computeTrend(p);
  const wTags = dominantWeatherTags(ctx.weather);
  const wMatch = weatherMatch(p, wTags);
  const cEvent = calendarMatch(p, ctx.events);

  const drivers: Driver[] = [];
  const actions: RecommendedAction[] = [];
  const reasons: string[] = [];
  let uplift = 0;
  let confidence = 0.4;
  let revenueAtRisk: number | undefined;
  let wasteAtRisk: number | undefined;

  // ── Stock-out risk (highest priority — protects revenue) ──
  const RESTOCK_HORIZON_DAYS = 7; // assumed supplier lead time
  const stockoutRisk = trend.daysOfCover <= 5 && trend.recentAvg > 0;
  if (stockoutRisk) {
    drivers.push("STOCKOUT");
    // Demand we cannot serve before a restock = threatened revenue.
    const unmetUnits = Math.max(0, trend.recentAvg * RESTOCK_HORIZON_DAYS - p.stock);
    revenueAtRisk = Math.round(unmetUnits * p.unitPrice);
    reasons.push(
      `Couverture de stock estimée à ${trend.daysOfCover} jour(s) au rythme de vente actuel (${trend.recentAvg.toFixed(0)} u/j). CA menacé sur 7 j : ~${revenueAtRisk.toLocaleString("fr-MA")} MAD.`,
    );
    actions.push({ type: "SUPPLIER_ORDER", label: "Passer une commande fournisseur en urgence" });
    actions.push({ type: "TRANSFER", label: "Transfert depuis un client excédentaire" });
    confidence += 0.25;
  }

  // ── Expiry / DLC risk (perishable overstock — prevents waste) ──
  // Only when there is no stock-out risk: an overstocked perishable batch may
  // reach its date limite (DLC) before it can be sold through. Critical for a
  // dairy distributor where most SKUs are short-dated.
  const EXPIRY_HORIZON_DAYS = 7; // react when a batch expires within a week
  let expiryRisk = false;
  if (
    !stockoutRisk &&
    p.nearestExpiryDays !== undefined &&
    p.nearestExpiryDays >= 0 &&
    p.nearestExpiryDays <= EXPIRY_HORIZON_DAYS &&
    trend.recentAvg > 0
  ) {
    // Units that cannot realistically sell through before the batch expires.
    const sellable = trend.recentAvg * p.nearestExpiryDays;
    const expiringUnits = Math.max(0, Math.round(p.stock - sellable));
    if (expiringUnits > 0) {
      expiryRisk = true;
      drivers.push("EXPIRY");
      wasteAtRisk = Math.round(expiringUnits * p.costPrice);
      reasons.push(
        `Date limite proche (${p.nearestExpiryDays} j). Au rythme actuel (${trend.recentAvg.toFixed(0)} u/j), ~${expiringUnits.toLocaleString("fr-MA")} u risquent de périmer — perte estimée ~${wasteAtRisk.toLocaleString("fr-MA")} MAD.`,
      );
      // Deeper discount the closer the DLC, to accelerate sell-through.
      const clearancePct = p.nearestExpiryDays <= 2 ? 30 : p.nearestExpiryDays <= 4 ? 20 : 15;
      actions.push({ type: "CLEARANCE", label: `Déstockage -${clearancePct}% (DLC courte)`, value: clearancePct });
      actions.push({ type: "TRANSFER", label: "Transfert vers un client à forte rotation" });
      actions.push({ type: "BUNDLE", label: "Offre groupée pour écouler le lot" });
      uplift += Math.round(clearancePct * 0.8);
      confidence += 0.3;
    }
  }

  // ── Weather-driven demand ──
  if (wMatch.matched && wMatch.tag) {
    drivers.push("WEATHER");
    reasons.push(`Météo : ${WEATHER_LABELS[wMatch.tag]} — catégorie historiquement porteuse sur cette période.`);
    const severity = wMatch.tag === "HEATWAVE" ? 12 : 8;
    uplift += severity;
    confidence += 0.15;
  }

  // ── Calendar / marketing events ──
  if (cEvent) {
    drivers.push("CALENDAR");
    const when = cEvent.startsInDays === 0 ? "en cours" : `dans ${cEvent.startsInDays} jours`;
    reasons.push(`Événement « ${cEvent.name} » ${when} : forte affinité avec la catégorie.`);
    uplift += Math.round(15 * cEvent.weight);
    confidence += 0.15;
  }

  // ── Sales trend ──
  if (trend.growthPct >= 15) {
    drivers.push("TREND");
    reasons.push(`Ventes en croissance de ${trend.growthPct}% vs période précédente.`);
    uplift += Math.min(10, Math.round(trend.growthPct / 4));
    confidence += 0.1;
  } else if (trend.growthPct <= -15) {
    drivers.push("TREND");
    reasons.push(`Ventes en recul de ${Math.abs(trend.growthPct)}% : produit à relancer.`);
    // A discount can recover part of the lost volume.
    uplift += 8;
    confidence += 0.05;
  }

  // ── Seasonality ──
  if (p.seasonal && (cEvent || wMatch.matched)) {
    drivers.push("SEASON");
    reasons.push("Produit saisonnier entrant dans sa fenêtre de consommation.");
    uplift += 5;
  }

  // Nothing actionable → no recommendation (keeps the feed signal-rich).
  if (drivers.length === 0) return null;

  // ── Derive commercial actions from a positive-demand signal ──
  const positiveDemand = wMatch.matched || !!cEvent || trend.growthPct >= 15;
  if (positiveDemand && !stockoutRisk && !expiryRisk) {
    const discount = trend.growthPct <= -15 ? 15 : 10;
    actions.unshift({ type: "DISCOUNT", label: `Promotion -${discount}%`, value: discount });
    actions.push({ type: "ENDCAP", label: "Mise en avant tête de gondole" });
    if (p.category === "DAIRY" || p.category === "FRESH" || p.category === "BEVERAGE") {
      actions.push({ type: "TASTING", label: "Animation dégustation" });
    }
    actions.push({ type: "STOCK_UP", label: "Augmentation du stock +20%", value: 20 });
    // Discount-driven elasticity uplift.
    uplift += Math.round(discount * 0.8);
  }
  if (trend.growthPct <= -15 && !positiveDemand && !stockoutRisk && !expiryRisk) {
    actions.push({ type: "DISCOUNT", label: "Promotion -15% pour relancer les ventes", value: 15 });
    actions.push({ type: "BUNDLE", label: "Offre groupée avec un produit complémentaire" });
  }

  uplift = Math.min(uplift, 60); // sanity cap
  confidence = Math.min(0.95, Number(confidence.toFixed(2)));

  const title = stockoutRisk
    ? `Risque de rupture — ${p.name}`
    : expiryRisk
      ? `Risque de péremption — ${p.name}`
      : `Opportunité commerciale — ${p.name}`;

  return {
    sku: p.sku,
    productName: p.name,
    title,
    rationale: reasons.join(" "),
    actions,
    estimatedUplift: uplift,
    confidence,
    drivers: [...new Set(drivers)],
    revenueAtRisk,
    wasteAtRisk,
  };
}

/**
 * Generate ranked recommendations across a product catalogue.
 * Sorted by business impact: stock-out risks first, then highest uplift.
 */
export function generateRecommendations(products: ProductSnapshot[], ctx: EngineContext): Recommendation[] {
  const recs = products
    .map((p) => analyzeProduct(p, ctx))
    .filter((r): r is Recommendation => r !== null);

  // Urgent = revenue-protecting (stock-out) or waste-preventing (expiry).
  const isUrgent = (r: Recommendation) => r.drivers.includes("STOCKOUT") || r.drivers.includes("EXPIRY");
  const amountAtRisk = (r: Recommendation) => Math.max(r.revenueAtRisk ?? 0, r.wasteAtRisk ?? 0);

  return recs.sort((a, b) => {
    const aUrgent = isUrgent(a) ? 1 : 0;
    const bUrgent = isUrgent(b) ? 1 : 0;
    if (aUrgent !== bUrgent) return bUrgent - aUrgent;
    // Among urgent risks, the most money at risk (lost sales or waste) comes first.
    if (aUrgent && bUrgent) return amountAtRisk(b) - amountAtRisk(a);
    return b.estimatedUplift * b.confidence - a.estimatedUplift * a.confidence;
  });
}

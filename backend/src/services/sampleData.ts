import type { ProductSnapshot, WeatherTag } from "../types/domain.js";
import type { SaleRecord } from "./analytics/dashboard.js";

/**
 * Deterministic synthetic dataset for a **distributeur de produits laitiers**
 * (milk & dairy derivatives supplying retail stores in Morocco). Used by the
 * `demo` script and the Prisma seed so the platform is explorable without any
 * real import.
 *
 * Two domain specifics drive the dairy model:
 *  - `shelfLifeDays` / `nearestExpiryDays` — short DLC, the core perishability
 *    constraint (waste prevention);
 *  - `returnRate` — share of delivered goods credited back (invendus / casse /
 *    DLC dépassée), the distributor's key margin-erosion KPI.
 *
 * "Stores" are the distributor's **clients** (supérettes, épiceries, cafés-
 * laiteries, grandes surfaces), each attached to a sales rep and a delivery
 * route (tournée).
 */

interface ProductSeed {
  sku: string;
  name: string;
  category: string;
  unitPrice: number;
  costPrice: number;
  seasonal: boolean;
  weatherTags: WeatherTag[];
  /** base daily units, used to synthesise history with trend & noise */
  base: number;
  trend: number; // units/day drift
  stock: number;
  reorderPoint: number;
  /** Shelf life of a fresh batch (DLC), in days. */
  shelfLifeDays: number;
  /** Days until the oldest on-hand batch expires. */
  nearestExpiryDays: number;
  /** Fraction of delivered units returned (invendus / casse / DLC). */
  returnRate: number;
}

export const PRODUCT_SEEDS: ProductSeed[] = [
  // Longue conservation
  { sku: "LAIT-UHT-1L", name: "Lait UHT demi-écrémé 1 L", category: "DAIRY", unitPrice: 7, costPrice: 5.2, seasonal: false, weatherTags: ["HEAT"], base: 620, trend: 1.2, stock: 24000, reorderPoint: 9000, shelfLifeDays: 120, nearestExpiryDays: 70, returnRate: 0.01 },
  { sku: "FROMAGE-PORT-X8", name: "Fromage fondu portions x8", category: "DAIRY", unitPrice: 13, costPrice: 9, seasonal: false, weatherTags: [], base: 170, trend: 0.2, stock: 6500, reorderPoint: 2200, shelfLifeDays: 90, nearestExpiryDays: 50, returnRate: 0.02 },
  { sku: "BEURRE-200", name: "Beurre plaquette 200 g", category: "DAIRY", unitPrice: 14, costPrice: 10, seasonal: false, weatherTags: [], base: 150, trend: 0.2, stock: 5000, reorderPoint: 1800, shelfLifeDays: 60, nearestExpiryDays: 38, returnRate: 0.02 },
  // Conservation moyenne
  { sku: "YAOURT-NAT-X4", name: "Yaourt nature x4", category: "DAIRY", unitPrice: 9, costPrice: 6.2, seasonal: false, weatherTags: ["HEAT"], base: 400, trend: 0.6, stock: 9500, reorderPoint: 3500, shelfLifeDays: 30, nearestExpiryDays: 14, returnRate: 0.03 },
  { sku: "YAOURT-FRUIT-X4", name: "Yaourt aux fruits x4", category: "DAIRY", unitPrice: 11, costPrice: 7.5, seasonal: true, weatherTags: ["HEAT"], base: 320, trend: 0.9, stock: 8000, reorderPoint: 3000, shelfLifeDays: 28, nearestExpiryDays: 11, returnRate: 0.04 },
  { sku: "YAOURT-BOIRE-1L", name: "Yaourt à boire 1 L", category: "DAIRY", unitPrice: 10, costPrice: 6.5, seasonal: true, weatherTags: ["HEAT"], base: 180, trend: 0.7, stock: 4200, reorderPoint: 1600, shelfLifeDays: 25, nearestExpiryDays: 9, returnRate: 0.04 },
  { sku: "PETIT-SUISSE-X6", name: "Petit-suisse x6", category: "DAIRY", unitPrice: 10, costPrice: 6.8, seasonal: true, weatherTags: ["HEAT"], base: 140, trend: 0.5, stock: 3600, reorderPoint: 1300, shelfLifeDays: 24, nearestExpiryDays: 9, returnRate: 0.05 },
  { sku: "CREME-200", name: "Crème fraîche 20 cl", category: "DAIRY", unitPrice: 9, costPrice: 6, seasonal: false, weatherTags: [], base: 95, trend: 0.1, stock: 2000, reorderPoint: 800, shelfLifeDays: 21, nearestExpiryDays: 10, returnRate: 0.03 },
  // Frais court (DLC critique)
  { sku: "LAIT-FRAIS-1L", name: "Lait frais pasteurisé 1 L", category: "DAIRY", unitPrice: 8, costPrice: 6, seasonal: false, weatherTags: ["HEAT"], base: 430, trend: 0.8, stock: 1500, reorderPoint: 2500, shelfLifeDays: 7, nearestExpiryDays: 5, returnRate: 0.04 },
  { sku: "JBEN-250", name: "Fromage frais Jben 250 g", category: "DAIRY", unitPrice: 12, costPrice: 8, seasonal: false, weatherTags: [], base: 110, trend: 0.3, stock: 1200, reorderPoint: 500, shelfLifeDays: 10, nearestExpiryDays: 4, returnRate: 0.05 },
  { sku: "RAIB-180", name: "Raïb 180 g", category: "DAIRY", unitPrice: 3.5, costPrice: 2.3, seasonal: false, weatherTags: ["HEAT"], base: 150, trend: 0.2, stock: 1500, reorderPoint: 600, shelfLifeDays: 4, nearestExpiryDays: 3, returnRate: 0.07 },
  { sku: "LBEN-1L", name: "Lben (lait fermenté) 1 L", category: "DAIRY", unitPrice: 6, costPrice: 4, seasonal: false, weatherTags: ["HEAT"], base: 130, trend: -0.6, stock: 1300, reorderPoint: 500, shelfLifeDays: 5, nearestExpiryDays: 3, returnRate: 0.06 },
];

/** Clients (points de vente) livrés par le distributeur, rattachés à une tournée. */
export const STORE_SEEDS = [
  { code: "CASA-SUP01", name: "Supérette Al Baraka", banner: "Supérette", city: "Casablanca", region: "Casablanca-Settat", salesRep: "Youssef El Amrani", route: "Casa-Centre", deliveryDays: ["Lun", "Mer", "Ven"] },
  { code: "CASA-EPI02", name: "Épicerie Ould Hammou", banner: "Épicerie", city: "Casablanca", region: "Casablanca-Settat", salesRep: "Youssef El Amrani", route: "Casa-Centre", deliveryDays: ["Mar", "Jeu", "Sam"] },
  { code: "RABAT-GMS01", name: "Agdal Market", banner: "Grande surface", city: "Rabat", region: "Rabat-Salé-Kénitra", salesRep: "Salma Bennani", route: "Rabat-Nord", deliveryDays: ["Lun", "Jeu"] },
  { code: "RABAT-CAFE02", name: "Café-Laiterie Riad", banner: "Café-Laiterie", city: "Salé", region: "Rabat-Salé-Kénitra", salesRep: "Salma Bennani", route: "Rabat-Nord", deliveryDays: ["Mar", "Ven"] },
  { code: "MARRA-SUP01", name: "Supérette Gueliz Frais", banner: "Supérette", city: "Marrakech", region: "Marrakech-Safi", salesRep: "Hicham Toumi", route: "Marrakech", deliveryDays: ["Mer", "Sam"] },
  { code: "TANG-EPI01", name: "Épicerie Détroit", banner: "Épicerie", city: "Tanger", region: "Tanger-Tétouan-Al Hoceïma", salesRep: "Nadia Cherkaoui", route: "Nord", deliveryDays: ["Lun", "Jeu"] },
];

/** Per-client volume weighting (index-aligned with STORE_SEEDS). */
export const STORE_FACTORS = [1, 0.85, 0.7, 0.55, 0.5, 0.4];

/** Stable pseudo-random in [0,1) from an integer seed. */
function rng(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** Generate `days` of daily units for a product (oldest first). */
export function buildHistory(seed: ProductSeed, days = 90, storeFactor = 1): number[] {
  const out: number[] = [];
  for (let i = 0; i < days; i++) {
    const weekday = (i % 7); // weekend uplift
    const weekendBoost = weekday === 5 || weekday === 6 ? 1.25 : 1;
    const noise = 0.8 + rng(i + seed.base) * 0.4;
    const value = (seed.base + seed.trend * i) * storeFactor * weekendBoost * noise;
    out.push(Math.max(0, Math.round(value)));
  }
  return out;
}

/** Catalogue snapshots for the recommendation engine. */
export function buildProductSnapshots(days = 90): ProductSnapshot[] {
  return PRODUCT_SEEDS.map((s) => ({
    sku: s.sku,
    name: s.name,
    category: s.category,
    unitPrice: s.unitPrice,
    costPrice: s.costPrice,
    seasonal: s.seasonal,
    weatherTags: s.weatherTags,
    salesHistory: buildHistory(s, days),
    stock: s.stock,
    reorderPoint: s.reorderPoint,
    shelfLifeDays: s.shelfLifeDays,
    nearestExpiryDays: s.nearestExpiryDays,
  }));
}

/** Flat sale records across clients for the dashboard analytics. */
export function buildSaleRecords(days = 90, asOf: Date = new Date()): SaleRecord[] {
  const records: SaleRecord[] = [];
  // Include today: the last generated day lands on `asOf`.
  const start = new Date(asOf.getTime() - (days - 1) * 86_400_000);
  STORE_SEEDS.forEach((store, si) => {
    const storeFactor = STORE_FACTORS[si] ?? 0.5;
    PRODUCT_SEEDS.forEach((p) => {
      const history = buildHistory(p, days, storeFactor);
      history.forEach((qty, i) => {
        const date = new Date(start.getTime() + i * 86_400_000);
        const returnedQuantity = Math.round(qty * p.returnRate);
        records.push({
          date,
          productSku: p.sku,
          productName: p.name,
          storeCode: store.code,
          storeName: store.name,
          quantity: qty,
          revenue: Number((qty * p.unitPrice).toFixed(2)),
          returnedQuantity,
          returnedRevenue: Number((returnedQuantity * p.unitPrice).toFixed(2)),
        });
      });
    });
  });

  // Year-ago window (≈ -365 d) so "Évolution vs N-1" is meaningful instead of
  // always +100%. Generated at ~88% of the current level → realistic YoY (~+13%).
  const yearAgoStart = new Date(asOf.getTime() - 396 * 86_400_000);
  STORE_SEEDS.forEach((store, si) => {
    const storeFactor = STORE_FACTORS[si] ?? 0.5;
    PRODUCT_SEEDS.forEach((p) => {
      const level = (p.base + p.trend * (days - 4)) * 0.88;
      for (let i = 0; i <= 31; i++) {
        const date = new Date(yearAgoStart.getTime() + i * 86_400_000);
        const weekendBoost = date.getUTCDay() === 5 || date.getUTCDay() === 6 ? 1.25 : 1;
        const noise = 0.85 + rng(i + p.base + si) * 0.3;
        const qty = Math.max(0, Math.round(level * storeFactor * weekendBoost * noise));
        records.push({
          date,
          productSku: p.sku,
          productName: p.name,
          storeCode: store.code,
          storeName: store.name,
          quantity: qty,
          revenue: Number((qty * p.unitPrice).toFixed(2)),
        });
      }
    });
  });

  return records;
}

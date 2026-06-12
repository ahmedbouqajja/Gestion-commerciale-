import type { ProductSnapshot, WeatherTag } from "../types/domain.js";
import type { SaleRecord } from "./analytics/dashboard.js";

/**
 * Deterministic synthetic retail dataset (Moroccan GMS style) used by the
 * `demo` script and the Prisma seed so the platform is explorable without any
 * real import.
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
}

export const PRODUCT_SEEDS: ProductSeed[] = [
  { sku: "LAIT-450", name: "Lait 450 ml", category: "DAIRY", unitPrice: 4.5, costPrice: 3.2, seasonal: false, weatherTags: ["HEAT"], base: 320, trend: 1.2, stock: 9000, reorderPoint: 4000 },
  { sku: "EAU-1.5L", name: "Eau minérale 1,5 L", category: "BEVERAGE", unitPrice: 6, costPrice: 3.8, seasonal: true, weatherTags: ["HEAT", "HEATWAVE"], base: 500, trend: 2.5, stock: 16000, reorderPoint: 8000 },
  { sku: "JUS-1L", name: "Jus d'orange 1 L", category: "BEVERAGE", unitPrice: 12, costPrice: 8, seasonal: true, weatherTags: ["HEAT"], base: 180, trend: 0.8, stock: 6000, reorderPoint: 2500 },
  { sku: "GLACE-FAM", name: "Glace familiale 1 L", category: "FROZEN", unitPrice: 28, costPrice: 18, seasonal: true, weatherTags: ["HEAT", "HEATWAVE"], base: 90, trend: 1.5, stock: 3200, reorderPoint: 1500 },
  { sku: "CAFE-250", name: "Café moulu 250 g", category: "BEVERAGE", unitPrice: 32, costPrice: 22, seasonal: false, weatherTags: ["COLD", "RAIN"], base: 140, trend: -0.3, stock: 5500, reorderPoint: 2000 },
  { sku: "DATTE-1KG", name: "Dattes Majhoul 1 kg", category: "GROCERY", unitPrice: 65, costPrice: 45, seasonal: true, weatherTags: [], base: 60, trend: 0.2, stock: 4000, reorderPoint: 1500 },
  { sku: "FARINE-5KG", name: "Farine de blé 5 kg", category: "GROCERY", unitPrice: 38, costPrice: 28, seasonal: false, weatherTags: [], base: 110, trend: 0.1, stock: 6000, reorderPoint: 2500 },
  { sku: "VIANDE-AGN", name: "Viande d'agneau (kg)", category: "MEAT", unitPrice: 120, costPrice: 95, seasonal: true, weatherTags: [], base: 70, trend: 0.5, stock: 600, reorderPoint: 1500 },
  { sku: "SARDINE-KG", name: "Sardine fraîche (kg)", category: "FISH", unitPrice: 25, costPrice: 16, seasonal: false, weatherTags: [], base: 130, trend: -1.4, stock: 5000, reorderPoint: 1500 },
  { sku: "YAOURT-X8", name: "Yaourt nature x8", category: "DAIRY", unitPrice: 14, costPrice: 9, seasonal: false, weatherTags: ["HEAT"], base: 240, trend: 0.6, stock: 7000, reorderPoint: 3000 },
];

export const STORE_SEEDS = [
  { code: "CASA-01", name: "Casablanca Maârif", banner: "Marjane", city: "Casablanca", region: "Casablanca-Settat" },
  { code: "RABAT-01", name: "Rabat Agdal", banner: "Carrefour", city: "Rabat", region: "Rabat-Salé-Kénitra" },
  { code: "MARRA-01", name: "Marrakech Gueliz", banner: "Aswak Assalam", city: "Marrakech", region: "Marrakech-Safi" },
  { code: "TANG-01", name: "Tanger Centre", banner: "BIM", city: "Tanger", region: "Tanger-Tétouan" },
];

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
  }));
}

/** Flat sale records across stores for the dashboard analytics. */
export function buildSaleRecords(days = 90, asOf: Date = new Date()): SaleRecord[] {
  const records: SaleRecord[] = [];
  // Include today: the last generated day lands on `asOf`.
  const start = new Date(asOf.getTime() - (days - 1) * 86_400_000);
  STORE_SEEDS.forEach((store, si) => {
    const storeFactor = [1, 0.8, 0.6, 0.5][si] ?? 0.5;
    PRODUCT_SEEDS.forEach((p) => {
      const history = buildHistory(p, days, storeFactor);
      history.forEach((qty, i) => {
        const date = new Date(start.getTime() + i * 86_400_000);
        records.push({
          date,
          productSku: p.sku,
          productName: p.name,
          storeCode: store.code,
          storeName: store.name,
          quantity: qty,
          revenue: Number((qty * p.unitPrice).toFixed(2)),
        });
      });
    });
  });
  return records;
}

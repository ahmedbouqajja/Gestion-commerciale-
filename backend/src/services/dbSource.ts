import { prisma } from "../lib/prisma.js";
import type { ProductSnapshot, WeatherTag } from "../types/domain.js";
import type { SaleRecord } from "./analytics/dashboard.js";
import { decodeList } from "../utils/jsonList.js";

/**
 * Per-tenant data source backed by PostgreSQL (Prisma).
 *
 * Mirrors the shape produced by `sampleData.ts` so the analytics + AI pipeline
 * is identical whether data comes from the demo dataset or from real imported
 * data. The intelligence aggregator picks this source when a database is
 * configured and the tenant has sales.
 */

const DAY = 86_400_000;

export async function tenantHasSales(tenantId: string): Promise<boolean> {
  const count = await prisma.sale.count({ where: { tenantId } });
  return count > 0;
}

/** Flat sale records for the dashboard analytics (default: trailing ~400 days). */
export async function getDbSaleRecords(tenantId: string, daysBack = 400, asOf = new Date()): Promise<SaleRecord[]> {
  const from = new Date(asOf.getTime() - daysBack * DAY);
  const sales = await prisma.sale.findMany({
    where: { tenantId, date: { gte: from } },
    select: {
      date: true,
      quantity: true,
      revenue: true,
      returnedQty: true,
      returnedRevenue: true,
      product: { select: { sku: true, name: true } },
      store: { select: { code: true, name: true } },
    },
  });
  return sales.map((s) => ({
    date: s.date,
    productSku: s.product.sku,
    productName: s.product.name,
    storeCode: s.store.code,
    storeName: s.store.name,
    quantity: s.quantity,
    revenue: s.revenue,
    returnedQuantity: s.returnedQty,
    returnedRevenue: s.returnedRevenue,
  }));
}

/** Catalogue snapshots (daily history + stock) for the recommendation engine. */
export async function getDbProductSnapshots(tenantId: string, historyDays = 90, asOf = new Date()): Promise<ProductSnapshot[]> {
  const startMs = startOfDay(asOf).getTime() - (historyDays - 1) * DAY;
  const start = new Date(startMs);

  const products = await prisma.product.findMany({
    where: { tenantId, active: true },
    select: {
      id: true, sku: true, name: true, unitPrice: true, costPrice: true, seasonal: true,
      shelfLifeDays: true, weatherTags: true, initialStock: true, inventoryDate: true,
      category: { select: { kind: true } },
    },
  });

  // Earliest inventory baseline bounds the movement queries used for stock.
  const inventoryDates = products.map((p) => p.inventoryDate).filter((d): d is Date => d != null);
  const minInventory = inventoryDates.length ? new Date(Math.min(...inventoryDates.map((d) => d.getTime()))) : undefined;
  const movementWhere = { tenantId, date: { lte: asOf, ...(minInventory ? { gte: minInventory } : {}) } };

  const [historySales, purchaseAgg, stockSales] = await Promise.all([
    // Sales over the history window → daily series for trend/forecast.
    prisma.sale.findMany({ where: { tenantId, date: { gte: start, lte: asOf } }, select: { productId: true, date: true, quantity: true } }),
    // Purchases (entrées) since the inventory baseline.
    prisma.purchase.groupBy({ by: ["productId"], where: movementWhere, _sum: { quantity: true } }),
    // Sales (sorties) since the inventory baseline → applied per-product below.
    prisma.sale.findMany({ where: movementWhere, select: { productId: true, date: true, quantity: true } }),
  ]);

  // Daily history series per product over the window.
  const historyByProduct = new Map<string, number[]>();
  for (const p of products) historyByProduct.set(p.id, new Array(historyDays).fill(0));
  for (const sale of historySales) {
    const idx = Math.floor((sale.date.getTime() - startMs) / DAY);
    if (idx < 0 || idx >= historyDays) continue;
    const arr = historyByProduct.get(sale.productId);
    if (arr) arr[idx] += sale.quantity;
  }

  const purchasesByProduct = new Map(purchaseAgg.map((p) => [p.productId, p._sum.quantity ?? 0]));

  // Sum sales since each product's own inventory baseline (sorties).
  const inventoryByProduct = new Map(products.map((p) => [p.id, p.inventoryDate]));
  const salesSinceByProduct = new Map<string, number>();
  for (const s of stockSales) {
    const inv = inventoryByProduct.get(s.productId);
    if (inv && s.date < inv) continue; // before this product's baseline → ignored
    salesSinceByProduct.set(s.productId, (salesSinceByProduct.get(s.productId) ?? 0) + s.quantity);
  }

  return products.map((p) => {
    const history = historyByProduct.get(p.id) ?? [];
    const recentAvg7 = history.slice(-7).reduce((a, b) => a + b, 0) / 7;
    // Stock dépôt = inventaire initial + achats − ventes (depuis la base d'inventaire).
    const stock = p.initialStock + (purchasesByProduct.get(p.id) ?? 0) - (salesSinceByProduct.get(p.id) ?? 0);
    return {
      sku: p.sku,
      name: p.name,
      category: p.category?.kind ?? "GROCERY",
      unitPrice: p.unitPrice,
      costPrice: p.costPrice,
      seasonal: p.seasonal,
      weatherTags: decodeList(p.weatherTags) as WeatherTag[],
      salesHistory: history,
      stock,
      // Seuil de réappro auto : ~7 jours de couverture au rythme récent.
      reorderPoint: Math.round(recentAvg7 * 7),
      shelfLifeDays: p.shelfLifeDays ?? undefined,
    };
  });
}

/** Purchased quantities (entrées) per SKU over the trailing `days`. */
export async function getDbPurchases(tenantId: string, days = 30, asOf = new Date()): Promise<Map<string, number>> {
  const from = new Date(asOf.getTime() - days * DAY);
  const rows = await prisma.purchase.findMany({
    where: { tenantId, date: { gte: from, lte: asOf } },
    select: { quantity: true, product: { select: { sku: true } } },
  });
  const m = new Map<string, number>();
  for (const r of rows) m.set(r.product.sku, (m.get(r.product.sku) ?? 0) + r.quantity);
  return m;
}

export async function listDbStores(tenantId: string) {
  const stores = await prisma.store.findMany({
    where: { tenantId, active: true },
    select: { code: true, name: true, banner: true, city: true, region: true, salesRep: true, route: true, deliveryDays: true },
    orderBy: { name: "asc" },
  });
  return stores.map((s) => ({
    code: s.code,
    name: s.name,
    banner: s.banner ?? "",
    city: s.city ?? "",
    region: s.region ?? "",
    salesRep: s.salesRep ?? "",
    route: s.route ?? "",
    deliveryDays: decodeList(s.deliveryDays),
  }));
}

function startOfDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

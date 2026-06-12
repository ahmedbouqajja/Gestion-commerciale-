import { prisma } from "../lib/prisma.js";
import type { ProductSnapshot, WeatherTag } from "../types/domain.js";
import type { SaleRecord } from "./analytics/dashboard.js";

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
  const start = startOfDay(asOf).getTime() - (historyDays - 1) * DAY;

  const [products, stockLevels, sales] = await Promise.all([
    prisma.product.findMany({
      where: { tenantId, active: true },
      select: { id: true, sku: true, name: true, unitPrice: true, costPrice: true, seasonal: true, shelfLifeDays: true, weatherTags: true, category: { select: { kind: true } } },
    }),
    prisma.stockLevel.groupBy({
      by: ["productId"],
      where: { tenantId },
      _sum: { quantity: true, reorderPoint: true },
      _min: { expiryDate: true },
    }),
    prisma.sale.findMany({
      where: { tenantId, date: { gte: new Date(start) } },
      select: { productId: true, date: true, quantity: true },
    }),
  ]);

  const stockByProduct = new Map(stockLevels.map((s) => [s.productId, s]));

  // Aggregate daily quantities per product over the history window.
  const historyByProduct = new Map<string, number[]>();
  for (const p of products) historyByProduct.set(p.id, new Array(historyDays).fill(0));
  for (const sale of sales) {
    const idx = Math.floor((sale.date.getTime() - start) / DAY);
    if (idx < 0 || idx >= historyDays) continue;
    const arr = historyByProduct.get(sale.productId);
    if (arr) arr[idx] += sale.quantity;
  }

  const today = startOfDay(asOf).getTime();
  return products.map((p) => {
    const stock = stockByProduct.get(p.id);
    const nearestExpiry = stock?._min.expiryDate;
    const nearestExpiryDays = nearestExpiry
      ? Math.max(0, Math.round((startOfDay(nearestExpiry).getTime() - today) / DAY))
      : undefined;
    return {
      sku: p.sku,
      name: p.name,
      category: p.category?.kind ?? "GROCERY",
      unitPrice: p.unitPrice,
      costPrice: p.costPrice,
      seasonal: p.seasonal,
      weatherTags: (p.weatherTags as WeatherTag[]) ?? [],
      salesHistory: historyByProduct.get(p.id) ?? [],
      stock: stock?._sum.quantity ?? 0,
      reorderPoint: stock?._sum.reorderPoint ?? 0,
      shelfLifeDays: p.shelfLifeDays ?? undefined,
      nearestExpiryDays,
    };
  });
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
    deliveryDays: s.deliveryDays ?? [],
  }));
}

function startOfDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

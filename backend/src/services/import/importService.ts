import { hasDatabase } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";
import { parseSpreadsheet } from "./spreadsheet.js";
import { ENTITY_DEFS, mapRow, type ImportEntity } from "./schemas.js";

/**
 * Import service: parse → validate ("validation automatique") → optionally
 * persist per tenant. In demo mode (no DATABASE_URL) it validates and previews
 * without persisting, so the format and data quality can be checked instantly.
 */

export interface RowError {
  row: number; // 1-based data row (excludes header)
  field?: string;
  message: string;
}

export interface ImportReport {
  entity: ImportEntity;
  mode: "PERSISTED" | "DRY_RUN" | "DEMO";
  totalRows: number;
  validRows: number;
  invalidRows: number;
  persisted: number;
  errors: RowError[]; // capped
  preview: Record<string, unknown>[]; // first valid rows
}

const MAX_ERRORS = 50;
const PREVIEW = 5;

export async function importSpreadsheet(opts: {
  entity: ImportEntity;
  buffer: Buffer;
  filename: string;
  tenantId?: string;
  persist: boolean;
}): Promise<ImportReport> {
  const def = ENTITY_DEFS[opts.entity];
  const { rows } = await parseSpreadsheet(opts.buffer, opts.filename);

  const valid: Record<string, unknown>[] = [];
  const errors: RowError[] = [];

  rows.forEach((raw, i) => {
    const mapped = mapRow(raw, def.aliases);
    const result = def.schema.safeParse(mapped);
    if (result.success) {
      valid.push(result.data as Record<string, unknown>);
    } else if (errors.length < MAX_ERRORS) {
      for (const issue of result.error.issues) {
        errors.push({ row: i + 1, field: issue.path.join("."), message: issue.message });
      }
    }
  });

  let persisted = 0;
  let mode: ImportReport["mode"] = "DRY_RUN";

  if (opts.persist) {
    if (hasDatabase && opts.tenantId) {
      persisted = await persist(opts.entity, valid, opts.tenantId);
      mode = "PERSISTED";
    } else {
      mode = "DEMO"; // validated only — persistence requires a database
    }
  }

  return {
    entity: opts.entity,
    mode,
    totalRows: rows.length,
    validRows: valid.length,
    invalidRows: rows.length - valid.length,
    persisted,
    errors,
    preview: valid.slice(0, PREVIEW),
  };
}

// ─── Persistence ────────────────────────────────────────────────────────────

async function persist(entity: ImportEntity, rows: Record<string, unknown>[], tenantId: string): Promise<number> {
  switch (entity) {
    case "products":
      return persistProducts(rows, tenantId);
    case "stores":
      return persistStores(rows, tenantId);
    case "stock":
      return persistStock(rows, tenantId);
    case "sales":
      return persistSales(rows, tenantId);
  }
}

async function persistProducts(rows: Record<string, unknown>[], tenantId: string): Promise<number> {
  let n = 0;
  for (const r of rows) {
    let categoryId: string | undefined;
    if (r.category) {
      const cat = await prisma.category.upsert({
        where: { tenantId_name: { tenantId, name: String(r.category) } },
        update: {},
        create: { tenantId, name: String(r.category) },
      });
      categoryId = cat.id;
    }
    await prisma.product.upsert({
      where: { tenantId_sku: { tenantId, sku: String(r.sku) } },
      update: { name: String(r.name), unitPrice: Number(r.unitPrice), costPrice: Number(r.costPrice ?? 0), seasonal: Boolean(r.seasonal), categoryId },
      create: { tenantId, sku: String(r.sku), name: String(r.name), unitPrice: Number(r.unitPrice), costPrice: Number(r.costPrice ?? 0), seasonal: Boolean(r.seasonal), categoryId },
    });
    n++;
  }
  return n;
}

async function persistStores(rows: Record<string, unknown>[], tenantId: string): Promise<number> {
  let n = 0;
  for (const r of rows) {
    await prisma.store.upsert({
      where: { tenantId_code: { tenantId, code: String(r.code) } },
      update: { name: String(r.name), banner: r.banner ? String(r.banner) : null, city: r.city ? String(r.city) : null, region: r.region ? String(r.region) : null },
      create: { tenantId, code: String(r.code), name: String(r.name), banner: r.banner ? String(r.banner) : null, city: r.city ? String(r.city) : null, region: r.region ? String(r.region) : null },
    });
    n++;
  }
  return n;
}

async function persistStock(rows: Record<string, unknown>[], tenantId: string): Promise<number> {
  const { products, stores } = await refMaps(tenantId);
  let n = 0;
  for (const r of rows) {
    const productId = products.get(String(r.productSku));
    const storeId = stores.get(String(r.storeCode));
    if (!productId || !storeId) continue; // unknown reference — skipped
    await prisma.stockLevel.upsert({
      where: { tenantId_productId_storeId: { tenantId, productId, storeId } },
      update: { quantity: Number(r.quantity), reorderPoint: Number(r.reorderPoint ?? 0) },
      create: { tenantId, productId, storeId, quantity: Number(r.quantity), reorderPoint: Number(r.reorderPoint ?? 0) },
    });
    n++;
  }
  return n;
}

async function persistSales(rows: Record<string, unknown>[], tenantId: string): Promise<number> {
  const { products, stores } = await refMaps(tenantId);
  const data = rows
    .map((r) => {
      const productId = products.get(String(r.productSku));
      const storeId = stores.get(String(r.storeCode));
      if (!productId || !storeId) return null;
      return {
        tenantId,
        productId,
        storeId,
        date: r.date as Date,
        quantity: Number(r.quantity),
        revenue: Number(r.revenue),
        promoFlag: Boolean(r.promoFlag),
      };
    })
    .filter((d): d is NonNullable<typeof d> => d !== null);

  if (data.length === 0) return 0;
  const res = await prisma.sale.createMany({ data });
  return res.count;
}

/** Build sku→id and code→id lookup maps for the tenant. */
async function refMaps(tenantId: string) {
  const [products, stores] = await Promise.all([
    prisma.product.findMany({ where: { tenantId }, select: { id: true, sku: true } }),
    prisma.store.findMany({ where: { tenantId }, select: { id: true, code: true } }),
  ]);
  return {
    products: new Map(products.map((p) => [p.sku, p.id])),
    stores: new Map(stores.map((s) => [s.code, s.id])),
  };
}

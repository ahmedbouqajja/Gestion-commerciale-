/**
 * Seeds a demo tenant with users, stores, categories, products, 90 days of
 * sales and current stock levels. Run with: npm run prisma:seed
 */
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/utils/auth.js";
import { encodeList } from "../src/utils/jsonList.js";
import { PRODUCT_SEEDS, STORE_SEEDS, STORE_FACTORS, buildHistory } from "../src/services/sampleData.js";

const prisma = new PrismaClient();

const CATEGORIES: { name: string; kind: string }[] = [
  { name: "Produits laitiers", kind: "DAIRY" },
  { name: "Boissons", kind: "BEVERAGE" },
  { name: "Surgelés", kind: "FROZEN" },
  { name: "Épicerie", kind: "GROCERY" },
  { name: "Viandes", kind: "MEAT" },
  { name: "Poissons", kind: "FISH" },
  { name: "Produits frais", kind: "FRESH" },
];

async function main() {
  console.log("🌱 Seeding Smart Promo AI demo tenant…");

  const tenant = await prisma.tenant.upsert({
    where: { slug: "smart-promo-demo" },
    update: {},
    create: { name: "Smart Promo Démo", slug: "smart-promo-demo", country: "MA", currency: "MAD", plan: "PRO" },
  });

  await prisma.user.upsert({
    where: { email: "admin@smartpromo.ma" },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "admin@smartpromo.ma",
      passwordHash: await hashPassword("demo1234"),
      fullName: "Admin Démo",
      role: "TENANT_ADMIN",
    },
  });

  const categoryByKind = new Map<string, string>();
  for (const c of CATEGORIES) {
    const cat = await prisma.category.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: c.name } },
      update: {},
      create: { tenantId: tenant.id, name: c.name, kind: c.kind },
    });
    categoryByKind.set(c.kind, cat.id);
  }

  const stores = [];
  for (const s of STORE_SEEDS) {
    stores.push(
      await prisma.store.upsert({
        where: { tenantId_code: { tenantId: tenant.id, code: s.code } },
        update: {},
        create: {
          tenantId: tenant.id,
          code: s.code,
          name: s.name,
          banner: s.banner,
          city: s.city,
          region: s.region,
          salesRep: s.salesRep,
          route: s.route,
          deliveryDays: encodeList(s.deliveryDays),
        },
      }),
    );
  }

  // Reset sales for idempotency.
  await prisma.sale.deleteMany({ where: { tenantId: tenant.id } });

  const now = new Date();
  const days = 90;
  const storeFactors = STORE_FACTORS;

  for (const ps of PRODUCT_SEEDS) {
    const product = await prisma.product.upsert({
      where: { tenantId_sku: { tenantId: tenant.id, sku: ps.sku } },
      update: { initialStock: ps.stock, inventoryDate: now },
      create: {
        tenantId: tenant.id,
        sku: ps.sku,
        name: ps.name,
        categoryId: categoryByKind.get(ps.category),
        unitPrice: ps.unitPrice,
        costPrice: ps.costPrice,
        seasonal: ps.seasonal,
        shelfLifeDays: ps.shelfLifeDays,
        weatherTags: encodeList(ps.weatherTags),
        // Depot stock baseline: current sales (in the past) don't decrement it.
        initialStock: ps.stock,
        inventoryDate: now,
      },
    });

    const sales: { tenantId: string; productId: string; storeId: string; date: Date; quantity: number; revenue: number; margin: number; returnedQty: number; returnedRevenue: number }[] = [];
    stores.forEach((store, si) => {
      const history = buildHistory(ps, days, storeFactors[si] ?? 0.5);
      history.forEach((qty, i) => {
        const date = new Date(now.getTime() - (days - 1 - i) * 86_400_000);
        const returnedQty = Math.round(qty * ps.returnRate);
        sales.push({
          tenantId: tenant.id,
          productId: product.id,
          storeId: store.id,
          date,
          quantity: qty,
          revenue: Number((qty * ps.unitPrice).toFixed(2)),
          margin: Number((qty * (ps.unitPrice - ps.costPrice)).toFixed(2)),
          returnedQty,
          returnedRevenue: Number((returnedQty * ps.unitPrice).toFixed(2)),
        });
      });
    });
    await prisma.sale.createMany({ data: sales });
  }

  console.log("✓ Tenant, users, stores, categories, products & 90 jours de ventes créés.");
  console.log("  Connexion : admin@smartpromo.ma / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

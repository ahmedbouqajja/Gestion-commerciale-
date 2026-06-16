import { hasDatabase } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { hashPassword, signToken, verifyPassword } from "../utils/auth.js";

/**
 * Authentication service.
 *
 * Uses Prisma/Postgres when DATABASE_URL is configured. With no database, it
 * falls back to an in-memory demo tenant so the platform is usable immediately
 * (e.g. on a fresh clone). The demo credentials are printed at startup.
 */

export const DEMO_USER = {
  email: "admin@smartpromo.ma",
  password: "demo1234",
  tenantId: "demo-tenant",
  userId: "demo-user",
  role: "TENANT_ADMIN",
  fullName: "Admin Démo",
  tenantName: "Smart Promo Démo",
};

export interface AuthResult {
  token: string;
  user: { id: string; email: string; fullName: string; role: string; tenantId: string; tenantName: string };
}

export async function login(email: string, password: string): Promise<AuthResult> {
  if (!hasDatabase) {
    if (email.toLowerCase() !== DEMO_USER.email || password !== DEMO_USER.password) {
      throw new Error("Identifiants invalides.");
    }
    return demoResult();
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() }, include: { tenant: true } });
  if (!user || !user.active || !(await verifyPassword(password, user.passwordHash))) {
    throw new Error("Identifiants invalides.");
  }
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return {
    token: signToken({ userId: user.id, tenantId: user.tenantId, role: user.role }),
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      tenantId: user.tenantId,
      tenantName: user.tenant.name,
    },
  };
}

/** Register a brand-new tenant and its first admin user. */
export async function registerTenant(input: {
  tenantName: string;
  email: string;
  password: string;
  fullName: string;
}): Promise<AuthResult> {
  if (!hasDatabase) throw new Error("Inscription indisponible en mode démo (configurez DATABASE_URL).");

  const slug = input.tenantName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const existing = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (existing) throw new Error("Cet email est déjà utilisé.");

  const tenant = await prisma.tenant.create({ data: { name: input.tenantName, slug: `${slug}-${Date.now().toString(36)}` } });
  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: input.email.toLowerCase(),
      passwordHash: await hashPassword(input.password),
      fullName: input.fullName,
      role: "TENANT_ADMIN",
    },
  });

  return {
    token: signToken({ userId: user.id, tenantId: tenant.id, role: user.role }),
    user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, tenantId: tenant.id, tenantName: tenant.name },
  };
}

export interface UserSummary {
  id: string;
  email: string;
  fullName: string;
  role: string;
  active: boolean;
  lastLoginAt: Date | null;
  createdAt: Date | null;
}

/** List the users of a tenant (the demo admin when no database is configured). */
export async function listUsers(tenantId?: string): Promise<UserSummary[]> {
  if (!hasDatabase || !tenantId || tenantId === DEMO_USER.tenantId) {
    return [
      {
        id: DEMO_USER.userId,
        email: DEMO_USER.email,
        fullName: DEMO_USER.fullName,
        role: DEMO_USER.role,
        active: true,
        lastLoginAt: null,
        createdAt: null,
      },
    ];
  }
  return prisma.user.findMany({
    where: { tenantId },
    select: { id: true, email: true, fullName: true, role: true, active: true, lastLoginAt: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
}

/** Create a new user inside the caller's tenant. */
export async function createUser(
  tenantId: string | undefined,
  input: { fullName: string; email: string; password: string; role: string },
): Promise<UserSummary> {
  if (!hasDatabase || !tenantId || tenantId === DEMO_USER.tenantId) {
    throw new Error("Ajout d'utilisateur indisponible en mode démo (configurez DATABASE_URL).");
  }
  const email = input.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("Cet email est déjà utilisé.");

  return prisma.user.create({
    data: {
      tenantId,
      email,
      fullName: input.fullName,
      role: input.role,
      passwordHash: await hashPassword(input.password),
    },
    select: { id: true, email: true, fullName: true, role: true, active: true, lastLoginAt: true, createdAt: true },
  });
}

export interface BillingInfo {
  tenantName: string;
  plan: string; // STARTER | PRO | ENTERPRISE
  currency: string;
  country: string;
  since: Date | null;
}

/** Current subscription / billing summary for a tenant. */
export async function getBilling(tenantId?: string): Promise<BillingInfo> {
  if (!hasDatabase || !tenantId || tenantId === DEMO_USER.tenantId) {
    return { tenantName: DEMO_USER.tenantName, plan: "PRO", currency: "MAD", country: "MA", since: null };
  }
  const t = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true, plan: true, currency: true, country: true, createdAt: true },
  });
  if (!t) return { tenantName: DEMO_USER.tenantName, plan: "PRO", currency: "MAD", country: "MA", since: null };
  return { tenantName: t.name, plan: t.plan, currency: t.currency, country: t.country, since: t.createdAt };
}

/** Change the caller's own password (requires the current one). */
export async function changePassword(userId: string | undefined, currentPassword: string, newPassword: string): Promise<void> {
  if (!hasDatabase || !userId || userId === DEMO_USER.userId) {
    throw new Error("Changement de mot de passe indisponible en mode démo (configurez DATABASE_URL).");
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Utilisateur introuvable.");
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw new Error("Mot de passe actuel incorrect.");
  }
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(newPassword) } });
}

/**
 * Vide toutes les données commerciales d'une société (ventes, achats, stock,
 * produits, catégories, magasins + sorties IA) — utile pour effacer le jeu de
 * démonstration avant d'importer ses vraies données. La société et les
 * utilisateurs (donc la connexion) sont conservés.
 */
export async function resetTenantData(
  tenantId: string | undefined,
): Promise<{ ok: true; deleted: Record<string, number> }> {
  if (!hasDatabase || !tenantId || tenantId === DEMO_USER.tenantId) {
    throw new Error("Réinitialisation indisponible en mode démo (configurez DATABASE_URL).");
  }
  // Ordre : enfants avant parents (les FK produits/magasins sont en cascade,
  // mais on supprime explicitement pour des compteurs clairs).
  const sales = await prisma.sale.deleteMany({ where: { tenantId } });
  const purchases = await prisma.purchase.deleteMany({ where: { tenantId } });
  const stock = await prisma.stockLevel.deleteMany({ where: { tenantId } });
  await prisma.recommendation.deleteMany({ where: { tenantId } });
  await prisma.promotion.deleteMany({ where: { tenantId } });
  await prisma.report.deleteMany({ where: { tenantId } });
  const products = await prisma.product.deleteMany({ where: { tenantId } });
  const categories = await prisma.category.deleteMany({ where: { tenantId } });
  const stores = await prisma.store.deleteMany({ where: { tenantId } });

  return {
    ok: true,
    deleted: {
      ventes: sales.count,
      achats: purchases.count,
      stock: stock.count,
      produits: products.count,
      categories: categories.count,
      magasins: stores.count,
    },
  };
}

function demoResult(): AuthResult {
  return {
    token: signToken({ userId: DEMO_USER.userId, tenantId: DEMO_USER.tenantId, role: DEMO_USER.role }),
    user: {
      id: DEMO_USER.userId,
      email: DEMO_USER.email,
      fullName: DEMO_USER.fullName,
      role: DEMO_USER.role,
      tenantId: DEMO_USER.tenantId,
      tenantName: DEMO_USER.tenantName,
    },
  };
}

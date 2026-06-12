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

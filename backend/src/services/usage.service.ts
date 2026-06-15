import { prisma } from '../lib/prisma';
import { env } from '../lib/env';
import { paymentRequired } from '../lib/http';
import type { Plan } from '@prisma/client';

export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export async function getUsage(userId: string): Promise<number> {
  const usage = await prisma.usage.findUnique({
    where: { userId_month: { userId, month: currentMonth() } },
  });
  return usage?.count ?? 0;
}

export interface QuotaInfo {
  plan: Plan;
  used: number;
  limit: number | null; // null = illimité
  remaining: number | null;
}

export async function getQuota(userId: string, plan: Plan): Promise<QuotaInfo> {
  if (plan === 'PRO') {
    return { plan, used: await getUsage(userId), limit: null, remaining: null };
  }
  const used = await getUsage(userId);
  return {
    plan,
    used,
    limit: env.freePlanMonthlyLimit,
    remaining: Math.max(0, env.freePlanMonthlyLimit - used),
  };
}

// Vérifie le quota AVANT une génération. Lève une erreur 402 si dépassé.
export async function assertCanGenerate(userId: string, plan: Plan): Promise<void> {
  if (plan === 'PRO') return;
  const used = await getUsage(userId);
  if (used >= env.freePlanMonthlyLimit) {
    throw paymentRequired(
      `Limite mensuelle du pack gratuit atteinte (${env.freePlanMonthlyLimit} générations). Passez au Pack Prof pour des générations illimitées.`,
    );
  }
}

// Incrémente la consommation APRÈS une génération réussie.
export async function incrementUsage(userId: string): Promise<void> {
  const month = currentMonth();
  await prisma.usage.upsert({
    where: { userId_month: { userId, month } },
    create: { userId, month, count: 1 },
    update: { count: { increment: 1 } },
  });
}

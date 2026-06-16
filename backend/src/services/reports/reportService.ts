import { hasDatabase } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";
import { getDashboard, getRecommendations } from "../intelligence.js";
import { buildCommentary, type ReportPeriod } from "./commentary.js";
import { renderPdf } from "./pdf.js";
import { renderExcel } from "./excel.js";
import { DEMO_USER } from "../authService.js";
import type { ReportData, ReportFormat } from "./types.js";

/**
 * Assembles report data from the analytics pipeline (per tenant) and renders it
 * to the requested format. Reusable by the API and by scheduled jobs.
 */

export async function buildReportData(tenantId: string | undefined, period: ReportPeriod): Promise<ReportData> {
  const [dashboard, { recommendations }] = await Promise.all([getDashboard(tenantId), getRecommendations(tenantId)]);
  const commentary = await buildCommentary(dashboard, recommendations, period);
  const { name, currency } = await tenantMeta(tenantId);
  return { tenantName: name, currency, period, generatedAt: new Date(), dashboard, recommendations, commentary };
}

export interface GeneratedReport {
  buffer: Buffer;
  filename: string;
  contentType: string;
}

export async function generateReport(
  tenantId: string | undefined,
  period: ReportPeriod,
  format: ReportFormat,
): Promise<GeneratedReport> {
  const data = await buildReportData(tenantId, period);
  const stamp = data.generatedAt.toISOString().slice(0, 10);
  const base = `rapport_${period}_${stamp}`;

  if (format === "pdf") {
    return { buffer: await renderPdf(data), filename: `${base}.pdf`, contentType: "application/pdf" };
  }
  return {
    buffer: await renderExcel(data),
    filename: `${base}.xlsx`,
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
}

async function tenantMeta(tenantId: string | undefined): Promise<{ name: string; currency: string }> {
  if (hasDatabase && tenantId) {
    const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true, currency: true } });
    if (t) return { name: t.name, currency: t.currency };
  }
  return { name: DEMO_USER.tenantName, currency: "MAD" };
}

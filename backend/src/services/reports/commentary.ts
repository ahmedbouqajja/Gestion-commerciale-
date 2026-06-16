import type { DashboardSummary } from "../analytics/dashboard.js";
import type { Recommendation } from "../../types/domain.js";
import { generateText } from "../../lib/anthropic.js";

/**
 * Auto-generated executive commentary for reports.
 *
 * Builds a grounded French narrative from the computed analytics (no invented
 * figures). When a Claude (Anthropic) key is set, the facts are passed as context to
 * produce a more polished corporate write-up.
 */

export type ReportPeriod = "weekly" | "monthly" | "quarterly";

export const PERIOD_LABEL: Record<ReportPeriod, string> = {
  weekly: "Hebdomadaire",
  monthly: "Mensuel",
  quarterly: "Trimestriel",
};

const fmt = (n: number) => new Intl.NumberFormat("fr-MA").format(Math.round(n));

export function buildCommentaryFacts(dashboard: DashboardSummary, recommendations: Recommendation[]): string[] {
  const p: string[] = [];
  const ca30 = dashboard.kpis.find((k) => k.label.includes("CA 30"))?.value ?? 0;
  const n1 = dashboard.kpis.find((k) => k.label.includes("N-1"))?.changePct;

  p.push(
    `Sur les 30 derniers jours, le chiffre d'affaires s'établit à ${fmt(ca30)} MAD` +
      (n1 !== undefined ? `, soit une évolution de ${n1 >= 0 ? "+" : ""}${n1}% par rapport à l'année précédente.` : "."),
  );

  const returnRate = dashboard.kpis.find((k) => k.label.includes("Taux de retour"));
  if (returnRate) {
    p.push(
      `Le taux de retour (invendus / DLC dépassée) s'élève à ${returnRate.value}% sur la période` +
        (returnRate.value >= 5 ? ", un niveau à réduire en ajustant les quantités livrées." : ", un niveau maîtrisé."),
    );
  }

  if (dashboard.topGrowers.length) {
    p.push(
      `Les meilleures dynamiques proviennent de ${dashboard.topGrowers
        .slice(0, 3)
        .map((m) => `${m.name} (+${m.changePct}%)`)
        .join(", ")}.`,
    );
  }
  if (dashboard.topDecliners.length) {
    p.push(
      `À l'inverse, ${dashboard.topDecliners
        .slice(0, 3)
        .map((m) => `${m.name} (${m.changePct}%)`)
        .join(", ")} nécessitent une attention particulière.`,
    );
  }

  const struggling = dashboard.strugglingStores.slice(0, 3);
  if (struggling.length) {
    p.push(`Magasins en difficulté : ${struggling.map((s) => `${s.name} (${s.changePct}%)`).join(", ")}.`);
  }

  const stockouts = recommendations.filter((r) => r.drivers.includes("STOCKOUT"));
  const atRisk = stockouts.reduce((sum, r) => sum + (r.revenueAtRisk ?? 0), 0);
  if (stockouts.length) {
    p.push(`${stockouts.length} produit(s) présentent un risque de rupture, soit ~${fmt(atRisk)} MAD de CA menacé à sécuriser en priorité.`);
  }

  const expiries = recommendations.filter((r) => r.drivers.includes("EXPIRY"));
  const waste = expiries.reduce((sum, r) => sum + (r.wasteAtRisk ?? 0), 0);
  if (expiries.length) {
    p.push(`${expiries.length} produit(s) à DLC courte sont en risque de péremption, soit ~${fmt(waste)} MAD de pertes à éviter par déstockage ou transfert.`);
  }

  const opportunities = recommendations.filter((r) => !r.drivers.includes("STOCKOUT") && !r.drivers.includes("EXPIRY")).slice(0, 3);
  if (opportunities.length) {
    p.push(
      `Opportunités commerciales à activer : ${opportunities
        .map((o) => `${o.productName} (+${o.estimatedUplift}% estimé)`)
        .join(", ")}.`,
    );
  }

  return p;
}

export async function buildCommentary(
  dashboard: DashboardSummary,
  recommendations: Recommendation[],
  period: ReportPeriod,
): Promise<string[]> {
  const facts = buildCommentaryFacts(dashboard, recommendations);

  // Optionnel : Claude rédige la synthèse à partir UNIQUEMENT des faits calculés.
  const text = await generateText(
    "Tu es analyste commercial. Rédige une synthèse exécutive en français (3 à 5 paragraphes), ton corporate, à partir UNIQUEMENT des faits fournis. N'invente aucun chiffre. Réponds en paragraphes séparés par des sauts de ligne.",
    `Rapport ${PERIOD_LABEL[period]}.\nFaits:\n- ${facts.join("\n- ")}`,
    2048,
  );
  if (text) return text.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);

  return facts;
}

import type { DashboardSummary } from "../analytics/dashboard.js";
import type { Recommendation } from "../../types/domain.js";
import { generateText } from "../../lib/anthropic.js";

/**
 * Conversational commercial assistant.
 *
 * Resolves the user's question to an intent and answers from the already-
 * computed analytics + recommendations (so answers are grounded, not
 * hallucinated). When a Claude (Anthropic) key is present, the grounded facts are passed
 * as context to phrase a richer natural-language reply.
 */

export interface AssistantContext {
  dashboard: DashboardSummary;
  recommendations: Recommendation[];
}

export interface AssistantReply {
  intent: string;
  answer: string;
  data?: unknown;
}

type Intent = "DECLINE_REASON" | "WHAT_TO_PROMOTE" | "STRUGGLING_STORES" | "ACTION_PLAN" | "TOP_PRODUCTS" | "GENERAL";

function classify(q: string): Intent {
  const t = q.toLowerCase();
  if (/(baiss|recul|chut|pourquoi).*(vent|ca|chiffre)|pourquoi/.test(t)) return "DECLINE_REASON";
  if (/(promouvoir|promotion|promo|mettre en avant|quel produit)/.test(t)) return "WHAT_TO_PROMOTE";
  if (/(magasin|point de vente|store).*(difficult|sous-?perform|baisse|problème)|magasins en difficult/.test(t)) return "STRUGGLING_STORES";
  if (/(plan d'?action|augmenter.*vent|augmenter.*ca|\+?\s*\d+\s*%)/.test(t)) return "ACTION_PLAN";
  if (/(meilleur|top|forte croissance|best)/.test(t)) return "TOP_PRODUCTS";
  return "GENERAL";
}

function answerFor(intent: Intent, ctx: AssistantContext, question: string): AssistantReply {
  const { dashboard: d, recommendations: recs } = ctx;
  switch (intent) {
    case "DECLINE_REASON": {
      const decliners = d.topDecliners.slice(0, 3);
      const lines = decliners.map((m) => `• ${m.name} : ${m.changePct}%`).join("\n");
      const alerts = d.alerts.filter((a) => a.level !== "INFO").map((a) => `• ${a.message}`).join("\n");
      return {
        intent,
        answer: `Les principaux contributeurs à la baisse sur 30 jours sont :\n${lines || "aucun recul significatif"}.${alerts ? `\n\nAlertes associées :\n${alerts}` : ""}`,
        data: { decliners, alerts: d.alerts },
      };
    }
    case "WHAT_TO_PROMOTE": {
      const top = recs.filter((r) => !r.drivers.includes("STOCKOUT")).slice(0, 3);
      const lines = top
        .map((r) => `• ${r.productName} — ${r.actions.map((a) => a.label).join(", ")} (impact estimé +${r.estimatedUplift}%, confiance ${(r.confidence * 100).toFixed(0)}%)`)
        .join("\n");
      return {
        intent,
        answer: top.length
          ? `Produits à promouvoir en priorité la semaine prochaine :\n${lines}`
          : "Aucune opportunité promotionnelle nette détectée actuellement.",
        data: { recommendations: top },
      };
    }
    case "STRUGGLING_STORES": {
      const stores = d.strugglingStores.slice(0, 5);
      const lines = stores.map((s) => `• ${s.name} : ${s.changePct}% (CA ${s.revenue.toLocaleString("fr-MA")} MAD)`).join("\n");
      return {
        intent,
        answer: stores.length ? `Magasins en difficulté :\n${lines}` : "Aucun magasin en difficulté notable.",
        data: { strugglingStores: stores },
      };
    }
    case "ACTION_PLAN": {
      const target = Number(/(\d+)\s*%/.exec(question)?.[1] ?? 10) || 10;
      const opportunities = recs.filter((r) => !r.drivers.includes("STOCKOUT")).slice(0, 5);
      const stockouts = recs.filter((r) => r.drivers.includes("STOCKOUT")).slice(0, 3);
      const atRisk = stockouts.reduce((sum, s) => sum + (s.revenueAtRisk ?? 0), 0);
      const steps = [
        `1. Sécuriser le CA : traiter ${stockouts.length} risque(s) de rupture (${stockouts.map((s) => s.productName).join(", ") || "aucun"})${atRisk ? ` — ~${atRisk.toLocaleString("fr-MA")} MAD menacés`: ""}.`,
        `2. Activer ${opportunities.length} promotion(s) à fort potentiel : ${opportunities.map((o) => `${o.productName} (+${o.estimatedUplift}%)`).join(", ")}.`,
        `3. Renforcer les magasins en difficulté : ${d.strugglingStores.slice(0, 3).map((s) => s.name).join(", ") || "aucun"}.`,
        `4. Suivre l'impact quotidiennement via le tableau de bord IA.`,
      ];
      return {
        intent,
        answer: `Plan d'action pour viser +${target}% de ventes :\n${steps.join("\n")}`,
        data: { opportunities, stockouts },
      };
    }
    case "TOP_PRODUCTS": {
      const lines = d.topGrowers.slice(0, 5).map((m) => `• ${m.name} : +${m.changePct}%`).join("\n");
      return { intent, answer: `Produits en forte croissance :\n${lines || "aucun"}`, data: { topGrowers: d.topGrowers } };
    }
    default:
      return {
        intent: "GENERAL",
        answer:
          "Je peux analyser vos ventes, expliquer les variations, recommander des promotions, identifier les magasins en difficulté et bâtir un plan d'action. Posez-moi une question précise (ex. « Quel produit promouvoir la semaine prochaine ? »).",
      };
  }
}

export async function ask(question: string, ctx: AssistantContext): Promise<AssistantReply> {
  const intent = classify(question);
  const grounded = answerFor(intent, ctx, question);

  // Optionnel : Claude reformule en s'appuyant UNIQUEMENT sur les faits calculés.
  const rephrased = await generateText(
    "Tu es un conseiller commercial pour le retail. Réponds en français, de façon concise et actionnable, en t'appuyant STRICTEMENT sur les faits fournis. N'invente aucun chiffre.",
    `Question: ${question}\n\nFaits analysés:\n${grounded.answer}`,
  );
  if (rephrased) return { ...grounded, answer: rephrased };

  return grounded;
}

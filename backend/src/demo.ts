/**
 * Smart Promo AI — engine demo.
 *
 * Runs the full intelligence pipeline (dashboard analytics, weather, calendar,
 * recommendations, forecasting) on synthetic data with NO database or external
 * API required. Run with:  npm run demo
 */
import { buildDashboard } from "./services/analytics/dashboard.js";
import { getCalendarEvents } from "./services/ai/calendar.js";
import { getForecast } from "./services/ai/weather.js";
import { generateRecommendations } from "./services/ai/recommendationEngine.js";
import { forecastDemand } from "./services/ai/forecast.js";
import { buildProductSnapshots, buildSaleRecords } from "./services/sampleData.js";

const C = {
  title: (s: string) => `\n\x1b[1m\x1b[36m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
};

async function main() {
  const asOf = new Date();
  console.log(C.title("═══ SMART PROMO AI — Conseiller du Distributeur Laitier ═══"));
  console.log(C.dim(`Date d'analyse : ${asOf.toISOString().slice(0, 10)} | Données : démo synthétique (produits laitiers)`));

  // ── 1. Dashboard ──
  const records = buildSaleRecords(90, asOf);
  const dash = buildDashboard(records, asOf);
  console.log(C.title("1. Tableau de bord IA"));
  for (const k of dash.kpis) {
    const chg = k.changePct !== undefined ? ` (${k.changePct >= 0 ? C.green(`+${k.changePct}%`) : C.red(`${k.changePct}%`)})` : "";
    const val = k.unit === "%" ? `${k.value}%` : `${k.value.toLocaleString("fr-MA")} MAD`;
    console.log(`   • ${k.label.padEnd(20)} : ${val}${chg}`);
  }
  console.log(C.dim("   Top croissance : ") + dash.topGrowers.map((m) => `${m.name} (+${m.changePct}%)`).slice(0, 3).join(", "));
  console.log(C.dim("   En baisse      : ") + dash.topDecliners.map((m) => `${m.name} (${m.changePct}%)`).slice(0, 3).join(", "));
  console.log(C.dim("   Alertes        :"));
  for (const a of dash.alerts) {
    const color = a.level === "CRITICAL" ? C.red : a.level === "WARNING" ? C.yellow : C.dim;
    console.log("     " + color(`[${a.level}] ${a.message}`));
  }

  // ── 2. Weather + Calendar context ──
  const weather = await getForecast(33.57, -7.59, 5); // Casablanca
  const events = getCalendarEvents(asOf, 30);
  console.log(C.title("2. Contexte météo & calendrier"));
  console.log("   Météo 5j : " + weather.map((w) => `${w.date.slice(5)} ${w.tempC}°C ${w.tags.join("/")}`).join("  |  "));
  console.log("   Événements : " + (events.length ? events.map((e) => `${e.name}${e.startsInDays ? ` (J-${e.startsInDays})` : " (en cours)"}`).join(", ") : "aucun"));

  // ── 3. Recommendations ──
  const products = buildProductSnapshots(90);
  const recs = generateRecommendations(products, { weather, events });
  console.log(C.title("3. Recommandations d'offres (Top 5)"));
  for (const r of recs.slice(0, 5)) {
    console.log(`\n   \x1b[1m${r.title}\x1b[0m  ${C.dim(`[${r.drivers.join(", ")}]`)}`);
    console.log(`   Analyse  : ${r.rationale}`);
    console.log(`   Actions  : ${r.actions.map((a) => a.label).join(" · ")}`);
    const impact = r.revenueAtRisk
      ? `${C.red(`CA protégé : ~${r.revenueAtRisk.toLocaleString("fr-MA")} MAD`)}`
      : r.wasteAtRisk
        ? `${C.yellow(`Perte évitée : ~${r.wasteAtRisk.toLocaleString("fr-MA")} MAD`)}`
        : `${C.green(`+${r.estimatedUplift}% ventes`)}`;
    console.log(`   Impact   : ${impact}  |  Confiance : ${(r.confidence * 100).toFixed(0)}%`);
  }

  // ── 4. Forecast ──
  const ref = products.find((p) => p.sku === "LAIT-UHT-1L")!;
  console.log(C.title(`4. Prévision de demande — ${ref.name}`));
  for (const h of [7, 30, 90]) {
    const f = forecastDemand(ref.salesHistory, h);
    console.log(`   ${String(h).padStart(3)} j : ${Math.round(f.total).toLocaleString("fr-MA")} u  (~${f.dailyAverage}/j, tendance ${f.trendPerDay >= 0 ? "+" : ""}${f.trendPerDay}/j, conf. ${(f.confidence * 100).toFixed(0)}%)`);
  }

  console.log("\n" + C.green("✓ Pipeline complet exécuté sans base de données ni clé API.\n"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

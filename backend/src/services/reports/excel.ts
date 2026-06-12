import ExcelJS from "exceljs";
import { PERIOD_LABEL } from "./commentary.js";
import type { ReportData } from "./types.js";

/**
 * Renders a multi-sheet Excel report (Synthèse, Produits, Magasins,
 * Recommandations) with exceljs. Returns a Buffer.
 */

const BRAND = "FF4F46E5";

export async function renderExcel(data: ReportData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Smart Promo AI";
  wb.created = data.generatedAt;

  // ── Synthèse ──
  const synth = wb.addWorksheet("Synthèse");
  synth.columns = [{ width: 28 }, { width: 22 }, { width: 14 }];
  title(synth, `Rapport ${PERIOD_LABEL[data.period]} — ${data.tenantName}`);
  synth.addRow([`Généré le ${data.generatedAt.toLocaleDateString("fr-FR")}`]);
  synth.addRow([]);
  headerRow(synth, ["Indicateur", "Valeur", "Évol. N-1"]);
  for (const k of data.dashboard.kpis) {
    const row = synth.addRow([k.label, `${Math.round(k.value)} ${data.currency}`, k.changePct !== undefined ? `${k.changePct}%` : "—"]);
    if (k.changePct !== undefined) row.getCell(3).font = { color: { argb: k.changePct >= 0 ? "FF059669" : "FFDC2626" } };
  }
  synth.addRow([]);
  synth.addRow(["Synthèse exécutive"]).font = { bold: true, size: 12 };
  for (const p of data.commentary) {
    const r = synth.addRow([p]);
    synth.mergeCells(`A${r.number}:C${r.number}`);
    r.getCell(1).alignment = { wrapText: true, vertical: "top" };
    r.height = Math.max(18, Math.ceil(p.length / 60) * 14);
  }

  // ── Produits ──
  const prod = wb.addWorksheet("Produits");
  prod.columns = [{ width: 30 }, { width: 16 }, { width: 14 }];
  title(prod, "Mouvements produits");
  headerRow(prod, ["Produit (croissance)", "CA", "Évolution"]);
  for (const m of data.dashboard.topGrowers) {
    const r = prod.addRow([m.name, Math.round(m.revenue), `+${m.changePct}%`]);
    r.getCell(3).font = { color: { argb: "FF059669" } };
  }
  prod.addRow([]);
  headerRow(prod, ["Produit (baisse)", "CA", "Évolution"]);
  for (const m of data.dashboard.topDecliners) {
    const r = prod.addRow([m.name, Math.round(m.revenue), `${m.changePct}%`]);
    r.getCell(3).font = { color: { argb: "FFDC2626" } };
  }

  // ── Magasins ──
  const stores = wb.addWorksheet("Magasins");
  stores.columns = [{ width: 30 }, { width: 16 }, { width: 14 }];
  title(stores, "Performance des magasins");
  headerRow(stores, ["Magasin", "CA", "Évolution"]);
  for (const s of data.dashboard.topStores) {
    const r = stores.addRow([s.name, Math.round(s.revenue), `${s.changePct >= 0 ? "+" : ""}${s.changePct}%`]);
    r.getCell(3).font = { color: { argb: s.changePct >= 0 ? "FF059669" : "FFDC2626" } };
  }

  // ── Recommandations ──
  const recs = wb.addWorksheet("Recommandations");
  recs.columns = [{ width: 36 }, { width: 40 }, { width: 16 }, { width: 12 }];
  title(recs, "Recommandations IA");
  headerRow(recs, ["Recommandation", "Actions", "Impact / CA menacé", "Confiance"]);
  for (const r of data.recommendations) {
    recs.addRow([
      r.title,
      r.actions.map((a) => a.label).join(" · "),
      r.revenueAtRisk ? `~${Math.round(r.revenueAtRisk)} ${data.currency} menacés` : `+${r.estimatedUplift}%`,
      `${(r.confidence * 100).toFixed(0)}%`,
    ]);
  }

  const out = await wb.xlsx.writeBuffer();
  return Buffer.from(out);
}

function title(ws: ExcelJS.Worksheet, text: string) {
  const row = ws.addRow([text]);
  row.font = { bold: true, size: 14, color: { argb: BRAND } };
  ws.addRow([]);
}

function headerRow(ws: ExcelJS.Worksheet, headers: string[]) {
  const row = ws.addRow(headers);
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND } };
    cell.alignment = { vertical: "middle" };
  });
}

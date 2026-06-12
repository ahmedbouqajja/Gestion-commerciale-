import PDFDocument from "pdfkit";
import { PERIOD_LABEL } from "./commentary.js";
import type { ReportData } from "./types.js";

/**
 * Renders a corporate-style PDF report with pdfkit (built-in Helvetica fonts —
 * no headless browser or external assets required). Returns a Buffer.
 */

const BRAND = "#4f46e5";
const SLATE = "#334155";
const MUTED = "#64748b";
const GREEN = "#059669";
const RED = "#dc2626";

const fmt = (n: number) => new Intl.NumberFormat("fr-MA").format(Math.round(n));

export function renderPdf(data: ReportData): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  const pageWidth = doc.page.width - 100; // content width with margins

  // ── Header band ──
  doc.rect(0, 0, doc.page.width, 90).fill(BRAND);
  doc.fillColor("#ffffff").fontSize(22).font("Helvetica-Bold").text("Smart Promo AI", 50, 28);
  doc.fontSize(11).font("Helvetica").text(`Rapport ${PERIOD_LABEL[data.period]} — ${data.tenantName}`, 50, 56);
  doc
    .fontSize(9)
    .text(`Généré le ${data.generatedAt.toLocaleDateString("fr-FR")}`, 50, 56, { width: pageWidth, align: "right" });
  doc.y = 120;

  section(doc, "Indicateurs clés");
  kpiGrid(doc, data, pageWidth);

  section(doc, "Synthèse exécutive");
  doc.fontSize(10).font("Helvetica").fillColor(SLATE);
  for (const p of data.commentary) {
    doc.text(p, { width: pageWidth, align: "justify" });
    doc.moveDown(0.6);
  }

  section(doc, "Mouvements produits");
  twoColMovers(doc, data, pageWidth);

  if (data.dashboard.topStores.length) {
    section(doc, "Performance des magasins");
    storeTable(doc, data, pageWidth);
  }

  ensureSpace(doc, 120);
  section(doc, "Recommandations IA");
  recommendations(doc, data, pageWidth);

  // Footer on every page.
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc
      .fontSize(8)
      .fillColor(MUTED)
      .text(`Smart Promo AI · Confidentiel · page ${i + 1}/${range.count}`, 50, doc.page.height - 40, {
        width: pageWidth,
        align: "center",
      });
  }

  doc.end();
  return done;
}

function section(doc: PDFKit.PDFDocument, title: string) {
  ensureSpace(doc, 60);
  doc.moveDown(0.8);
  doc.fillColor(BRAND).fontSize(13).font("Helvetica-Bold").text(title);
  doc.moveTo(50, doc.y + 2).lineTo(doc.page.width - 50, doc.y + 2).strokeColor("#e2e8f0").stroke();
  doc.moveDown(0.6);
}

function kpiGrid(doc: PDFKit.PDFDocument, data: ReportData, width: number) {
  const kpis = data.dashboard.kpis;
  const cols = 2;
  const gap = 12;
  const cardW = (width - gap) / cols;
  const cardH = 56;
  const startX = 50;
  let x = startX;
  let y = doc.y;
  kpis.forEach((k, i) => {
    doc.roundedRect(x, y, cardW, cardH, 6).fill("#f1f5f9");
    doc.fillColor(MUTED).fontSize(9).font("Helvetica").text(k.label, x + 12, y + 10, { width: cardW - 24 });
    doc.fillColor(SLATE).fontSize(15).font("Helvetica-Bold").text(`${fmt(k.value)} ${data.currency}`, x + 12, y + 26);
    if (k.changePct !== undefined) {
      doc
        .fillColor(k.changePct >= 0 ? GREEN : RED)
        .fontSize(9)
        .font("Helvetica")
        .text(`${k.changePct >= 0 ? "+" : ""}${k.changePct}%`, x + 12, y + 26, { width: cardW - 24, align: "right" });
    }
    if (i % cols === cols - 1) {
      x = startX;
      y += cardH + gap;
    } else {
      x += cardW + gap;
    }
  });
  doc.y = y + (kpis.length % cols === 0 ? 0 : cardH + gap);
  doc.x = 50;
}

function twoColMovers(doc: PDFKit.PDFDocument, data: ReportData, width: number) {
  const colW = (width - 20) / 2;
  const top = doc.y;
  list(doc, 50, top, colW, "En croissance", data.dashboard.topGrowers.slice(0, 5).map((m) => [m.name, `+${m.changePct}%`]), GREEN);
  const leftEnd = doc.y;
  list(doc, 50 + colW + 20, top, colW, "En baisse", data.dashboard.topDecliners.slice(0, 5).map((m) => [m.name, `${m.changePct}%`]), RED);
  doc.y = Math.max(leftEnd, doc.y);
  doc.x = 50;
}

function list(doc: PDFKit.PDFDocument, x: number, y: number, w: number, title: string, rows: [string, string][], accent: string) {
  doc.fillColor(SLATE).fontSize(10).font("Helvetica-Bold").text(title, x, y, { width: w });
  let cy = doc.y + 4;
  doc.fontSize(9).font("Helvetica");
  if (!rows.length) {
    doc.fillColor(MUTED).text("—", x, cy, { width: w });
    return;
  }
  for (const [label, val] of rows) {
    doc.fillColor(SLATE).text(label, x, cy, { width: w - 50, ellipsis: true });
    doc.fillColor(accent).text(val, x + w - 50, cy, { width: 50, align: "right" });
    cy += 14;
  }
  doc.y = cy;
}

function storeTable(doc: PDFKit.PDFDocument, data: ReportData, width: number) {
  const rows = data.dashboard.topStores.slice(0, 6);
  const c1 = width * 0.5;
  const c2 = width * 0.3;
  const c3 = width * 0.2;
  let y = doc.y;
  doc.fontSize(9).font("Helvetica-Bold").fillColor(MUTED);
  doc.text("Magasin", 50, y, { width: c1 });
  doc.text("CA", 50 + c1, y, { width: c2, align: "right" });
  doc.text("Évol.", 50 + c1 + c2, y, { width: c3, align: "right" });
  y += 16;
  doc.font("Helvetica");
  for (const s of rows) {
    ensureSpace(doc, 20);
    y = doc.y;
    doc.fillColor(SLATE).text(s.name, 50, y, { width: c1, ellipsis: true });
    doc.fillColor(SLATE).text(`${fmt(s.revenue)} ${data.currency}`, 50 + c1, y, { width: c2, align: "right" });
    doc.fillColor(s.changePct >= 0 ? GREEN : RED).text(`${s.changePct >= 0 ? "+" : ""}${s.changePct}%`, 50 + c1 + c2, y, { width: c3, align: "right" });
    doc.moveDown(0.4);
  }
  doc.x = 50;
}

function recommendations(doc: PDFKit.PDFDocument, data: ReportData, width: number) {
  const recs = data.recommendations.slice(0, 6);
  if (!recs.length) {
    doc.fontSize(10).font("Helvetica").fillColor(MUTED).text("Aucune recommandation active.");
    return;
  }
  for (const r of recs) {
    ensureSpace(doc, 70);
    const isRisk = r.drivers.includes("STOCKOUT");
    doc.fillColor(isRisk ? RED : BRAND).fontSize(10).font("Helvetica-Bold").text(r.title, { width: width });
    doc.fillColor(SLATE).fontSize(9).font("Helvetica").text(r.rationale, { width });
    doc.fillColor(MUTED).fontSize(9).text(`Actions : ${r.actions.map((a) => a.label).join(" · ")}`, { width });
    const impact = r.revenueAtRisk
      ? `CA menacé : ~${fmt(r.revenueAtRisk)} ${data.currency}`
      : `Impact estimé : +${r.estimatedUplift}%`;
    doc.fillColor(isRisk ? RED : GREEN).fontSize(9).font("Helvetica-Bold").text(`${impact}  ·  confiance ${(r.confidence * 100).toFixed(0)}%`, { width });
    doc.moveDown(0.6);
  }
  doc.x = 50;
}

function ensureSpace(doc: PDFKit.PDFDocument, needed: number) {
  if (doc.y + needed > doc.page.height - 60) doc.addPage();
}

import { Router } from "express";
import { z } from "zod";
import ExcelJS from "exceljs";
import { authenticate } from "../middleware/auth.js";
import {
  askAssistant,
  getContext,
  getDashboard,
  getProductForecast,
  getRecommendations,
  getReorderSuggestions,
  listProducts,
  listStores,
} from "../services/intelligence.js";

/**
 * All AI/analytics endpoints. Protected by JWT; each handler is scoped to
 * req.auth.tenantId (data falls back to the demo dataset when the tenant has
 * no data / no database is configured).
 */
const router = Router();
router.use(authenticate);

router.get("/dashboard", async (req, res, next) => {
  try {
    res.json(await getDashboard(req.auth?.tenantId));
  } catch (e) {
    next(e);
  }
});

router.get("/context", async (_req, res, next) => {
  try {
    res.json(await getContext());
  } catch (e) {
    next(e);
  }
});

router.get("/recommendations", async (req, res, next) => {
  try {
    res.json(await getRecommendations(req.auth?.tenantId));
  } catch (e) {
    next(e);
  }
});

router.get("/products", async (req, res, next) => {
  try {
    res.json({ products: await listProducts(req.auth?.tenantId) });
  } catch (e) {
    next(e);
  }
});

router.get("/stores", async (req, res, next) => {
  try {
    res.json({ stores: await listStores(req.auth?.tenantId) });
  } catch (e) {
    next(e);
  }
});

router.get("/reorders", async (req, res, next) => {
  try {
    res.json({ reorders: await getReorderSuggestions(req.auth?.tenantId) });
  } catch (e) {
    next(e);
  }
});

// Ready-to-send supplier purchase order as an Excel file.
router.get("/reorders.xlsx", async (req, res, next) => {
  try {
    const reorders = await getReorderSuggestions(req.auth?.tenantId);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Commande fournisseur");
    sheet.addRow(["SKU", "Produit", "Stock", "Ventes/j", "Couverture (j)", "Qté à commander", "Coût unitaire", "Coût estimé"]);
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFF1F5" } };
    for (const r of reorders) {
      sheet.addRow([r.sku, r.name, r.stock, r.dailySales, r.daysOfCover, r.suggestedQty, r.unitCost, r.estimatedCost]);
    }
    const total = reorders.reduce((s, r) => s + r.estimatedCost, 0);
    const totalRow = sheet.addRow(["", "", "", "", "", "", "Total", total]);
    totalRow.font = { bold: true };
    sheet.columns.forEach((c, i) => (c.width = i === 1 ? 28 : 14));

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="commande_fournisseur_${new Date().toISOString().slice(0, 10)}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (e) {
    next(e);
  }
});

router.get("/forecast/:sku", async (req, res, next) => {
  try {
    const result = await getProductForecast(req.params.sku, req.auth?.tenantId);
    if (!result) return res.status(404).json({ error: "Produit introuvable." });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

const askSchema = z.object({ question: z.string().min(2) });
router.post("/assistant", async (req, res, next) => {
  try {
    const { question } = askSchema.parse(req.body);
    res.json(await askAssistant(question, req.auth?.tenantId));
  } catch (e) {
    next(e);
  }
});

export default router;

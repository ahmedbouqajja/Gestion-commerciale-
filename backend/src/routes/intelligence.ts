import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";
import {
  askAssistant,
  getContext,
  getDashboard,
  getProductForecast,
  getRecommendations,
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

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
 * All AI/analytics endpoints. Protected by JWT; in production each handler
 * would scope queries to req.auth.tenantId (the demo aggregator returns the
 * shared sample dataset).
 */
const router = Router();
router.use(authenticate);

router.get("/dashboard", async (_req, res, next) => {
  try {
    res.json(await getDashboard());
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

router.get("/recommendations", async (_req, res, next) => {
  try {
    res.json(await getRecommendations());
  } catch (e) {
    next(e);
  }
});

router.get("/products", (_req, res) => {
  res.json({ products: listProducts() });
});

router.get("/stores", (_req, res) => {
  res.json({ stores: listStores() });
});

router.get("/forecast/:sku", (req, res) => {
  const result = getProductForecast(req.params.sku);
  if (!result) return res.status(404).json({ error: "Produit introuvable." });
  res.json(result);
});

const askSchema = z.object({ question: z.string().min(2) });
router.post("/assistant", async (req, res, next) => {
  try {
    const { question } = askSchema.parse(req.body);
    res.json(await askAssistant(question));
  } catch (e) {
    next(e);
  }
});

export default router;

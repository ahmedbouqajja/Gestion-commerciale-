import { Router } from "express";
import { z } from "zod";
import { login, registerTenant, listUsers, getBilling, createUser, changePassword, resetTenantData } from "../services/authService.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { getAiSettings, setAiSettings, aiConfigEditable } from "../lib/aiConfig.js";

const router = Router();

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
const registerSchema = z.object({
  tenantName: z.string().min(2),
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    res.json(await login(email, password));
  } catch (err) {
    if (err instanceof Error && err.message === "Identifiants invalides.") {
      return res.status(401).json({ error: err.message });
    }
    next(err);
  }
});

router.post("/register", async (req, res, next) => {
  try {
    res.status(201).json(await registerTenant(registerSchema.parse(req.body)));
  } catch (err) {
    if (err instanceof Error && /déjà utilisé|indisponible/.test(err.message)) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

router.get("/me", authenticate, (req, res) => {
  res.json({ auth: req.auth });
});

router.get("/users", authenticate, async (req, res, next) => {
  try {
    res.json({ users: await listUsers(req.auth?.tenantId) });
  } catch (err) {
    next(err);
  }
});

const createUserSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["TENANT_ADMIN", "COMMERCIAL_DIRECTOR", "ZONE_MANAGER", "STORE_MANAGER", "ANALYST", "VIEWER"]),
});

router.post("/users", authenticate, authorize("TENANT_ADMIN"), async (req, res, next) => {
  try {
    const input = createUserSchema.parse(req.body);
    res.status(201).json(await createUser(req.auth?.tenantId, input));
  } catch (err) {
    if (err instanceof Error && /déjà utilisé|indisponible/.test(err.message)) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

const changePwSchema = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8) });
router.post("/change-password", authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = changePwSchema.parse(req.body);
    await changePassword(req.auth?.userId, currentPassword, newPassword);
    res.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && /incorrect|indisponible|introuvable/.test(err.message)) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

router.get("/billing", authenticate, async (req, res, next) => {
  try {
    res.json(await getBilling(req.auth?.tenantId));
  } catch (err) {
    next(err);
  }
});

// Réglages IA (Claude) — la clé n'est jamais renvoyée, seulement son état.
router.get("/ai-settings", authenticate, authorize("TENANT_ADMIN"), (_req, res) => {
  const { apiKey, model } = getAiSettings();
  res.json({ configured: Boolean(apiKey), model, editable: aiConfigEditable });
});

const aiSettingsSchema = z.object({
  apiKey: z.string().optional(), // omis = inchangé ; "" = désactiver l'IA
  model: z.enum(["claude-opus-4-8", "claude-sonnet-4-6", "claude-haiku-4-5"]).optional(),
});

router.post("/ai-settings", authenticate, authorize("TENANT_ADMIN"), (req, res, next) => {
  try {
    setAiSettings(aiSettingsSchema.parse(req.body));
    const current = getAiSettings();
    res.json({ ok: true, configured: Boolean(current.apiKey), model: current.model });
  } catch (err) {
    if (err instanceof Error && /indisponible/.test(err.message)) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

// Vide les données commerciales de la société (efface le jeu de démo).
router.post("/reset-data", authenticate, authorize("TENANT_ADMIN"), async (req, res, next) => {
  try {
    res.json(await resetTenantData(req.auth?.tenantId));
  } catch (err) {
    if (err instanceof Error && /indisponible/.test(err.message)) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

export default router;

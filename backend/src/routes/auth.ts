import { Router } from "express";
import { z } from "zod";
import { login, registerTenant, listUsers, getBilling, createUser, changePassword, resetTenantData } from "../services/authService.js";
import { authenticate, authorize } from "../middleware/auth.js";

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

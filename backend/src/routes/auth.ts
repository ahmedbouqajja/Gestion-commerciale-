import { Router } from "express";
import { z } from "zod";
import { login, registerTenant } from "../services/authService.js";
import { authenticate } from "../middleware/auth.js";

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

export default router;

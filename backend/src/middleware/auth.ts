import type { NextFunction, Request, Response } from "express";
import { verifyToken, type JwtPayload } from "../utils/auth.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: JwtPayload;
    }
  }
}

/** Require a valid JWT. Attaches the decoded payload (incl. tenantId) to req. */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token manquant." });
  }
  try {
    req.auth = verifyToken(header.slice(7));
    next();
  } catch {
    res.status(401).json({ error: "Token invalide ou expiré." });
  }
}

/**
 * Restrict a route to specific roles. Always allows SUPER_ADMIN.
 * Usage: router.post("/", authorize("TENANT_ADMIN", "COMMERCIAL_DIRECTOR"), handler)
 */
export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.auth?.role;
    if (!role) return res.status(401).json({ error: "Non authentifié." });
    if (role === "SUPER_ADMIN" || roles.includes(role)) return next();
    res.status(403).json({ error: "Permissions insuffisantes." });
  };
}

import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: "Ressource introuvable." });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Données invalides.", details: err.flatten() });
  }
  const message = err instanceof Error ? err.message : "Erreur interne du serveur.";
  if (process.env.NODE_ENV !== "test") console.error("[error]", err);
  res.status(500).json({ error: message });
}

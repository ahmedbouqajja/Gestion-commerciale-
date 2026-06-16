import path from "node:path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env, hasDatabase } from "./config/env.js";
import { DEMO_USER } from "./services/authService.js";
import authRoutes from "./routes/auth.js";
import intelligenceRoutes from "./routes/intelligence.js";
import importRoutes from "./routes/import.js";
import reportRoutes from "./routes/reports.js";
import { notFound, errorHandler } from "./middleware/error.js";

const app = express();

// CSP désactivée : en app de bureau l'interface est servie sur le même origine
// et Next.js injecte des scripts inline que la CSP par défaut bloquerait.
app.use(helmet({ contentSecurityPolicy: false }));
// Restrict origins in production via CORS_ORIGIN; "*" stays open for local dev.
const allowAllOrigins = env.corsOrigins.includes("*");
app.use(
  cors({
    origin: allowAllOrigins ? true : env.corsOrigins,
    credentials: !allowAllOrigins,
  }),
);
app.use(express.json({ limit: "5mb" }));
if (env.nodeEnv !== "test") app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", database: hasDatabase ? "connected" : "demo-mode", time: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/import", importRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api", intelligenceRoutes);

// ─── Interface (app de bureau) ──────────────────────────────────────────────
// Quand STATIC_DIR pointe vers le frontend Next.js exporté, l'API sert aussi
// l'interface sur le même port → un seul serveur, aucun navigateur séparé.
if (env.staticDir) {
  const staticDir = env.staticDir;
  app.use(express.static(staticDir, { extensions: ["html"], index: "index.html" }));
  // Repli : toute route hors /api et /health renvoie l'application.
  app.get(/^(?!\/(?:api|health)\b).*/, (_req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });
}

app.use(notFound);
app.use(errorHandler);

if (env.nodeEnv !== "test") {
  app.listen(env.port, () => {
    console.log(`\n🚀 Smart Promo AI ${env.staticDir ? "(API + interface)" : "API"} → http://localhost:${env.port}`);
    console.log(`   Base de données : ${hasDatabase ? "SQLite" : "MODE DÉMO (sans DB)"}`);
    if (!hasDatabase) {
      console.log(`   Connexion démo  : ${DEMO_USER.email} / ${DEMO_USER.password}`);
    }
  });
}

export { app };

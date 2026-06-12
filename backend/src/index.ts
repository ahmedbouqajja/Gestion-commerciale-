import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env, hasDatabase, usingInsecureJwtSecret } from "./config/env.js";
import { DEMO_USER } from "./services/authService.js";
import authRoutes from "./routes/auth.js";
import intelligenceRoutes from "./routes/intelligence.js";
import importRoutes from "./routes/import.js";
import reportRoutes from "./routes/reports.js";
import { notFound, errorHandler } from "./middleware/error.js";

const app = express();

app.use(helmet());
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

app.use(notFound);
app.use(errorHandler);

// Fail fast: never run in production on the built-in insecure JWT secret.
if (env.nodeEnv === "production" && usingInsecureJwtSecret) {
  console.error("FATAL: JWT_SECRET must be set to a strong secret in production.");
  process.exit(1);
}

if (env.nodeEnv !== "test") {
  app.listen(env.port, () => {
    console.log(`\n🚀 Smart Promo AI API → http://localhost:${env.port}`);
    console.log(`   Base de données : ${hasDatabase ? "PostgreSQL" : "MODE DÉMO (sans DB)"}`);
    if (!hasDatabase) {
      console.log(`   Connexion démo  : ${DEMO_USER.email} / ${DEMO_USER.password}`);
    }
  });
}

export { app };

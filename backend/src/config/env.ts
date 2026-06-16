import dotenv from "dotenv";
import path from "node:path";

// Load .env from repo root then backend/.env (the latter wins).
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
dotenv.config();

const INSECURE_JWT_FALLBACK = "dev-insecure-secret-change-me";

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL ?? "",
  jwtSecret: process.env.JWT_SECRET ?? INSECURE_JWT_FALLBACK,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  // Claude (Anthropic) — optionnel. Sans clé, le moteur fonctionne en mode règles.
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  anthropicModel: process.env.ANTHROPIC_MODEL ?? "claude-opus-4-8",
  openWeatherApiKey: process.env.OPENWEATHER_API_KEY ?? "",
  // Dossier du frontend exporté (Next.js `out/`). Renseigné en app de bureau
  // (Electron) pour que l'API serve aussi l'interface, sur le même port.
  staticDir: process.env.STATIC_DIR ?? "",
  // Comma-separated list of allowed origins. "*" (default in dev) allows all.
  corsOrigins: (process.env.CORS_ORIGIN ?? "*")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
};

export const hasDatabase = Boolean(env.databaseUrl);

/** True when running on the built-in insecure JWT fallback (dev/demo only). */
export const usingInsecureJwtSecret = env.jwtSecret === INSECURE_JWT_FALLBACK;

// Fail fast: never run in production on the built-in insecure JWT secret.
if (env.nodeEnv === "production" && usingInsecureJwtSecret) {
  throw new Error("JWT_SECRET must be set to a strong secret in production.");
}

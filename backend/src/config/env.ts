import dotenv from "dotenv";
import path from "node:path";

// Load .env from repo root then backend/.env (the latter wins).
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "dev-insecure-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  openWeatherApiKey: process.env.OPENWEATHER_API_KEY ?? "",
};

export const hasDatabase = Boolean(env.databaseUrl);

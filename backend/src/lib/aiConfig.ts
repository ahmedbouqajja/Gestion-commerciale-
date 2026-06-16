import fs from "node:fs";
import { env } from "../config/env.js";

/**
 * Réglages IA (clé Claude + modèle), source de vérité = fichier local.
 *
 * En application de bureau, Electron passe `APP_CONFIG_PATH` (→ config.json dans
 * le dossier utilisateur). La clé y est lue/écrite : elle reste sur le poste de
 * l'utilisateur et n'est jamais embarquée dans l'installateur. Saisie via la
 * page Paramètres ; prise en compte immédiate (le fichier est relu à chaque appel).
 *
 * Hors Electron (dev / tests), on se rabat sur les variables d'environnement
 * (`ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL`, typiquement via backend/.env).
 */

const configPath = process.env.APP_CONFIG_PATH ?? "";

/** Vrai en application de bureau : la clé est modifiable depuis Paramètres. */
export const aiConfigEditable = Boolean(configPath);

const DEFAULT_MODEL = "claude-opus-4-8";

export interface AiSettings {
  apiKey: string;
  model: string;
}

function readConfigFile(): Record<string, unknown> {
  if (!configPath) return {};
  try {
    return JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch {
    return {};
  }
}

/** Clé + modèle effectifs (fichier local prioritaire, sinon variables d'env). */
export function getAiSettings(): AiSettings {
  const file = readConfigFile();
  const apiKey = (typeof file.anthropicApiKey === "string" ? file.anthropicApiKey : env.anthropicApiKey) || "";
  const model = (typeof file.anthropicModel === "string" && file.anthropicModel) || env.anthropicModel || DEFAULT_MODEL;
  return { apiKey, model };
}

/**
 * Met à jour les réglages IA dans le fichier de config local.
 * `apiKey` omis = clé inchangée ; `apiKey: ""` = IA désactivée.
 * Disponible uniquement en application de bureau (`APP_CONFIG_PATH` défini).
 */
export function setAiSettings(opts: { apiKey?: string; model?: string }): void {
  if (!configPath) {
    throw new Error("Réglage de la clé indisponible ici (configurez ANTHROPIC_API_KEY côté serveur).");
  }
  const current = readConfigFile();
  if (opts.apiKey !== undefined) current.anthropicApiKey = opts.apiKey.trim();
  if (opts.model) current.anthropicModel = opts.model;
  fs.writeFileSync(configPath, JSON.stringify(current, null, 2));
}

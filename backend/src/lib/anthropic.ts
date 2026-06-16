import Anthropic from "@anthropic-ai/sdk";
import { getAiSettings } from "./aiConfig.js";

/**
 * Petit client Claude (Anthropic) pour reformuler les textes du moteur.
 *
 * L'intelligence reste calculée localement (chiffres, recommandations) ; Claude
 * sert uniquement à reformuler, en s'appuyant STRICTEMENT sur les faits fournis
 * dans le prompt (les consignes interdisent d'inventer des chiffres). Sans clé
 * configurée, tout fonctionne en mode règles : `generateText` renvoie `null` et
 * l'appelant utilise le texte calculé. La clé est lue dynamiquement (voir
 * `aiConfig`) → un changement dans Paramètres prend effet immédiatement.
 */

let client: Anthropic | null = null;
let clientKey = "";

function getClient(): { anthropic: Anthropic; model: string } | null {
  const { apiKey, model } = getAiSettings();
  if (!apiKey) return null;
  // Recrée le client si la clé a changé (saisie/MAJ depuis Paramètres).
  if (!client || clientKey !== apiKey) {
    client = new Anthropic({ apiKey });
    clientKey = apiKey;
  }
  return { anthropic: client, model };
}

/** Vrai quand une clé Claude est configurée. */
export function hasClaude(): boolean {
  return Boolean(getAiSettings().apiKey);
}

/**
 * Reformule via Claude à partir d'un prompt système + utilisateur.
 * Renvoie le texte produit, ou `null` si aucune clé n'est configurée ou en cas
 * d'erreur réseau/API (l'appelant se rabat alors sur le texte calculé).
 */
export async function generateText(
  system: string,
  user: string,
  maxTokens = 1024,
): Promise<string | null> {
  const c = getClient();
  if (!c) return null;

  try {
    const response = await c.anthropic.messages.create({
      model: c.model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();

    return text || null;
  } catch {
    // Réseau indisponible, quota, clé invalide… → repli sur le texte calculé.
    return null;
  }
}

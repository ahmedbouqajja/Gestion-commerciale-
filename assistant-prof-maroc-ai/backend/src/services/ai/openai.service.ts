// Couche fournisseur d'IA (OpenAI) — UNIQUE point d'appel au modèle externe.
// Le reste de l'application ne dépend que de cette interface : pour évoluer
// (autre fournisseur, modèle propriétaire, RAG), il suffit de modifier ce fichier.
import OpenAI from 'openai';
import { env } from '../../lib/env';
import { PLATFORM_NAME } from './prompts/system';

const client = env.openaiApiKey ? new OpenAI({ apiKey: env.openaiApiKey }) : null;

// Indique si le moteur IA est configuré (clé présente).
export const aiEnabled = Boolean(client);

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionOptions {
  temperature?: number;
}

export async function complete(messages: LLMMessage[], opts: CompletionOptions = {}): Promise<string> {
  if (!client) {
    return demoFallback(messages);
  }
  const res = await client.chat.completions.create({
    model: env.openaiModel,
    messages,
    temperature: opts.temperature ?? 0.7,
  });
  return res.choices[0]?.message?.content?.trim() || '';
}

// Contenu de démonstration lorsque le moteur IA n'est pas configuré.
// Reste 100 % à l'identité de la plateforme (aucune mention d'un fournisseur tiers).
function demoFallback(messages: LLMMessage[]): string {
  const userPrompt = messages.filter((m) => m.role === 'user').map((m) => m.content).join('\n');
  return `> ℹ️ Aperçu de démonstration généré par ${PLATFORM_NAME}.
> Le moteur de génération n'est pas encore activé sur cet environnement.

## Document généré (aperçu)

Demande prise en compte :

${userPrompt
  .split('\n')
  .map((l) => l.trim())
  .filter(Boolean)
  .map((l) => `- ${l}`)
  .join('\n')}

## Section 1
Contenu pédagogique de démonstration.

## Section 2
Contenu pédagogique de démonstration.

## Évaluation / Corrigé
Éléments de correction de démonstration.`;
}

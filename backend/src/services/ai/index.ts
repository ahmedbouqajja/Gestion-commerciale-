// Façade du AI Service — point d'entrée unique pour le reste de l'application.
//
// Architecture :
//   Frontend → Backend (cette façade) → Prompt Engineering → OpenAI → réponse
//
// Évolutivité (prévu pour les phases suivantes) :
//   - Étape de récupération documentaire (RAG) sur une base marocaine
//   - Import des manuels scolaires / base de connaissances propriétaire
//   - Bascule vers un modèle spécialisé sans impacter les contrôleurs
import { complete, aiEnabled } from './openai.service';
import { buildDocumentPrompt, buildChatSystemPrompt, type DocParams, type DocType, type Lang } from './prompts/builder';

// Point d'extension futur : enrichir le prompt avec un contexte documentaire (RAG).
// Pour le MVP, aucune récupération n'est effectuée.
async function retrieveContext(_params: DocParams): Promise<string | null> {
  return null;
}

export async function generateDocument(docType: DocType, params: DocParams): Promise<string> {
  const { system, user } = buildDocumentPrompt(docType, params);
  const context = await retrieveContext(params);
  const userContent = context ? `Contexte documentaire :\n${context}\n\n${user}` : user;
  return complete([
    { role: 'system', content: system },
    { role: 'user', content: userContent },
  ]);
}

export async function chat(
  history: { role: 'user' | 'assistant'; content: string }[],
  lang: Lang,
): Promise<string> {
  return complete([{ role: 'system', content: buildChatSystemPrompt(lang) }, ...history]);
}

export { aiEnabled };
export type { DocParams, DocType, Lang };

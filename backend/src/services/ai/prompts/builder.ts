// Module de Prompt Engineering.
// Adapte automatiquement la requête IA selon : matière, niveau scolaire,
// type de document et langue (Arabe/Français).
//
// Exemple : (Mathématiques + 6ème année primaire + Contrôle + fr)
// produit automatiquement un prompt pédagogique spécifique.
import { documentSystemPrompt, chatSystemPrompt, type Lang } from './system';
import { templates, type DocParams, type DocType } from '../templates';

export interface BuiltPrompt {
  system: string;
  user: string;
}

export function buildDocumentPrompt(docType: DocType, params: DocParams): BuiltPrompt {
  const template = templates[docType];
  if (!template) {
    throw new Error(`Type de document inconnu : ${docType}`);
  }
  return {
    system: documentSystemPrompt(params.language),
    user: template(params),
  };
}

export function buildChatSystemPrompt(lang: Lang): string {
  return chatSystemPrompt(lang);
}

export type { DocParams, DocType, Lang };

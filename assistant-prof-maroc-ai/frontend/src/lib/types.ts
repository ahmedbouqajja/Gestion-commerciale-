export type Lang = 'fr' | 'ar';
export type Plan = 'FREE' | 'PRO';
export type DocType = 'JDADA' | 'CONTROLE' | 'EXAMEN' | 'EXERCICES' | 'DEVOIR';

export interface User {
  id: string;
  name: string;
  email: string;
  school: string | null;
  subject: string | null;
  level: string | null;
  plan: Plan;
  language: Lang;
}

export interface Quota {
  plan: Plan;
  used: number;
  limit: number | null;
  remaining: number | null;
}

export interface DocumentSummary {
  id: string;
  type: DocType;
  title: string;
  subject: string | null;
  level: string | null;
  language: Lang;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentFull extends DocumentSummary {
  content: string;
  meta?: Record<string, unknown> | null;
}

export interface Stats {
  total: number;
  counts: Record<DocType, number>;
  recent: { id: string; type: DocType; title: string; createdAt: string }[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

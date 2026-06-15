import type { DocType } from './types';

// Niveaux scolaires du système marocain.
export const LEVELS = [
  '1ère année primaire',
  '2ème année primaire',
  '3ème année primaire',
  '4ème année primaire',
  '5ème année primaire',
  '6ème année primaire',
  '1ère année collège',
  '2ème année collège',
  '3ème année collège',
  'Tronc commun',
  '1ère année Bac',
  '2ème année Bac',
];

// Matières courantes.
export const SUBJECTS = [
  'Mathématiques',
  'Français',
  'Arabe',
  'Activité scientifique',
  'Physique-Chimie',
  'SVT',
  'Histoire-Géographie',
  'Éducation islamique',
  'Anglais',
  'Philosophie',
  'Informatique',
  'Éducation civique',
];

export const DOC_TYPE_META: Record<DocType, { color: string; labelFr: string; labelAr: string }> = {
  JDADA: { color: 'bg-blue-100 text-blue-700 border-blue-200', labelFr: 'Jdada', labelAr: 'جذاذة' },
  CONTROLE: { color: 'bg-amber-100 text-amber-700 border-amber-200', labelFr: 'Contrôle', labelAr: 'فرض' },
  EXAMEN: { color: 'bg-purple-100 text-purple-700 border-purple-200', labelFr: 'Examen', labelAr: 'امتحان' },
  EXERCICES: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', labelFr: 'Exercices', labelAr: 'تمارين' },
  DEVOIR: { color: 'bg-rose-100 text-rose-700 border-rose-200', labelFr: 'Devoir', labelAr: 'واجب' },
};

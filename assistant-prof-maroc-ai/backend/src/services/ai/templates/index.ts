// Templates de prompts pédagogiques par type de document.
// Chaque template construit la requête utilisateur adaptée à la langue.
import type { Lang } from '../prompts/system';

export type DocType = 'JDADA' | 'CONTROLE' | 'EXAMEN' | 'EXERCICES' | 'DEVOIR';

// Paramètres unifiés acceptés par le moteur de génération.
export interface DocParams {
  subject: string;
  level: string;
  language: Lang;
  // Jdada
  lesson?: string;
  duration?: string;
  // Contrôle
  chapter?: string;
  difficulty?: string; // facile | moyen | difficile
  // Examen
  scope?: string;
  examType?: string; // local | semestriel | blanc
  // Exercices / Devoir
  topic?: string;
  count?: number;
}

export type Template = (p: DocParams) => string;

const jdada: Template = (p) => {
  if (p.language === 'ar') {
    return `أنشئ جذاذة كاملة وجاهزة للطباعة بالمواصفات التالية:
- المادة: ${p.subject}
- المستوى الدراسي: ${p.level}
- الدرس: ${p.lesson || ''}
- المدة الزمنية: ${p.duration || 'غير محددة'}

يجب أن تتضمن الجذاذة الأقسام التالية بهذا الترتيب:
1. الأهداف التعلمية
2. الكفايات المستهدفة
3. المكتسبات القبلية
4. الوسائل التعليمية
5. مراحل سير الحصة (تقديم، بناء، استثمار) مع توقيت تقريبي
6. الأنشطة التعليمية التعلمية
7. التقويم
8. الدعم والمعالجة`;
  }
  return `Génère une Jdada (الجذاذة) complète et prête à imprimer avec les paramètres suivants :
- Matière : ${p.subject}
- Niveau scolaire : ${p.level}
- Leçon : ${p.lesson || ''}
- Durée du cours : ${p.duration || 'non précisée'}

La Jdada doit contenir les sections suivantes dans cet ordre :
1. Objectifs pédagogiques
2. Compétences visées
3. Prérequis
4. Supports et matériel didactique
5. Déroulement de la séance (mise en situation, construction, application) avec une estimation du temps par phase
6. Activités d'enseignement-apprentissage
7. Évaluation
8. Remédiation / Soutien`;
};

const controle: Template = (p) => {
  if (p.language === 'ar') {
    return `أنشئ فرضاً محروساً كاملاً وجاهزاً للطباعة:
- المادة: ${p.subject}
- المستوى: ${p.level}
- الفصل/المحور: ${p.chapter || ''}
- مستوى الصعوبة: ${p.difficulty || 'متوسط'}

يجب أن تتضمن الوثيقة:
1. ورقة الامتحان (التمارين/الأسئلة) مع رأس الورقة
2. عناصر الإجابة (التصحيح النموذجي)
3. سلم التنقيط مفصلاً (مجموع 20 نقطة)`;
  }
  return `Génère un Contrôle complet et prêt à imprimer :
- Matière : ${p.subject}
- Niveau : ${p.level}
- Chapitre : ${p.chapter || ''}
- Difficulté : ${p.difficulty || 'moyen'}

Le document doit contenir :
1. Le sujet du contrôle (exercices/questions) avec un en-tête (nom, classe, date)
2. Le corrigé détaillé
3. Le barème détaillé (total sur 20 points)`;
};

const examen: Template = (p) => {
  if (p.language === 'ar') {
    return `أنشئ امتحاناً (${p.examType || 'محلي'}) كاملاً وجاهزاً للطباعة:
- المادة: ${p.subject}
- المستوى: ${p.level}
- المحاور المعنية: ${p.scope || ''}

يجب أن تتضمن الوثيقة:
1. نسخة التلميذ (الامتحان كاملاً) مع رأس رسمي
2. التصحيح الرسمي
3. سلم التنقيط المفصل (مجموع 20 نقطة)`;
  }
  return `Génère un Examen (${p.examType || 'local'}) complet et prêt à imprimer :
- Matière : ${p.subject}
- Niveau : ${p.level}
- Chapitres / période couverte : ${p.scope || ''}

Le document doit contenir :
1. La version élève (l'examen complet) avec en-tête officiel
2. Le corrigé officiel
3. Le barème détaillé (total sur 20 points)`;
};

const exercices: Template = (p) => {
  const count = p.count || 10;
  if (p.language === 'ar') {
    return `أنشئ ${count} تمارين حول "${p.topic || ''}" لمادة ${p.subject} (المستوى: ${p.level}).
وزع التمارين على ثلاث مستويات: سهل، متوسط، صعب.
قدم لكل تمرين الحل الكامل في قسم "التصحيح" في نهاية الوثيقة.`;
  }
  return `Génère ${count} exercices sur "${p.topic || ''}" pour la matière ${p.subject} (niveau : ${p.level}).
Répartis les exercices en trois niveaux : faciles, moyens, difficiles.
Fournis la solution complète de chaque exercice dans une section "Corrigé" à la fin du document.`;
};

const devoir: Template = (p) => {
  if (p.language === 'ar') {
    return `أنشئ واجباً منزلياً حول "${p.topic || ''}" لمادة ${p.subject} (المستوى: ${p.level}).
يتضمن: تمارين منزلية، تمارين إضافية للمراجعة، والتصحيح في النهاية.`;
  }
  return `Génère un Devoir Maison sur "${p.topic || ''}" pour la matière ${p.subject} (niveau : ${p.level}).
Il doit contenir : des travaux à domicile, des exercices supplémentaires de révision, et le corrigé à la fin.`;
};

export const templates: Record<DocType, Template> = {
  JDADA: jdada,
  CONTROLE: controle,
  EXAMEN: examen,
  EXERCICES: exercices,
  DEVOIR: devoir,
};

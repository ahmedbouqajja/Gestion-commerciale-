'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Lang } from './types';

type Dict = Record<string, string>;

const fr: Dict = {
  appName: 'Assistant Prof Maroc AI',
  tagline: 'Préparez vos documents pédagogiques en quelques minutes grâce à l\'IA',
  // Nav / commun
  dashboard: 'Tableau de bord',
  jdada: 'Jdada',
  controles: 'Contrôles',
  examens: 'Examens',
  exercices: 'Exercices',
  devoirs: 'Devoirs Maison',
  bibliotheque: 'Bibliothèque',
  assistant: 'Assistant IA',
  profil: 'Profil',
  pricing: 'Tarifs',
  login: 'Connexion',
  register: 'Inscription',
  logout: 'Déconnexion',
  getStarted: 'Commencer gratuitement',
  generate: 'Générer',
  generating: 'Génération en cours…',
  save: 'Enregistrer',
  cancel: 'Annuler',
  edit: 'Modifier',
  duplicate: 'Dupliquer',
  delete: 'Supprimer',
  download: 'Télécharger',
  open: 'Ouvrir',
  back: 'Retour',
  send: 'Envoyer',
  loading: 'Chargement…',
  // Champs
  subject: 'Matière',
  level: 'Niveau scolaire',
  lesson: 'Leçon',
  duration: 'Durée du cours',
  chapter: 'Chapitre',
  difficulty: 'Difficulté',
  scope: 'Chapitres / période',
  examType: 'Type d\'examen',
  topic: 'Sujet / thème',
  count: 'Nombre d\'exercices',
  easy: 'Facile',
  medium: 'Moyen',
  hard: 'Difficile',
  examLocal: 'Local',
  examSemestriel: 'Semestriel',
  examBlanc: 'Blanc',
  // Auth
  name: 'Nom complet',
  email: 'Email',
  password: 'Mot de passe',
  school: 'Établissement',
  noAccount: 'Pas encore de compte ?',
  haveAccount: 'Déjà un compte ?',
  signIn: 'Se connecter',
  signUp: 'Créer mon compte',
  // Dashboard
  documentsCreated: 'Documents créés',
  recentDocuments: 'Documents récents',
  quickAccess: 'Accès rapide',
  welcome: 'Bienvenue',
  quotaUsed: 'Générations ce mois-ci',
  unlimited: 'Illimité',
  upgradePrompt: 'Passez au Pack Prof pour des générations illimitées',
  upgrade: 'Passer au Pack Prof',
  // Generators
  jdadaDesc: 'Générez une fiche pédagogique complète (objectifs, déroulement, évaluation, remédiation).',
  controleDesc: 'Générez un contrôle complet avec corrigé et barème.',
  examenDesc: 'Générez un examen avec version élève, corrigé officiel et barème.',
  exercicesDesc: 'Générez une banque d\'exercices classés par difficulté, avec solutions.',
  devoirsDesc: 'Générez des devoirs à domicile et exercices de révision avec corrigé.',
  // Library
  libraryEmpty: 'Aucun document pour le moment. Commencez par en générer un !',
  all: 'Tous',
  confirmDelete: 'Voulez-vous vraiment supprimer ce document ?',
  // Assistant
  assistantPlaceholder: 'Posez votre question pédagogique…',
  assistantIntro: 'Je suis votre assistant pédagogique. Demandez-moi une activité, une méthode d\'enseignement ou un conseil.',
  // Profil
  profileInfo: 'Informations du profil',
  changePassword: 'Changer le mot de passe',
  currentPassword: 'Mot de passe actuel',
  newPassword: 'Nouveau mot de passe',
  subscription: 'Abonnement',
  freePlan: 'Pack Gratuit',
  proPlan: 'Pack Prof',
  language: 'Langue',
  saved: 'Modifications enregistrées',
  // Pricing
  perMonth: '/ mois',
  free: 'Gratuit',
  freeFeature1: '5 générations par mois',
  freeFeature2: 'Tous les générateurs',
  freeFeature3: 'Export PDF et Word',
  proFeature1: 'Générations illimitées',
  proFeature2: 'Assistant IA prioritaire',
  proFeature3: 'Export PDF et Word',
  proFeature4: 'Support prioritaire',
  choosePlan: 'Choisir ce pack',
  currentPlan: 'Pack actuel',
  // Landing
  heroCta: 'Créez votre première Jdada gratuitement',
  feature1Title: 'Jdada en 2 minutes',
  feature1Desc: 'Générez des fiches pédagogiques conformes au programme marocain.',
  feature2Title: 'Contrôles & Examens',
  feature2Desc: 'Sujets, corrigés et barèmes prêts à imprimer.',
  feature3Title: 'Export PDF & Word',
  feature3Desc: 'Documents professionnels prêts à l\'emploi.',
  // Erreurs
  required: 'Ce champ est requis',
};

const ar: Dict = {
  appName: 'مساعد الأستاذ المغربي AI',
  tagline: 'حضّر وثائقك البيداغوجية في دقائق بفضل الذكاء الاصطناعي',
  dashboard: 'لوحة التحكم',
  jdada: 'الجذاذات',
  controles: 'الفروض',
  examens: 'الامتحانات',
  exercices: 'التمارين',
  devoirs: 'الواجبات المنزلية',
  bibliotheque: 'المكتبة',
  assistant: 'المساعد الذكي',
  profil: 'الملف الشخصي',
  pricing: 'الأثمنة',
  login: 'تسجيل الدخول',
  register: 'إنشاء حساب',
  logout: 'تسجيل الخروج',
  getStarted: 'ابدأ مجاناً',
  generate: 'توليد',
  generating: 'جاري التوليد…',
  save: 'حفظ',
  cancel: 'إلغاء',
  edit: 'تعديل',
  duplicate: 'نسخ',
  delete: 'حذف',
  download: 'تحميل',
  open: 'فتح',
  back: 'رجوع',
  send: 'إرسال',
  loading: 'جاري التحميل…',
  subject: 'المادة',
  level: 'المستوى الدراسي',
  lesson: 'الدرس',
  duration: 'مدة الحصة',
  chapter: 'الفصل / المحور',
  difficulty: 'مستوى الصعوبة',
  scope: 'المحاور / الفترة',
  examType: 'نوع الامتحان',
  topic: 'الموضوع',
  count: 'عدد التمارين',
  easy: 'سهل',
  medium: 'متوسط',
  hard: 'صعب',
  examLocal: 'محلي',
  examSemestriel: 'دوري',
  examBlanc: 'تجريبي',
  name: 'الاسم الكامل',
  email: 'البريد الإلكتروني',
  password: 'كلمة المرور',
  school: 'المؤسسة',
  noAccount: 'ليس لديك حساب؟',
  haveAccount: 'لديك حساب بالفعل؟',
  signIn: 'تسجيل الدخول',
  signUp: 'إنشاء حسابي',
  documentsCreated: 'الوثائق المنشأة',
  recentDocuments: 'آخر الوثائق',
  quickAccess: 'وصول سريع',
  welcome: 'مرحباً',
  quotaUsed: 'التوليدات هذا الشهر',
  unlimited: 'غير محدود',
  upgradePrompt: 'انتقل إلى الباقة الاحترافية لتوليدات غير محدودة',
  upgrade: 'الانتقال إلى الباقة الاحترافية',
  jdadaDesc: 'ولّد جذاذة كاملة (الأهداف، سير الحصة، التقويم، المعالجة).',
  controleDesc: 'ولّد فرضاً كاملاً مع التصحيح وسلم التنقيط.',
  examenDesc: 'ولّد امتحاناً مع نسخة التلميذ والتصحيح الرسمي وسلم التنقيط.',
  exercicesDesc: 'ولّد بنك تمارين مصنفة حسب الصعوبة مع الحلول.',
  devoirsDesc: 'ولّد واجبات منزلية وتمارين للمراجعة مع التصحيح.',
  libraryEmpty: 'لا توجد وثائق بعد. ابدأ بتوليد واحدة!',
  all: 'الكل',
  confirmDelete: 'هل تريد حقاً حذف هذه الوثيقة؟',
  assistantPlaceholder: 'اطرح سؤالك البيداغوجي…',
  assistantIntro: 'أنا مساعدك البيداغوجي. اطلب مني نشاطاً أو طريقة تدريس أو نصيحة.',
  profileInfo: 'معلومات الملف الشخصي',
  changePassword: 'تغيير كلمة المرور',
  currentPassword: 'كلمة المرور الحالية',
  newPassword: 'كلمة المرور الجديدة',
  subscription: 'الاشتراك',
  freePlan: 'الباقة المجانية',
  proPlan: 'الباقة الاحترافية',
  language: 'اللغة',
  saved: 'تم حفظ التعديلات',
  perMonth: '/ شهرياً',
  free: 'مجاني',
  freeFeature1: '5 توليدات شهرياً',
  freeFeature2: 'جميع المولّدات',
  freeFeature3: 'تصدير PDF و Word',
  proFeature1: 'توليدات غير محدودة',
  proFeature2: 'مساعد ذكي بأولوية',
  proFeature3: 'تصدير PDF و Word',
  proFeature4: 'دعم بأولوية',
  choosePlan: 'اختيار هذه الباقة',
  currentPlan: 'الباقة الحالية',
  heroCta: 'أنشئ أول جذاذة مجاناً',
  feature1Title: 'جذاذة في دقيقتين',
  feature1Desc: 'ولّد جذاذات مطابقة للمنهاج المغربي.',
  feature2Title: 'فروض وامتحانات',
  feature2Desc: 'مواضيع وتصحيحات وسلالم تنقيط جاهزة للطباعة.',
  feature3Title: 'تصدير PDF و Word',
  feature3Desc: 'وثائق احترافية جاهزة للاستعمال.',
  required: 'هذا الحقل مطلوب',
};

const dicts: Record<Lang, Dict> = { fr, ar };

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof typeof fr) => string;
  dir: 'ltr' | 'rtl';
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('fr');

  useEffect(() => {
    const stored = localStorage.getItem('apm_lang') as Lang | null;
    if (stored === 'fr' || stored === 'ar') setLangState(stored);
  }, []);

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('apm_lang', l);
  };

  const t = (key: keyof typeof fr) => dicts[lang][key] ?? dicts.fr[key] ?? String(key);

  return <I18nContext.Provider value={{ lang, setLang, t, dir }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n doit être utilisé dans I18nProvider');
  return ctx;
}

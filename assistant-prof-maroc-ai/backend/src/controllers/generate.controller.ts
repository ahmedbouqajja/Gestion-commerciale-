import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/error';
import { AuthedRequest } from '../middleware/auth';
import { assertCanGenerate, incrementUsage, getQuota } from '../services/usage.service';
import { generateDocument, aiEnabled } from '../services/ai';
import { Prisma } from '@prisma/client';
import type { DocType } from '@prisma/client';

const lang = z.enum(['fr', 'ar']).default('fr');

const jdadaSchema = z.object({
  subject: z.string().min(1, 'Matière requise'),
  level: z.string().min(1, 'Niveau requis'),
  lesson: z.string().min(1, 'Leçon requise'),
  duration: z.string().optional(),
  language: lang,
});

const controleSchema = z.object({
  subject: z.string().min(1, 'Matière requise'),
  level: z.string().min(1, 'Niveau requis'),
  chapter: z.string().min(1, 'Chapitre requis'),
  difficulty: z.enum(['facile', 'moyen', 'difficile']).default('moyen'),
  language: lang,
});

const examenSchema = z.object({
  subject: z.string().min(1, 'Matière requise'),
  level: z.string().min(1, 'Niveau requis'),
  scope: z.string().min(1, 'Chapitres / période requis'),
  examType: z.enum(['local', 'semestriel', 'blanc']).default('local'),
  language: lang,
});

const exercicesSchema = z.object({
  subject: z.string().min(1, 'Matière requise'),
  level: z.string().min(1, 'Niveau requis'),
  topic: z.string().min(1, 'Sujet requis'),
  count: z.number().int().min(1).max(50).default(10),
  language: lang,
});

const devoirSchema = z.object({
  subject: z.string().min(1, 'Matière requise'),
  level: z.string().min(1, 'Niveau requis'),
  topic: z.string().min(1, 'Sujet requis'),
  language: lang,
});

async function persist(
  userId: string,
  plan: 'FREE' | 'PRO',
  type: DocType,
  title: string,
  subject: string,
  level: string,
  language: string,
  content: string,
  meta: Record<string, unknown>,
  res: Response,
) {
  const document = await prisma.document.create({
    data: { userId, type, title, subject, level, language, content, meta: meta as Prisma.InputJsonValue },
  });
  await incrementUsage(userId);
  const quota = await getQuota(userId, plan);
  res.status(201).json({ document, quota, aiEnabled });
}

export const jdada = asyncHandler(async (req: AuthedRequest, res) => {
  const input = jdadaSchema.parse(req.body);
  await assertCanGenerate(req.user!.id, req.user!.plan);
  const content = await generateDocument('JDADA', input);
  const title = `Jdada — ${input.lesson} (${input.subject})`;
  await persist(req.user!.id, req.user!.plan, 'JDADA', title, input.subject, input.level, input.language, content, input, res);
});

export const controle = asyncHandler(async (req: AuthedRequest, res) => {
  const input = controleSchema.parse(req.body);
  await assertCanGenerate(req.user!.id, req.user!.plan);
  const content = await generateDocument('CONTROLE', input);
  const title = `Contrôle — ${input.chapter} (${input.subject})`;
  await persist(req.user!.id, req.user!.plan, 'CONTROLE', title, input.subject, input.level, input.language, content, input, res);
});

export const examen = asyncHandler(async (req: AuthedRequest, res) => {
  const input = examenSchema.parse(req.body);
  await assertCanGenerate(req.user!.id, req.user!.plan);
  const content = await generateDocument('EXAMEN', input);
  const title = `Examen ${input.examType} — ${input.subject} (${input.level})`;
  await persist(req.user!.id, req.user!.plan, 'EXAMEN', title, input.subject, input.level, input.language, content, input, res);
});

export const exercices = asyncHandler(async (req: AuthedRequest, res) => {
  const input = exercicesSchema.parse(req.body);
  await assertCanGenerate(req.user!.id, req.user!.plan);
  const content = await generateDocument('EXERCICES', input);
  const title = `${input.count} exercices — ${input.topic} (${input.subject})`;
  await persist(req.user!.id, req.user!.plan, 'EXERCICES', title, input.subject, input.level, input.language, content, input, res);
});

export const devoir = asyncHandler(async (req: AuthedRequest, res) => {
  const input = devoirSchema.parse(req.body);
  await assertCanGenerate(req.user!.id, req.user!.plan);
  const content = await generateDocument('DEVOIR', input);
  const title = `Devoir Maison — ${input.topic} (${input.subject})`;
  await persist(req.user!.id, req.user!.plan, 'DEVOIR', title, input.subject, input.level, input.language, content, input, res);
});

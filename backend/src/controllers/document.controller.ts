import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/error';
import { AuthedRequest } from '../middleware/auth';
import { notFound } from '../lib/http';
import { toPdf, toDocx } from '../services/export.service';
import type { DocType } from '@prisma/client';

const TYPES = ['JDADA', 'CONTROLE', 'EXAMEN', 'EXERCICES', 'DEVOIR'] as const;

export const list = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const typeParam = req.query.type as string | undefined;
  const where: { userId: string; type?: DocType } = { userId: req.user!.id };
  if (typeParam && (TYPES as readonly string[]).includes(typeParam)) {
    where.type = typeParam as DocType;
  }
  const documents = await prisma.document.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: { id: true, type: true, title: true, subject: true, level: true, language: true, createdAt: true, updatedAt: true },
  });
  res.json({ documents });
});

export const get = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const document = await prisma.document.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!document) throw notFound('Document introuvable');
  res.json({ document });
});

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
});

export const update = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const data = updateSchema.parse(req.body);
  const existing = await prisma.document.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
  if (!existing) throw notFound('Document introuvable');
  const document = await prisma.document.update({ where: { id: existing.id }, data });
  res.json({ document });
});

export const duplicate = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const existing = await prisma.document.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
  if (!existing) throw notFound('Document introuvable');
  const document = await prisma.document.create({
    data: {
      userId: existing.userId,
      type: existing.type,
      title: `${existing.title} (copie)`,
      subject: existing.subject,
      level: existing.level,
      language: existing.language,
      content: existing.content,
      meta: existing.meta ?? undefined,
    },
  });
  res.status(201).json({ document });
});

export const remove = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const existing = await prisma.document.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
  if (!existing) throw notFound('Document introuvable');
  await prisma.document.delete({ where: { id: existing.id } });
  res.json({ success: true });
});

function safeFilename(title: string): string {
  return title.replace(/[^a-zA-Z0-9؀-ۿ -]/g, '').replace(/\s+/g, '_').slice(0, 60) || 'document';
}

export const exportFile = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const format = (req.params.format || '').toLowerCase();
  const document = await prisma.document.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
  if (!document) throw notFound('Document introuvable');

  const filename = safeFilename(document.title);

  if (format === 'pdf') {
    const buf = await toPdf(document.title, document.content);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
    return res.send(buf);
  }
  if (format === 'docx' || format === 'word') {
    const buf = await toDocx(document.title, document.content);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.docx"`);
    return res.send(buf);
  }
  throw notFound('Format non supporté (pdf ou docx)');
});

export const stats = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const userId = req.user!.id;
  const [total, byType, recent] = await Promise.all([
    prisma.document.count({ where: { userId } }),
    prisma.document.groupBy({ by: ['type'], where: { userId }, _count: true }),
    prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, type: true, title: true, createdAt: true },
    }),
  ]);
  const counts: Record<string, number> = {};
  for (const t of TYPES) counts[t] = 0;
  for (const row of byType) counts[row.type] = row._count;
  res.json({ total, counts, recent });
});

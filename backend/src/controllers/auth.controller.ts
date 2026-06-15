import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { signToken } from '../lib/jwt';
import { badRequest, unauthorized } from '../lib/http';
import { asyncHandler } from '../middleware/error';
import { AuthedRequest } from '../middleware/auth';
import { getQuota } from '../services/usage.service';

const registerSchema = z.object({
  name: z.string().min(2, 'Le nom est trop court'),
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  school: z.string().optional(),
  subject: z.string().optional(),
  level: z.string().optional(),
  language: z.enum(['fr', 'ar']).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

function publicUser(u: { id: string; name: string; email: string; school: string | null; subject: string | null; level: string | null; plan: string; language: string }) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    school: u.school,
    subject: u.subject,
    level: u.level,
    plan: u.plan,
    language: u.language,
  };
}

export const register = asyncHandler(async (req, res: Response) => {
  const data = registerSchema.parse(req.body);
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw badRequest('Un compte existe déjà avec cet email');

  const hash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hash,
      school: data.school,
      subject: data.subject,
      level: data.level,
      language: data.language ?? 'fr',
    },
  });

  const token = signToken({ userId: user.id, email: user.email });
  res.status(201).json({ token, user: publicUser(user) });
});

export const login = asyncHandler(async (req, res: Response) => {
  const data = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) throw unauthorized('Email ou mot de passe incorrect');

  const ok = await bcrypt.compare(data.password, user.password);
  if (!ok) throw unauthorized('Email ou mot de passe incorrect');

  const token = signToken({ userId: user.id, email: user.email });
  res.json({ token, user: publicUser(user) });
});

export const me = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) throw unauthorized();
  const quota = await getQuota(user.id, user.plan);
  res.json({ user: publicUser(user), quota });
});

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  school: z.string().optional(),
  subject: z.string().optional(),
  level: z.string().optional(),
  language: z.enum(['fr', 'ar']).optional(),
});

export const updateProfile = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const data = updateSchema.parse(req.body);
  const user = await prisma.user.update({ where: { id: req.user!.id }, data });
  res.json({ user: publicUser(user) });
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, 'Le nouveau mot de passe doit contenir au moins 6 caractères'),
});

export const changePassword = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const data = passwordSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) throw unauthorized();
  const ok = await bcrypt.compare(data.currentPassword, user.password);
  if (!ok) throw badRequest('Mot de passe actuel incorrect');
  const hash = await bcrypt.hash(data.newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { password: hash } });
  res.json({ success: true });
});

// MVP : simulation d'activation du Pack Prof (intégration CMI/PayPal à venir).
export const upgradePlan = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const user = await prisma.user.update({ where: { id: req.user!.id }, data: { plan: 'PRO' } });
  res.json({ user: publicUser(user) });
});

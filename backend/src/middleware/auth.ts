import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/jwt';
import { unauthorized } from '../lib/http';
import { prisma } from '../lib/prisma';
import type { Plan } from '@prisma/client';

export interface AuthedRequest extends Request {
  user?: { id: string; email: string; plan: Plan };
}

export async function authenticate(req: AuthedRequest, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw unauthorized();
    }
    const token = header.slice(7);
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, plan: true },
    });
    if (!user) throw unauthorized('Utilisateur introuvable');
    req.user = user;
    next();
  } catch (err) {
    if ((err as { name?: string }).name === 'JsonWebTokenError' || (err as { name?: string }).name === 'TokenExpiredError') {
      next(unauthorized('Session expirée, veuillez vous reconnecter'));
    } else {
      next(err);
    }
  }
}

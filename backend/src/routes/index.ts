import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middleware/auth';
import * as auth from '../controllers/auth.controller';
import * as gen from '../controllers/generate.controller';
import * as docs from '../controllers/document.controller';
import * as chatCtrl from '../controllers/chat.controller';
import { aiEnabled } from '../services/ai';

const router = Router();

// Limite les appels de génération IA pour éviter les abus.
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes, réessayez dans une minute.' },
});

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50 });

router.get('/health', (_req, res) => res.json({ status: 'ok', aiEnabled }));

// Authentification
router.post('/auth/register', authLimiter, auth.register);
router.post('/auth/login', authLimiter, auth.login);
router.get('/auth/me', authenticate, auth.me);
router.patch('/auth/profile', authenticate, auth.updateProfile);
router.patch('/auth/password', authenticate, auth.changePassword);
router.post('/auth/upgrade', authenticate, auth.upgradePlan);

// Générateurs IA
router.post('/generate/jdada', authenticate, aiLimiter, gen.jdada);
router.post('/generate/controle', authenticate, aiLimiter, gen.controle);
router.post('/generate/examen', authenticate, aiLimiter, gen.examen);
router.post('/generate/exercices', authenticate, aiLimiter, gen.exercices);
router.post('/generate/devoir', authenticate, aiLimiter, gen.devoir);

// Assistant IA (chat)
router.post('/chat', authenticate, aiLimiter, chatCtrl.chat);

// Bibliothèque / documents
router.get('/documents/stats', authenticate, docs.stats);
router.get('/documents', authenticate, docs.list);
router.get('/documents/:id', authenticate, docs.get);
router.patch('/documents/:id', authenticate, docs.update);
router.post('/documents/:id/duplicate', authenticate, docs.duplicate);
router.delete('/documents/:id', authenticate, docs.remove);
router.get('/documents/:id/export/:format', authenticate, docs.exportFile);

export default router;

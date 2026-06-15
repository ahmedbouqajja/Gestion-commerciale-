import { Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/error';
import { AuthedRequest } from '../middleware/auth';
import { chat as aiChat, aiEnabled } from '../services/ai';

const schema = z.object({
  language: z.enum(['fr', 'ar']).default('fr'),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1),
      }),
    )
    .min(1, 'Au moins un message requis')
    .max(30),
});

export const chat = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { messages, language } = schema.parse(req.body);
  const reply = await aiChat(messages, language);
  res.json({ reply, aiEnabled });
});

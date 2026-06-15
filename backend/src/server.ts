import express from 'express';
import cors from 'cors';
import { env } from './lib/env';
import routes from './routes';
import { errorHandler } from './middleware/error';

const app = express();

app.use(
  cors({
    origin: env.frontendUrl === '*' ? true : env.frontendUrl.split(',').map((s) => s.trim()),
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));

app.use('/api', routes);

app.use((_req, res) => res.status(404).json({ error: 'Route introuvable' }));
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`🚀 Assistant Prof Maroc AI — API démarrée sur http://localhost:${env.port}`);
  console.log(`   Environnement : ${env.nodeEnv}`);
  console.log(`   OpenAI : ${env.openaiApiKey ? 'activé' : 'mode démo (clé absente)'}`);
});

export default app;

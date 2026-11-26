import express from 'express';
import { errorHandler, notFoundHandler } from './errors/error-handler';
import { translateRateLimit } from './middlewares/rate-limit';
import { languagesRouter } from './routes/languages';
import { translateRouter } from './routes/translate';
import { usageRouter } from './routes/usage';

export function createApp() {
  const app = express();

  app.use(express.json());

  app.get('/test', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/translate', translateRateLimit, translateRouter);
  app.use('/languages', languagesRouter);
  app.use('/usage', usageRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

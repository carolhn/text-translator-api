import express from 'express';
import { errorHandler, notFoundHandler } from './errors/error-handler';
import { languagesRouter } from './routes/languages';
import { translateRouter } from './routes/translate';

export function createApp() {
  const app = express();

  app.use(express.json());

  app.get('/test', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/translate', translateRouter);
  app.use('/languages', languagesRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

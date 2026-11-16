import express from 'express';
import { errorHandler, notFoundHandler } from './errors/error-handler';

export function createApp() {
  const app = express();

  app.use(express.json());

  app.get('/test', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

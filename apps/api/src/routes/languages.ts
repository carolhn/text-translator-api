import { Router } from 'express';
import { getLanguages } from '../services/languages';

export const languagesRouter = Router();

languagesRouter.get('/', async (_req, res) => {
  res.json(await getLanguages());
});

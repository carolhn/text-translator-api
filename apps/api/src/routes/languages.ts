import { Router } from 'express';
import { getLanguages } from '../services/deepl';

export const languagesRouter = Router();

languagesRouter.get('/', async (_req, res) => {
  res.json(await getLanguages());
});

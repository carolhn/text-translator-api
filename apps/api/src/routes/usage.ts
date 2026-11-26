import { Router } from 'express';
import { getUsage } from '../providers/deepl';

export const usageRouter = Router();

usageRouter.get('/', async (_req, res) => {
  res.json(await getUsage());
});

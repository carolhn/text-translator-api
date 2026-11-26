import { Router } from 'express';
import { getUsage } from '../services/usage';

export const usageRouter = Router();

usageRouter.get('/', async (_req, res) => {
  res.json(await getUsage());
});

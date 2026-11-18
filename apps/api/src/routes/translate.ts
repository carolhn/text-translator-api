import type { TranslateResponse } from '@translator/shared';
import { Router } from 'express';
import { z } from 'zod';
import { createAppError } from '../errors/app-error';
import { translateSchema } from '../schemas/translate';
import { translateWithDeepL } from '../services/translation';

export const translateRouter = Router();

translateRouter.post('/', async (req, res) => {
  const parsed = translateSchema.safeParse(req.body);

  if (!parsed.success) {
    throw createAppError(400, 'VALIDATION_ERROR', z.prettifyError(parsed.error));
  }

  const { text, targetLang, sourceLang } = parsed.data;
  const result: TranslateResponse = await translateWithDeepL(text, targetLang, sourceLang);

  res.json(result);
});

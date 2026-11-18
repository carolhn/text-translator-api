import { z } from 'zod';
import { env } from '../config/env';

const langCode = z
  .string()
  .trim()
  .min(2)
  .max(10)
  .transform((value) => value.toUpperCase());

export const translateSchema = z.object({
  text: z.string().trim().min(1).max(env.MAX_TEXT_LENGTH),
  targetLang: langCode,
  sourceLang: langCode.optional(),
});

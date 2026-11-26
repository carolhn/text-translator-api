import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3333),
  DEEPL_API_KEY: z.string().min(10),
  DEEPL_API_URL: z.url().default('https://api-free.deepl.com'),
  MAX_TEXT_LENGTH: z.coerce.number().int().positive().default(1500),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('Invalid environment variables:\n' + z.prettifyError(result.error));
  process.exit(1);
}

export const env = result.data;

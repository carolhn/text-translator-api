import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { createAppError } from '../errors/app-error';

export const translateRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(createAppError(429, 'RATE_LIMITED', 'Too many requests, please try again later'));
  },
});

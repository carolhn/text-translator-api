import type { ApiError } from '@translator/shared';
import type { NextFunction, Request, Response } from 'express';
import { createAppError, isAppError } from './app-error';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (isAppError(err)) {
    const body: ApiError = { code: err.code, message: err.message };
    res.status(err.status).json(body);
    return;
  }

  if (err instanceof SyntaxError) {
    const body: ApiError = { code: 'INVALID_JSON', message: 'Request body is not valid JSON' };
    res.status(400).json(body);
    return;
  }

  console.error(err);
  const body: ApiError = { code: 'INTERNAL_ERROR', message: 'Unexpected error' };
  res.status(500).json(body);
}

export function notFoundHandler(req: Request, _res: Response) {
  throw createAppError(404, 'NOT_FOUND', `Route ${req.method} ${req.path} not found`);
}

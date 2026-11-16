export interface AppError extends Error {
  status: number;
  code: string;
}

export function createAppError(status: number, code: string, message: string): AppError {
  return Object.assign(new Error(message), { name: 'AppError', status, code });
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof Error && err.name === 'AppError';
}

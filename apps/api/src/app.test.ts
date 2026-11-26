import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from './app';

const { translateMock, getLanguagesMock, getUsageMock } = vi.hoisted(() => ({
  translateMock: vi.fn(),
  getLanguagesMock: vi.fn(),
  getUsageMock: vi.fn(),
}));

vi.mock('./services/translation', () => ({
  translateWithDeepL: translateMock,
}));

vi.mock('./services/languages', () => ({
  getLanguages: getLanguagesMock,
}));

vi.mock('./services/usage', () => ({
  getUsage: getUsageMock,
}));

const app = createApp();

describe('app', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns status ok from the health endpoint', async () => {
    const res = await request(app).get('/test');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('returns 404 NOT_FOUND in the standard format for unknown routes', async () => {
    const res = await request(app).get('/amora');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ code: 'NOT_FOUND', message: 'Route GET /amora not found' });
  });

  it('returns 400 INVALID_JSON for malformed bodies', async () => {
    const res = await request(app)
      .post('/translate')
      .set('Content-Type', 'application/json')
      .send('{invalid');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      code: 'INVALID_JSON',
      message: 'Request body is not valid JSON',
    });
  });

  it('translates a valid request and normalizes language codes', async () => {
    translateMock.mockResolvedValue({
      translatedText: 'Hello',
      detectedSourceLang: 'PT',
    });

    const res = await request(app).post('/translate').send({
      text: '  Ola  ',
      targetLang: ' en ',
      sourceLang: ' pt ',
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      translatedText: 'Hello',
      detectedSourceLang: 'PT',
    });
    expect(translateMock).toHaveBeenCalledWith('Ola', 'EN', 'PT');
  });

  it('allows requests without a source language', async () => {
    translateMock.mockResolvedValue({
      translatedText: 'Hello',
      detectedSourceLang: 'PT',
    });

    const res = await request(app).post('/translate').send({
      text: 'Ola',
      targetLang: 'en',
    });

    expect(res.status).toBe(200);
    expect(translateMock).toHaveBeenCalledWith('Ola', 'EN', undefined);
  });

  it.each([
    [{ text: '', targetLang: 'EN' }, 'empty text'],
    [{ text: 'x'.repeat(21), targetLang: 'EN' }, 'text over the maximum length'],
    [{ text: 'Ola' }, 'missing target language'],
    [{ text: 'Ola', targetLang: 'E' }, 'short target language'],
    [{ text: 'Ola', targetLang: 'EN', sourceLang: '' }, 'empty source language'],
  ])('returns 400 VALIDATION_ERROR for %s (%s)', async (body) => {
    const res = await request(app).post('/translate').send(body);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.message).toBeTypeOf('string');
    expect(translateMock).not.toHaveBeenCalled();
  });

  it('returns app errors produced by the translation service', async () => {
    const error = Object.assign(new Error('Invalid language'), {
      name: 'AppError',
      status: 400,
      code: 'INVALID_LANGUAGE',
    });
    translateMock.mockRejectedValue(error);

    const res = await request(app).post('/translate').send({
      text: 'Ola',
      targetLang: 'XX',
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      code: 'INVALID_LANGUAGE',
      message: 'Invalid language',
    });
  });

  it('returns 500 INTERNAL_ERROR for unexpected service errors', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    translateMock.mockRejectedValue(new Error('unexpected'));

    const res = await request(app).post('/translate').send({
      text: 'Ola',
      targetLang: 'EN',
    });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      code: 'INTERNAL_ERROR',
      message: 'Unexpected error',
    });
    expect(consoleError).toHaveBeenCalledOnce();
    consoleError.mockRestore();
  });

  it('returns the list of available languages', async () => {
    getLanguagesMock.mockResolvedValue({
      source: [{ code: 'EN', name: 'English' }],
      target: [{ code: 'PT', name: 'Portuguese' }],
    });

    const res = await request(app).get('/languages');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      source: [{ code: 'EN', name: 'English' }],
      target: [{ code: 'PT', name: 'Portuguese' }],
    });
  });

  it('returns provider usage', async () => {
    getUsageMock.mockResolvedValue({
      usedCharacters: 320,
      limitCharacters: 500,
      remainingCharacters: 180,
    });

    const res = await request(app).get('/usage');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      usedCharacters: 320,
      limitCharacters: 500,
      remainingCharacters: 180,
    });
  });
});

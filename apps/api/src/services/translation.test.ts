import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAppError } from '../errors/app-error';

const { translateTextMock } = vi.hoisted(() => ({
  translateTextMock: vi.fn(),
}));

vi.mock('../providers/deepl', () => ({
  translateText: translateTextMock,
}));

describe('translateWithDeepL', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('returns and caches a successful translation', async () => {
    translateTextMock.mockResolvedValue({
      translations: [
        { text: 'Hello', detected_source_language: 'PT' },
      ],
    });

    const { translateWithDeepL } = await import('./translation');

    await expect(translateWithDeepL('Ola', 'EN', 'PT')).resolves.toEqual({
      translatedText: 'Hello',
      detectedSourceLang: 'PT',
    });
    await expect(translateWithDeepL('Ola', 'EN', 'PT')).resolves.toEqual({
      translatedText: 'Hello',
      detectedSourceLang: 'PT',
    });

    expect(translateTextMock).toHaveBeenCalledTimes(1);
    expect(translateTextMock).toHaveBeenCalledWith('Ola', 'EN', 'PT');
  });

  it('forwards an omitted source language', async () => {
    translateTextMock.mockResolvedValue({
      translations: [
        { text: 'Hello', detected_source_language: 'PT' },
      ],
    });

    const { translateWithDeepL } = await import('./translation');

    await translateWithDeepL('Ola', 'EN');

    expect(translateTextMock).toHaveBeenCalledWith('Ola', 'EN', undefined);
  });

  it('maps provider language rejection to INVALID_LANGUAGE', async () => {
    translateTextMock.mockRejectedValue(
      createAppError(502, 'PROVIDER_REJECTED_REQUEST', 'Rejected'),
    );

    const { translateWithDeepL } = await import('./translation');

    await expect(translateWithDeepL('Ola', 'XX')).rejects.toMatchObject({
      status: 400,
      code: 'INVALID_LANGUAGE',
      message: 'Invalid language or text rejected by DeepL',
    });
  });

  it('preserves provider and unexpected errors', async () => {
    const providerError = createAppError(429, 'TOO_MANY_REQUESTS', 'Try again');
    translateTextMock.mockRejectedValueOnce(providerError);

    const { translateWithDeepL } = await import('./translation');

    await expect(translateWithDeepL('Ola', 'EN')).rejects.toBe(providerError);

    const unexpectedError = new Error('unexpected');
    translateTextMock.mockRejectedValueOnce(unexpectedError);

    await expect(translateWithDeepL('Oi', 'EN')).rejects.toBe(unexpectedError);
  });

  it('throws TRANSLATION_UNAVAILABLE when the provider returns no translations', async () => {
    translateTextMock.mockResolvedValue({ translations: [] });

    const { translateWithDeepL } = await import('./translation');

    await expect(translateWithDeepL('Ola', 'EN')).rejects.toMatchObject({
      status: 502,
      code: 'TRANSLATION_UNAVAILABLE',
      message: 'Empty response from provider',
    });
  });
});

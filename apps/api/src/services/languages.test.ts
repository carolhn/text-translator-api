import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getDeepLLanguagesMock } = vi.hoisted(() => ({
  getDeepLLanguagesMock: vi.fn(),
}));

vi.mock('../providers/deepl', () => ({
  getLanguages: getDeepLLanguagesMock,
}));

describe('getLanguages', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('maps and returns source and target languages', async () => {
    getDeepLLanguagesMock
      .mockResolvedValueOnce([
        { language: 'EN', name: 'English' },
        { language: 'PT', name: 'Portuguese' },
      ])
      .mockResolvedValueOnce([
        { language: 'DE', name: 'German' },
      ]);

    const { getLanguages } = await import('./languages');

    await expect(getLanguages()).resolves.toEqual({
      source: [
        { code: 'EN', name: 'English' },
        { code: 'PT', name: 'Portuguese' },
      ],
      target: [{ code: 'DE', name: 'German' }],
    });
    expect(getDeepLLanguagesMock).toHaveBeenNthCalledWith(1, 'source');
    expect(getDeepLLanguagesMock).toHaveBeenNthCalledWith(2, 'target');
  });

  it('returns the cached value without calling the provider again', async () => {
    getDeepLLanguagesMock
      .mockResolvedValueOnce([{ language: 'EN', name: 'English' }])
      .mockResolvedValueOnce([{ language: 'PT', name: 'Portuguese' }]);

    const { getLanguages } = await import('./languages');

    await getLanguages();
    await getLanguages();

    expect(getDeepLLanguagesMock).toHaveBeenCalledTimes(2);
  });

  it('fetches languages again after the cache expires', async () => {
    getDeepLLanguagesMock
      .mockResolvedValue([{ language: 'EN', name: 'English' }]);

    const { getLanguages } = await import('./languages');

    await getLanguages();
    vi.advanceTimersByTime(24 * 60 * 60 * 1000);
    await getLanguages();

    expect(getDeepLLanguagesMock).toHaveBeenCalledTimes(4);
  });
});

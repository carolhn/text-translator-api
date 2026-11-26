import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getDeepLUsageMock } = vi.hoisted(() => ({
  getDeepLUsageMock: vi.fn(),
}));

vi.mock('../providers/deepl', () => ({
  getUsage: getDeepLUsageMock,
}));

describe('getUsage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps usage fields and calculates remaining characters', async () => {
    getDeepLUsageMock.mockResolvedValue({
      character_count: 320,
      character_limit: 500,
    });

    const { getUsage } = await import('./usage');

    await expect(getUsage()).resolves.toEqual({
      usedCharacters: 320,
      limitCharacters: 500,
      remainingCharacters: 180,
    });
  });

  it('returns zero remaining characters when usage exceeds the limit', async () => {
    getDeepLUsageMock.mockResolvedValue({
      character_count: 600,
      character_limit: 500,
    });

    const { getUsage } = await import('./usage');

    await expect(getUsage()).resolves.toEqual({
      usedCharacters: 600,
      limitCharacters: 500,
      remainingCharacters: 0,
    });
  });
});

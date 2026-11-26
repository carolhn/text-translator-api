import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    env: {
      DEEPL_API_KEY: 'test-key-0123456789:fx',
      DEEPL_API_URL: 'https://deepl.test',
      MAX_TEXT_LENGTH: '20',
      PORT: '3333',
      RATE_LIMIT_MAX: '1000',
      TRANSLATION_CACHE_TTL_MS: '60000',
    },
  },
});

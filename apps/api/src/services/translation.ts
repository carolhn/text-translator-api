import type { TranslateResponse } from '@translator/shared';
import { env } from '../config/env';
import { createAppError, isAppError } from '../errors/app-error';
import { createMemoryCache } from '../lib/memory-cache';
import { translateText, type DeepLTranslationResponse } from '../providers/deepl';

const cache = createMemoryCache<TranslateResponse>({
  ttlMs: env.TRANSLATION_CACHE_TTL_MS,
  maxEntries: env.TRANSLATION_CACHE_MAX_ENTRIES,
});

export async function translateWithDeepL(
  text: string,
  targetLang: string,
  sourceLang?: string,
): Promise<TranslateResponse> {
  const key = JSON.stringify([text, targetLang, sourceLang ?? null]);

  const cached = cache.get(key);
  if (cached) return cached;

  let data: DeepLTranslationResponse;

  try {
    data = await translateText(text, targetLang, sourceLang);
  } catch (err) {
    if (isAppError(err) && err.code === 'PROVIDER_REJECTED_REQUEST') {
      throw createAppError(400, 'INVALID_LANGUAGE', 'Invalid language or text rejected by DeepL');
    }
    throw err;
  }

  const first = data.translations[0];

  if (!first) {
    throw createAppError(502, 'TRANSLATION_UNAVAILABLE', 'Empty response from provider');
  }

  const result = { translatedText: first.text, detectedSourceLang: first.detected_source_language };
  cache.set(key, result);

  return result;
}

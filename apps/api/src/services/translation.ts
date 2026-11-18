import type { TranslateResponse } from '@translator/shared';
import { createAppError, isAppError } from '../errors/app-error';
import { translateText } from '../providers/deepl';

export async function translateWithDeepL(
  text: string,
  targetLang: string,
  sourceLang?: string,
): Promise<TranslateResponse> {
  let data;

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

  return { translatedText: first.text, detectedSourceLang: first.detected_source_language };
}

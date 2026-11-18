import type { TranslateResponse } from '@translator/shared';
import { env } from '../config/env';
import { createAppError } from '../errors/app-error';

interface DeepLResponse {
  translations: { detected_source_language: string; text: string }[];
}

function mapDeepLError(status: number) {
  switch (status) {
    case 400:
      return createAppError(400, 'INVALID_LANGUAGE', 'Invalid language or text rejected by DeepL');
    case 429:
      return createAppError(429, 'TOO_MANY_REQUESTS', 'Too many requests, try again shortly');
    case 456:
      return createAppError(503, 'QUOTA_EXCEEDED', 'Monthly translation quota exceeded');
    default:
      return createAppError(502, 'TRANSLATION_UNAVAILABLE', 'Translation provider failed');
  }
}

export async function translateWithDeepL(
  text: string,
  targetLang: string,
  sourceLang?: string,
): Promise<TranslateResponse> {
  let response: Response;

  try {
    response = await fetch(`${env.DEEPL_API_URL}/v2/translate`, {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${env.DEEPL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: [text],
        target_lang: targetLang,
        ...(sourceLang && { source_lang: sourceLang }),
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw createAppError(502, 'TRANSLATION_UNAVAILABLE', 'Could not reach translation provider');
  }

  if (!response.ok) throw mapDeepLError(response.status);

  const data = (await response.json()) as DeepLResponse;
  const first = data.translations[0];

  if (!first) {
    throw createAppError(502, 'TRANSLATION_UNAVAILABLE', 'Empty response from provider');
  }

  return { translatedText: first.text, detectedSourceLang: first.detected_source_language };
}

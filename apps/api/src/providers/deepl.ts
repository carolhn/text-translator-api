import { env } from '../config/env';
import { createAppError } from '../errors/app-error';

export interface DeepLTranslationResponse {
  translations: { detected_source_language: string; text: string }[];
}

export interface DeepLLanguage {
  language: string;
  name: string;
}

export interface DeepLUsageResponse {
  character_count: number;
  character_limit: number;
}

async function deeplRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${env.DEEPL_API_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `DeepL-Auth-Key ${env.DEEPL_API_KEY}`,
        ...(init.body && { 'Content-Type': 'application/json' }),
      },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw createAppError(502, 'TRANSLATION_UNAVAILABLE', 'Could not reach translation provider');
  }

  if (!response.ok) {
    switch (response.status) {
      case 400:
        throw createAppError(
          502,
          'PROVIDER_REJECTED_REQUEST',
          'Request rejected by translation provider',
        );
      case 429:
        throw createAppError(429, 'TOO_MANY_REQUESTS', 'Too many requests, try again shortly');
      case 456:
        throw createAppError(503, 'QUOTA_EXCEEDED', 'Monthly translation quota exceeded');
      default:
        throw createAppError(502, 'TRANSLATION_UNAVAILABLE', 'Translation provider failed');
    }
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw createAppError(502, 'TRANSLATION_UNAVAILABLE', 'Invalid response from provider');
  }
}

export function translateText(
  text: string,
  targetLang: string,
  sourceLang?: string,
): Promise<DeepLTranslationResponse> {
  return deeplRequest<DeepLTranslationResponse>('/v2/translate', {
    method: 'POST',
    body: JSON.stringify({
      text: [text],
      target_lang: targetLang,
      ...(sourceLang && { source_lang: sourceLang }),
    }),
  });
}

export function getLanguages(type: 'source' | 'target'): Promise<DeepLLanguage[]> {
  return deeplRequest<DeepLLanguage[]>(`/v2/languages?type=${type}`);
}

export function getUsage(): Promise<DeepLUsageResponse> {
  return deeplRequest<DeepLUsageResponse>('/v2/usage');
}

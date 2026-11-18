import type { Language, LanguagesResponse, TranslateResponse } from '@translator/shared';
import { env } from '../config/env';
import { createAppError, isAppError } from '../errors/app-error';

interface DeepLResponse {
  translations: { detected_source_language: string; text: string }[];
}

interface DeepLLanguage {
  language: string;
  name: string;
}

const LANGUAGES_TTL_MS = 24 * 60 * 60 * 1000;
let languagesCache: { value: LanguagesResponse; expiresAt: number } | undefined;

function mapDeepLError(status: number) {
  switch (status) {
    case 400:
      return createAppError(
        502,
        'PROVIDER_REJECTED_REQUEST',
        'Request rejected by translation provider',
      );
    case 429:
      return createAppError(429, 'TOO_MANY_REQUESTS', 'Too many requests, try again shortly');
    case 456:
      return createAppError(503, 'QUOTA_EXCEEDED', 'Monthly translation quota exceeded');
    default:
      return createAppError(502, 'TRANSLATION_UNAVAILABLE', 'Translation provider failed');
  }
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

  if (!response.ok) throw mapDeepLError(response.status);

  try {
    return (await response.json()) as T;
  } catch {
    throw createAppError(502, 'TRANSLATION_UNAVAILABLE', 'Invalid response from provider');
  }
}

export async function translateWithDeepL(
  text: string,
  targetLang: string,
  sourceLang?: string,
): Promise<TranslateResponse> {
  let data: DeepLResponse;

  try {
    data = await deeplRequest<DeepLResponse>('/v2/translate', {
      method: 'POST',
      body: JSON.stringify({
        text: [text],
        target_lang: targetLang,
        ...(sourceLang && { source_lang: sourceLang }),
      }),
    });
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

function toLanguage({ language, name }: DeepLLanguage): Language {
  return { code: language, name };
}

export async function getLanguages(): Promise<LanguagesResponse> {
  if (languagesCache && languagesCache.expiresAt > Date.now()) return languagesCache.value;

  const [source, target] = await Promise.all([
    deeplRequest<DeepLLanguage[]>('/v2/languages?type=source'),
    deeplRequest<DeepLLanguage[]>('/v2/languages?type=target'),
  ]);

  const value = { source: source.map(toLanguage), target: target.map(toLanguage) };
  languagesCache = { value, expiresAt: Date.now() + LANGUAGES_TTL_MS };

  return value;
}

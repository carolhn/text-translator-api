import type { Language, LanguagesResponse } from '@translator/shared';
import { getLanguages as getDeepLLanguages, type DeepLLanguage } from '../providers/deepl';

const LANGUAGES_TTL_MS = 24 * 60 * 60 * 1000;
let languagesCache: { value: LanguagesResponse; expiresAt: number } | undefined;

function toLanguage({ language, name }: DeepLLanguage): Language {
  return { code: language, name };
}

export async function getLanguages(): Promise<LanguagesResponse> {
  if (languagesCache && languagesCache.expiresAt > Date.now()) return languagesCache.value;

  const [source, target] = await Promise.all([
    getDeepLLanguages('source'),
    getDeepLLanguages('target'),
  ]);

  const value = { source: source.map(toLanguage), target: target.map(toLanguage) };
  languagesCache = { value, expiresAt: Date.now() + LANGUAGES_TTL_MS };

  return value;
}

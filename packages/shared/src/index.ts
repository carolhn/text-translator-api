export interface TranslateRequest {
  text: string;
  targetLang: string;
  sourceLang?: string;
}

export interface TranslateResponse {
  translatedText: string;
  detectedSourceLang: string;
}

export interface ApiError {
  code: string;
  message: string;
}

export interface Language {
  code: string;
  name: string;
}

export interface LanguagesResponse {
  source: Language[];
  target: Language[];
}

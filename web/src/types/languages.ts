export type SupportedLanguage = "auto" | "de" | "en" | "fa" | "fr" | "es" | "it";

export type DetectedLanguage = Exclude<SupportedLanguage, "auto"> | null;

export const languageLabels: Record<SupportedLanguage, string> = {
  auto: "Automatisch erkennen",
  de: "Deutsch",
  en: "English",
  fa: "فارسی",
  fr: "Français",
  es: "Español",
  it: "Italiano",
};

export const detectedLanguageLabels: Record<Exclude<SupportedLanguage, "auto">, string> = {
  de: "Deutsch",
  en: "Englisch",
  fa: "Persisch",
  fr: "Französisch",
  es: "Spanisch",
  it: "Italienisch",
};

export const speechRecognitionLocales: Record<Exclude<SupportedLanguage, "auto">, string> = {
  de: "de-DE",
  en: "en-US",
  fa: "fa-IR",
  fr: "fr-FR",
  es: "es-ES",
  it: "it-IT",
};

export function languageFromLocale(locale: string): DetectedLanguage {
  const language = locale.toLowerCase().split(/[-_]/)[0];
  return language === "de" || language === "en" || language === "fa" || language === "fr" || language === "es" || language === "it"
    ? language
    : null;
}

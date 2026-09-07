import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en";
import ja from "./locales/ja";
import vi from "./locales/vi";

export const SUPPORTED_LANGUAGES = ["vi", "en", "ja"];
export const DEFAULT_LANGUAGE = "vi";
export const SESSION_LANGUAGE_KEY = "vcc_plastics_language";

export const isSupportedLanguage = (language) =>
  SUPPORTED_LANGUAGES.includes(String(language || "").toLowerCase());

export const toTranslationSlug = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

i18n.use(initReactI18next).init({
  resources: {
    vi: { translation: vi },
    en: { translation: en },
    ja: { translation: ja },
  },
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;


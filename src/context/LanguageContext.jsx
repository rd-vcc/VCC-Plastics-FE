import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import i18n, {
  DEFAULT_LANGUAGE,
  isSupportedLanguage,
  SESSION_LANGUAGE_KEY,
  SUPPORTED_LANGUAGES,
} from "../i18n";
import { API_ENDPOINTS } from "../config/config";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(i18n.resolvedLanguage || i18n.language || DEFAULT_LANGUAGE);
  const [defaultLanguage, setDefaultLanguage] = useState(DEFAULT_LANGUAGE);
  const [isLoadingDefault, setIsLoadingDefault] = useState(true);

  useEffect(() => {
    let active = true;
    const temporaryLanguage = sessionStorage.getItem(SESSION_LANGUAGE_KEY);

    if (isSupportedLanguage(temporaryLanguage)) {
      i18n.changeLanguage(temporaryLanguage);
    }

    fetch(API_ENDPOINTS.SYSTEM_LANGUAGE)
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load system language");
        return response.json();
      })
      .then((data) => {
        if (!active) return;
        const serverLanguage = isSupportedLanguage(data.default_language)
          ? data.default_language
          : DEFAULT_LANGUAGE;
        setDefaultLanguage(serverLanguage);
        if (!isSupportedLanguage(temporaryLanguage)) i18n.changeLanguage(serverLanguage);
      })
      .catch(() => {
        if (active && !isSupportedLanguage(temporaryLanguage)) i18n.changeLanguage(DEFAULT_LANGUAGE);
      })
      .finally(() => {
        if (active) setIsLoadingDefault(false);
      });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    const handleLanguageChanged = (nextLanguage) => setLanguage(nextLanguage);
    i18n.on("languageChanged", handleLanguageChanged);
    return () => i18n.off("languageChanged", handleLanguageChanged);
  }, []);

  const changeTemporaryLanguage = useCallback((language) => {
    if (!isSupportedLanguage(language)) return;
    sessionStorage.setItem(SESSION_LANGUAGE_KEY, language);
    i18n.changeLanguage(language);
  }, []);

  const clearTemporaryLanguage = useCallback(() => {
    sessionStorage.removeItem(SESSION_LANGUAGE_KEY);
    i18n.changeLanguage(defaultLanguage);
  }, [defaultLanguage]);

  const value = useMemo(() => ({
    language,
    defaultLanguage,
    setDefaultLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    isLoadingDefault,
    changeTemporaryLanguage,
    clearTemporaryLanguage,
  }), [language, defaultLanguage, isLoadingDefault, changeTemporaryLanguage, clearTemporaryLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}


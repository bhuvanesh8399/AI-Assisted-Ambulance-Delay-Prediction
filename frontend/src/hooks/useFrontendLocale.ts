import { useEffect, useState } from "react";
import type { FrontendLocale } from "../i18n/frontendI18n";

const STORAGE_KEY = "ems_frontend_locale";

export function useFrontendLocale(defaultLocale: FrontendLocale = "en") {
  const [locale, setLocale] = useState<FrontendLocale>(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === "en" || saved === "ta" ? saved : defaultLocale;
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  return { locale, setLocale };
}

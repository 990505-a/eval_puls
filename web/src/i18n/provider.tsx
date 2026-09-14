"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { zhCN } from "@/src/i18n/zh-CN";
import { LOCALE_STORAGE_KEY, type Locale } from "@/src/i18n/config";

const DICTIONARIES: Partial<Record<Locale, Record<string, string>>> = {
  "zh-CN": zhCN,
};

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Translate an English source string; falls back to the key itself. */
  t: (key: string) => string;
};

// Default context (English, no-op) keeps components usable even if they end up
// outside the provider tree — never crashes a page over a missing translation.
const defaultContext: I18nContextValue = {
  locale: "en",
  setLocale: () => {},
  t: (key) => key,
};

const I18nContext = createContext<I18nContextValue>(defaultContext);

export function I18nProvider({ children }: { children: ReactNode }) {
  // Starts as "en" so SSR markup and the first client render match; the stored
  // preference (or browser language) is applied right after mount, which
  // avoids hydration mismatches at the cost of a brief flash on hard loads.
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === "en" || stored === "zh-CN") {
      setLocaleState(stored);
    } else if (navigator.language?.toLowerCase().startsWith("zh")) {
      setLocaleState("zh-CN");
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // localStorage can be unavailable (private mode); locale still applies
      // for this session.
    }
  }, []);

  const t = useCallback(
    (key: string) => {
      if (locale === "en") return key;
      return DICTIONARIES[locale]?.[key] ?? key;
    },
    [locale],
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}

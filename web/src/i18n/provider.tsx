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
import { autoZhCN } from "@/src/i18n/auto-zh-CN";
import {
  startDomTranslator,
  stopDomTranslator,
} from "@/src/i18n/dom-translator";
import { LOCALE_STORAGE_KEY, type Locale } from "@/src/i18n/config";

const DICTIONARIES: Partial<Record<Locale, Record<string, string>>> = {
  "zh-CN": { ...zhCN, ...autoZhCN },
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
    if (locale === "zh-CN") {
      // 对未被 t() 包裹的文案做兜底翻译（含动态渲染的弹窗/表格）
      startDomTranslator();
    } else {
      stopDomTranslator();
    }
  }, [locale]);

  const setLocale = useCallback(
    (next: Locale) => {
      // 从中文切回英文时，DOM 兜底翻译无法可靠还原 → 整页刷新最干净
      if (next === "en" && locale === "zh-CN") {
        try {
          window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
        } catch {
          /* ignore */
        }
        window.location.reload();
        return;
      }
      setLocaleState(next);
      try {
        window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
      } catch {
        // localStorage can be unavailable (private mode); locale still applies
        // for this session.
      }
    },
    [locale],
  );

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

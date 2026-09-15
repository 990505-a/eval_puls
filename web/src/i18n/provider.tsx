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
  // preference is applied right after mount, which avoids hydration mismatches
  // at the cost of a brief flash on hard loads.
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === "en" || stored === "zh-CN") {
      setLocaleState(stored);
    } else {
      // 这是汉化版镜像，面向中文使用者：没有显式偏好时一律默认中文。
      // 不按 navigator.language 判断——中文用户的浏览器/系统语言常常是英文，
      // 照它判断会让绝大多数人打开就是满屏英文。想用英文用侧边栏的语言开关切，
      // 切换结果会写进 localStorage 并被上面的分支优先采用。
      setLocaleState("zh-CN");
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      if (root.lang !== locale) root.lang = locale;
    };
    apply();
    if (locale === "zh-CN") {
      // 对未被 t() 包裹的文案做兜底翻译（含动态渲染的弹窗/表格）
      startDomTranslator();
    } else {
      stopDomTranslator();
    }
    // 守卫：Next 的路由器在每次路由切换完成时会执行
    // `document.documentElement.lang = <next.config 的 i18n locale>`，
    // 把用户选的英文偏好盖掉（next.config 里已设成 zh-CN，此处兜住英文偏好）。
    // 只在值不对时写回，因此不会与写入方形成循环。
    const guard = new MutationObserver(apply);
    guard.observe(root, { attributes: true, attributeFilter: ["lang"] });
    return () => guard.disconnect();
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

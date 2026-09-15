/**
 * Minimal i18n layer for the Langfuse web app (eval_puls fork).
 *
 * Design: English source strings ARE the keys. Components render strings
 * through `t("English text")`; the zh-CN dictionary maps English -> Chinese.
 * Untranslated strings fall back to English, so upstream Langfuse changes
 * degrade gracefully instead of rendering raw keys.
 */

export const LOCALES = ["en", "zh-CN"] as const;

export type Locale = (typeof LOCALES)[number];

export const LOCALE_STORAGE_KEY = "eval_puls_locale";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  "zh-CN": "中文",
};

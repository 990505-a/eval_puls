import { zhCN } from "date-fns/locale";
import { LOCALE_STORAGE_KEY, type Locale } from "@/src/i18n/config";

/**
 * 非 React 环境（图表轴、工具函数）里取当前语言的 BCP-47 标签。
 * 语言偏好存在 localStorage，SSR 阶段拿不到时回退 en-US。
 */
export function currentDateLocaleTag(): string {
  if (typeof window === "undefined") return "en-US";
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  const locale: Locale =
    stored === "zh-CN" || stored === "en"
      ? stored
      : navigator.language?.toLowerCase().startsWith("zh")
        ? "zh-CN"
        : "en";
  return locale === "zh-CN" ? "zh-CN" : "en-US";
}

/** date-fns 的 locale 对象；英文是库默认值，返回 undefined 即可。 */
export function currentDateFnsLocale() {
  return currentDateLocaleTag() === "zh-CN" ? zhCN : undefined;
}

/** date-fns 选项对象：英文时保持默认，中文时注入 locale。 */
export function dateFnsOptions(extra: Record<string, unknown> = {}) {
  const locale = currentDateFnsLocale();
  return locale ? { ...extra, locale } : extra;
}

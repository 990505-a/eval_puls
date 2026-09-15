import { zhCN } from "date-fns/locale";
import { LOCALE_STORAGE_KEY, type Locale } from "@/src/i18n/config";

/**
 * 非 React 环境（图表轴、工具函数）里取当前语言的 BCP-47 标签。
 * 与 I18nProvider 的判定保持一致：没有显式偏好时默认中文（汉化版镜像面向中文使用者），
 * 所以这里不再看 navigator.language，否则图表上的日期会是英文而界面是中文。
 * SSR 阶段没有 localStorage，回退 en-US；水合后图表会重绘。
 */
export function currentDateLocaleTag(): string {
  if (typeof window === "undefined") return "en-US";
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  const locale: Locale = stored === "en" ? "en" : "zh-CN";
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

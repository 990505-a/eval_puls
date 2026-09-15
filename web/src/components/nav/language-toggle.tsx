"use client";
import { Languages } from "lucide-react";
import { cn } from "@/src/utils/tailwind";
import { useI18n } from "@/src/i18n/provider";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/src/i18n/config";

/**
 * Sidebar user-menu language switcher (English / 中文).
 * Mirrors ThemeToggle's row layout so both entries read as one settings group.
 */
export function LanguageToggle() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex items-center space-x-1">
      <Languages className="mr-2 h-4 w-4 shrink-0" aria-hidden />
      <span className="mr-2">Language</span>
      <div className="flex items-center gap-0.5 rounded bg-black/5 p-0.5 dark:bg-white/10">
        {LOCALES.map((option: Locale) => (
          <button
            key={option}
            type="button"
            title={LOCALE_LABELS[option]}
            onClick={(e) => {
              e.preventDefault();
              setLocale(option);
            }}
            className={cn(
              "rounded-sm px-1.5 py-0.5 text-xs leading-none",
              locale === option
                ? "bg-background text-primary-accent shadow-xs font-medium"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option === "en" ? "EN" : "中"}
          </button>
        ))}
      </div>
    </div>
  );
}

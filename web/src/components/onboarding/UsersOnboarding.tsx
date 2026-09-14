import React from "react";
import { SplashScreen } from "@/src/components/ui/splash-screen";
import { ActionButton } from "@/src/components/ActionButton";
import { useI18n } from "@/src/i18n/provider";

export function UsersOnboarding() {
  const { t } = useI18n();

  return (
    <SplashScreen
      title="You aren't tracking users yet"
      description="Once you add a user ID to your traces, you can correlate costs, evaluations and other LLM Application metrics to better understand how they interact with your LLM applications."
      videoSrc="https://static.langfuse.com/prod-assets/onboarding/users-overview-v1.mp4"
    >
      <div className="mt-8">
        <h3 className="mb-4 text-2xl font-bold">{t("Start tracking users")}</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          {t("To start tracking users, you need to add a")}{" "}
          <code>userId</code>
          {t("to your traces.")}
        </p>
        <ActionButton
          href="https://langfuse.com/docs/observability/features/users"
          variant="default"
        >
          {t("Read the docs")}
        </ActionButton>
      </div>
    </SplashScreen>
  );
}

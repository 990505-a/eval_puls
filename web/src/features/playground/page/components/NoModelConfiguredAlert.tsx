import { AlertCircle, Settings } from "lucide-react";
import Link from "next/link";
import { Alert } from "@/src/components/design-system/Alert/Alert";
import { useI18n } from "@/src/i18n/provider";

interface NoModelConfiguredAlertProps {
  projectId: string;
}

export function NoModelConfiguredAlert({
  projectId,
}: NoModelConfiguredAlertProps) {
  const { t } = useI18n();
  return (
    <div className="px-4 pt-4">
      <Alert variant="warning" icon={AlertCircle}>
        <Alert.Title>{t("No LLM Connection Configured")}</Alert.Title>
        <Alert.Description>
          {t(
            "To use the playground, you need to configure a model first. Go to",
          )}{" "}
          <Link
            href={`/project/${projectId}/settings/llm-connections`}
            className="font-bold underline underline-offset-4 hover:text-yellow-900 dark:hover:text-yellow-300"
          >
            <Settings className="inline h-3 w-3" /> {t("LLM Connection Settings")}
          </Link>{" "}
          {t("to add an LLM API key and configure your models.")}
        </Alert.Description>
      </Alert>
    </div>
  );
}

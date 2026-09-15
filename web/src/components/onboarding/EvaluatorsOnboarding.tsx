import { EvalTemplateSourceCodeLanguage } from "@langfuse/shared";
import { useI18n } from "@/src/i18n/provider";

import { EvaluatorsOnboardingView } from "@/src/components/onboarding/components/EvaluatorsOnboardingView/EvaluatorsOnboardingView";
import type { ActionConfig } from "@/src/components/ui/splash-screen";
import { useIsCodeEvalEnabled } from "@/src/features/evals/hooks/useIsCodeEvalEnabled";

interface EvaluatorsOnboardingProps {
  projectId: string;
  createEvaluatorAction?: ActionConfig;
}

export function EvaluatorsOnboarding({
  projectId,
  createEvaluatorAction,
}: EvaluatorsOnboardingProps) {
  const { enabled, supportedSourceCodeLanguages } = useIsCodeEvalEnabled();
  const { t } = useI18n();
  const codeEvaluatorLanguageDescription =
    supportedSourceCodeLanguages.includes(EvalTemplateSourceCodeLanguage.PYTHON)
      ? "TypeScript or Python"
      : "TypeScript";
  const primaryAction = createEvaluatorAction ?? {
    label: t("Create Evaluator"),
    href: `/project/${projectId}/evals/new`,
  };

  return (
    <EvaluatorsOnboardingView
      codeEvaluatorLanguageDescription={
        enabled ? t(codeEvaluatorLanguageDescription) : null
      }
      createEvaluatorAction={primaryAction}
    />
  );
}

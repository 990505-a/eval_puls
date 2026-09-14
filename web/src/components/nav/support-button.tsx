import { LifeBuoy } from "lucide-react";
import { SidebarMenuButton, useSidebar } from "@/src/components/ui/sidebar";
import { useSupportDrawer } from "@/src/features/support-chat/SupportDrawerProvider";
import { useInAppAiAgent } from "@/src/ee/features/in-app-agent/components/InAppAiAgentProvider";
import { useI18n } from "@/src/i18n/provider";

export const SupportButton = () => {
  const { setOpen: setSupportDrawerOpen } = useSupportDrawer();
  const { setOpen: setAiAgentOpen } = useInAppAiAgent();
  const { isMobile, setOpenMobile: setOpenMobileSidebar } = useSidebar();
  const { t } = useI18n();

  return (
    <SidebarMenuButton
      onClick={() => {
        if (isMobile) {
          setOpenMobileSidebar(false);
        }
        setTimeout(() => {
          // push to next tick to avoid flickering when hiding sidebar on mobile
          setAiAgentOpen(false);
          setSupportDrawerOpen(true);
        }, 1);
      }}
    >
      <LifeBuoy className="h-4 w-4" />
      {t("Support")}
    </SidebarMenuButton>
  );
};

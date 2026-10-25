import { Toaster } from "sonner";
import { useI18n } from "../../i18n";

export function ToastViewport({ theme = "light" }: { theme?: "light" | "dark" }) {
  const { t } = useI18n();
  return (
    <Toaster
      closeButton
      toastOptions={{ closeButtonAriaLabel: t("ui.closeNotification") }}
      containerAriaLabel={t("ui.notifications")}
      position="top-right"
      richColors
      theme={theme}
    />
  );
}

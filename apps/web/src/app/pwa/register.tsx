import { useI18n } from "../../shared/i18n";
import { Button } from "../../shared/ui";
import { usePwaUpdatePrompt } from "./update-controller";
import type { PwaRegistrar } from "./update-controller";

export function PwaUpdatePrompt({ register }: { register?: PwaRegistrar } = {}) {
  const { t } = useI18n();
  const update = usePwaUpdatePrompt(register);
  if (!update.updateReady) return null;

  return (
    <aside
      aria-live="polite"
      className="fixed inset-x-4 bottom-4 z-60 mx-auto flex max-w-2xl flex-col gap-3 rounded-card border border-border bg-surface p-4 shadow-lg sm:flex-row sm:flex-wrap sm:items-center"
    >
      <div>
        <strong>{t("app.updateReady")}</strong>
        <p className="text-muted">{t("app.updateHelp")}</p>
      </div>
      <Button onClick={() => void update.reload()}>{t("common.reload")}</Button>
      <Button onClick={update.dismiss} variant="tertiary">
        {t("app.later")}
      </Button>
    </aside>
  );
}

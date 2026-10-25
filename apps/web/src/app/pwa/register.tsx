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
      className="fixed left-1/2 bottom-4 z-60 flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-card border border-solid border-border bg-surface p-4 [transform:translateX(-50%)] [box-shadow:0_var(--space-2)_var(--space-8)_var(--color-shadow)] [@media(max-width:39.999rem)]:bottom-3 [@media(max-width:39.999rem)]:w-[calc(100vw-2rem)] [@media(max-width:39.999rem)]:items-stretch [@media(max-width:39.999rem)]:flex-col"
    >
      <div>
        <strong>{t("app.updateReady")}</strong>
        <p className="m-0 text-muted">{t("app.updateHelp")}</p>
      </div>
      <Button onClick={() => void update.reload()}>{t("common.reload")}</Button>
      <Button onClick={update.dismiss} variant="tertiary">
        {t("app.later")}
      </Button>
    </aside>
  );
}

import { useI18n } from "../../shared/i18n";
import { AppControls } from "../layouts/app-controls";
import { useTheme } from "../theme/use-theme";

export function StartupErrorPage() {
  const { t } = useI18n();
  const { theme } = useTheme();
  return (
    <main className="mx-auto my-[15vh] grid max-w-2xl gap-4 p-6" role="alert">
      <div className="flex items-center justify-between gap-3">
        <img
          alt="MealDeli"
          height="48"
          src={
            theme === "dark"
              ? "/brand/mealdeli-logo-inverse.svg"
              : "/brand/mealdeli-logo-primary.svg"
          }
          width="174"
        />
        <AppControls />
      </div>
      <h1 className="text-page">{t("app.startupTitle")}</h1>
      <p className="text-muted">{t("app.startupHelp")}</p>
    </main>
  );
}

export function OfflinePage() {
  const { t } = useI18n();
  return (
    <section className="mx-auto my-[15vh] grid max-w-2xl gap-4 p-6" role="status">
      <h1 className="text-page">{t("app.offlineTitle")}</h1>
      <p className="text-muted">{t("app.offlineHelp")}</p>
    </section>
  );
}

export function ChunkLoadErrorPage() {
  const { t } = useI18n();
  return (
    <main className="mx-auto my-[15vh] grid max-w-2xl gap-4 p-6" role="alert">
      <AppControls />
      <h1 className="text-page">{t("app.chunkError")}</h1>
      <p className="text-muted">{t("app.chunkHelp")}</p>
      <button
        className="inline-flex min-h-control-lg items-center justify-center gap-2 rounded-control border border-transparent bg-jade px-6 py-0 text-on-primary hover:bg-jade-dark hover:text-on-primary-hover font-bold"
        onClick={() => window.location.reload()}
        type="button"
      >
        {t("common.reload")}
      </button>
    </main>
  );
}

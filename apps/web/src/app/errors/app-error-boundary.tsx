import { useI18n } from "../../shared/i18n";
import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { Button } from "../../shared/ui";
import { AppControls } from "../layouts/app-controls";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("MealDeli root render failed", error, info.componentStack);
  }

  override render() {
    if (!this.state.error) return this.props.children;
    return <AppErrorFallback />;
  }
}

function AppErrorFallback() {
  const { t } = useI18n();
  return (
    <main className="mx-auto my-[15vh] grid max-w-2xl gap-4 p-6" role="alert">
      <AppControls />
      <p className="text-small font-extrabold uppercase text-muted">
        {t("app.errorHeading")}
      </p>
      <h1 className="text-page">{t("app.errorTitle")}</h1>
      <p className="text-muted">{t("app.reloadHelp")}</p>
      <Button onClick={() => window.location.reload()}>{t("app.reloadApp")}</Button>
    </main>
  );
}

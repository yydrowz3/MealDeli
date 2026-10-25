import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { Button } from "../../shared/ui";
import { ThemeSwitch } from "../theme/theme-switch";

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
    return (
      <main className="mx-auto my-[15vh] grid max-w-[40rem] gap-4 p-6" role="alert">
        <ThemeSwitch />
        <p className="m-0 text-[0.8125rem] font-[800] tracking-[0.12em] uppercase text-muted">
          Something went wrong
        </p>
        <h1 className="m-0 text-[length:var(--font-size-page)]">
          MealDeli couldn’t open this page.
        </h1>
        <p className="m-0 text-muted">Reload the app to try again.</p>
        <Button onClick={() => window.location.reload()}>Reload MealDeli</Button>
      </main>
    );
  }
}

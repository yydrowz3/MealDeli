import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { Button } from "../../shared/ui";

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
      <main className="app-state" role="alert">
        <p className="landing-eyebrow">Something went wrong</p>
        <h1>MealDeli couldn’t open this page.</h1>
        <p>Reload the app to try again.</p>
        <Button onClick={() => window.location.reload()}>Reload MealDeli</Button>
      </main>
    );
  }
}

import { ThemeSwitch } from "../theme/theme-switch";
import { useTheme } from "../theme/use-theme";

export function StartupErrorPage() {
  const { theme } = useTheme();
  return (
    <main className="mx-auto my-[15vh] grid max-w-[40rem] gap-4 p-6" role="alert">
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
        <ThemeSwitch />
      </div>
      <h1 className="m-0 text-[length:var(--font-size-page)]">
        MealDeli isn’t configured correctly.
      </h1>
      <p className="m-0 text-muted">Check the application configuration, then reload MealDeli.</p>
    </main>
  );
}

export function OfflinePage() {
  return (
    <section className="mx-auto my-[15vh] grid max-w-[40rem] gap-4 p-6" role="status">
      <h1 className="m-0 text-[length:var(--font-size-page)]">
        You’re offline. Connect to continue.
      </h1>
      <p className="m-0 text-muted">
        The MealDeli shell is available, but business data and actions require a connection.
      </p>
    </section>
  );
}

export function ChunkLoadErrorPage() {
  return (
    <main className="mx-auto my-[15vh] grid max-w-[40rem] gap-4 p-6" role="alert">
      <ThemeSwitch />
      <h1 className="m-0 text-[length:var(--font-size-page)]">
        We couldn’t load this part of MealDeli.
      </h1>
      <p className="m-0 text-muted">
        Reload once to get the latest version. If this continues, contact support.
      </p>
      <button
        className="inline-flex min-h-control-lg items-center justify-center gap-2 rounded-control border border-solid border-transparent bg-jade px-6 py-0 text-on-primary no-underline hover:bg-jade-dark hover:text-on-primary-hover font-[700]"
        onClick={() => window.location.reload()}
        type="button"
      >
        Reload
      </button>
    </main>
  );
}

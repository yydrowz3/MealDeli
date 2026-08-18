export function StartupErrorPage() {
  return (
    <main className="app-state" role="alert">
      <img alt="MealDeli" height="48" src="/brand/mealdeli-logo-primary.svg" width="174" />
      <h1>MealDeli isn’t configured correctly.</h1>
      <p>Check the application configuration, then reload MealDeli.</p>
    </main>
  );
}

export function OfflinePage() {
  return (
    <section className="app-state" role="status">
      <h1>You’re offline. Connect to continue.</h1>
      <p>The MealDeli shell is available, but business data and actions require a connection.</p>
    </section>
  );
}

export function ChunkLoadErrorPage() {
  return (
    <main className="app-state" role="alert">
      <h1>We couldn’t load this part of MealDeli.</h1>
      <p>Reload once to get the latest version. If this continues, contact support.</p>
      <button className="app-link-button" onClick={() => window.location.reload()} type="button">
        Reload
      </button>
    </main>
  );
}

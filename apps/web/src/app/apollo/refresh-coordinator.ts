export type RefreshCoordinator = {
  refresh: () => Promise<string>;
};

export function createRefreshCoordinator(options: {
  refreshAccessToken: () => Promise<string>;
  onRefreshFailed: () => void | Promise<void>;
}): RefreshCoordinator {
  let inFlight: Promise<string> | null = null;

  return {
    refresh() {
      if (!inFlight) {
        inFlight = options.refreshAccessToken().catch(async (error: unknown) => {
          await options.onRefreshFailed();
          throw error;
        });
        void inFlight
          .finally(() => {
            inFlight = null;
          })
          .catch(() => undefined);
      }
      return inFlight;
    },
  };
}

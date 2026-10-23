import type { MediaAuthPort } from "../../media";
import { accessTokenAtom, clearSessionAtom, setAuthenticatedAtom } from "./session-atoms";
import type { JotaiStore } from "./session-atoms";
import type { IdentityRepository } from "./types";

export function createIdentityMediaAuthPort(
  store: JotaiStore,
  repository: IdentityRepository,
): MediaAuthPort {
  return {
    getAccessToken: () => store.get(accessTokenAtom),
    async refreshAccessToken() {
      const refreshed = await repository.refreshAccessToken();
      if (!refreshed.ok) {
        store.set(clearSessionAtom, { reason: "expired" });
        return null;
      }
      const me = await repository.me(refreshed.value);
      if (!me.ok) {
        store.set(clearSessionAtom, { reason: "expired" });
        return null;
      }
      store.set(setAuthenticatedAtom, { accessToken: refreshed.value, user: me.value });
      return refreshed.value;
    },
  };
}

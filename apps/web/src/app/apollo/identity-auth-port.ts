import {
  accessTokenAtom,
  clearSessionAtom,
  sessionUserAtom,
  setAuthenticatedAtom,
} from "../../modules/identity";
import type { IdentityRepository, JotaiStore } from "../../modules/identity";
import type { AuthPort } from "./auth-port";

export function createIdentityAuthPort(
  store: JotaiStore,
  getRepository: () => IdentityRepository,
): AuthPort {
  return {
    getAccessToken: () => store.get(accessTokenAtom),
    subscribeAccessToken: (listener) => store.sub(accessTokenAtom, listener),
    async refreshAccessToken() {
      const repository = getRepository();
      const refreshed = await repository.refreshAccessToken();
      if (!refreshed.ok) throw new Error("The MealDeli session could not be refreshed.");

      let user = store.get(sessionUserAtom);
      if (!user) {
        const me = await repository.me(refreshed.value);
        if (!me.ok) throw new Error("The refreshed MealDeli session is invalid.");
        user = me.value;
      }
      store.set(setAuthenticatedAtom, { accessToken: refreshed.value, user });
      return refreshed.value;
    },
    clearSession: () => store.set(clearSessionAtom, { reason: "expired" }),
  };
}

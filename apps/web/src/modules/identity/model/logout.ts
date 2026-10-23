import { accessTokenAtom, clearSessionAtom } from "./session-atoms";
import type { JotaiStore } from "./session-atoms";
import type { IdentityRepository } from "./types";

export async function logoutLocallyFirst(
  store: JotaiStore,
  repository: IdentityRepository,
): Promise<void> {
  const accessToken = store.get(accessTokenAtom);
  store.set(clearSessionAtom, { reason: "logout" });
  try {
    await repository.signOut(accessToken);
  } catch {
    // Local session state is authoritative for immediate logout. The refresh
    // cookie expires server-side if the best-effort request cannot complete.
  }
}

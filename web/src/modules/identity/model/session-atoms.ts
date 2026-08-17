import { atom, createStore } from "jotai";
import type { Atom, WritableAtom } from "jotai";
import type { IdentityRepository, IdentitySnapshot, SessionUser } from "./types";

export type JotaiStore = ReturnType<typeof createStore>;

const initialSnapshot: IdentitySnapshot = {
  status: "idle",
  accessToken: null,
  user: null,
};

const identityStateAtom = atom<IdentitySnapshot>(initialSnapshot);
const repositoryAtom = atom<IdentityRepository | null>(null);

export const identityAtom: Atom<IdentitySnapshot> = atom((get) => get(identityStateAtom));
export const sessionUserAtom: Atom<SessionUser | null> = atom((get) => get(identityStateAtom).user);
export const accessTokenAtom: Atom<string | null> = atom(
  (get) => get(identityStateAtom).accessToken,
);

export const configureIdentityRepositoryAtom: WritableAtom<null, [IdentityRepository], void> = atom(
  null,
  (_get, set, repository) => set(repositoryAtom, repository),
);

export const setAuthenticatedAtom: WritableAtom<
  null,
  [{ accessToken: string; user: SessionUser }],
  void
> = atom(null, (_get, set, next) => {
  set(identityStateAtom, {
    status: "authenticated",
    accessToken: next.accessToken,
    user: next.user,
  });
});

export const setSessionUserAtom: WritableAtom<null, [SessionUser], void> = atom(
  null,
  (get, set, user) => {
    const current = get(identityStateAtom);
    set(identityStateAtom, { ...current, user });
  },
);

export const clearSessionAtom: WritableAtom<null, [{ reason: "logout" | "expired" }], void> = atom(
  null,
  (_get, set, { reason }) => {
    set(identityStateAtom, {
      status: reason === "expired" ? "expired" : "anonymous",
      accessToken: null,
      user: null,
    });
  },
);

export const bootstrapSessionAtom: WritableAtom<null, [], Promise<void>> = atom(
  null,
  async (get, set) => {
    const repository = get(repositoryAtom);
    set(identityStateAtom, { status: "checking", accessToken: null, user: null });
    if (!repository) {
      set(identityStateAtom, { status: "anonymous", accessToken: null, user: null });
      return;
    }

    const refresh = await repository.refreshAccessToken();
    if (!refresh.ok) {
      set(identityStateAtom, { status: "anonymous", accessToken: null, user: null });
      return;
    }

    let me = await repository.me(refresh.value);
    if (!me.ok) {
      const retry = await repository.me(refresh.value);
      me = retry;
    }
    if (!me.ok) {
      set(identityStateAtom, { status: "anonymous", accessToken: null, user: null });
      return;
    }

    set(identityStateAtom, {
      status: "authenticated",
      accessToken: refresh.value,
      user: me.value,
    });
  },
);

export function createIdentityTestStore(initial?: Partial<IdentitySnapshot>): JotaiStore {
  const store = createStore();
  store.set(identityStateAtom, { ...initialSnapshot, ...initial });
  return store;
}

import { atom } from "jotai";
import { createStore } from "jotai/vanilla";
import type { SyncStorage } from "jotai/vanilla/utils/atomWithStorage";
import { atomWithStorage } from "jotai/utils";
import { z } from "zod";

import { clampRouteProgress, createDemoRoute, type DemoRoute } from "./demo-route";

export const COURIER_ROUTE_STORAGE_KEY = "mealdeli.delivery-demo.v1";

const storedRouteSchema = z.object({
  version: z.literal(1),
  orderId: z.string().min(1),
  progressIndex: z.number().int().nonnegative(),
  startedAt: z.number().int().nonnegative(),
});

export type StoredCourierRoute = z.infer<typeof storedRouteSchema>;
export type StringStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function createMemoryCourierStorage(
  initial: Readonly<Record<string, string>> = {},
): Storage {
  const values = new Map(Object.entries(initial));
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, String(value)),
  };
}

export function createValidatedCourierStorage(
  storage: StringStorage,
): SyncStorage<StoredCourierRoute | null> {
  return {
    getItem(key, initialValue) {
      const raw = storage.getItem(key);
      if (raw === null) return initialValue;
      try {
        const parsed = storedRouteSchema.safeParse(JSON.parse(raw));
        if (parsed.success) return parsed.data;
      } catch {
        // Invalid external state is removed below.
      }
      storage.removeItem(key);
      return null;
    },
    setItem(key, value) {
      if (value === null) {
        storage.removeItem(key);
        return;
      }
      storage.setItem(key, JSON.stringify(storedRouteSchema.parse(value)));
    },
    removeItem(key) {
      storage.removeItem(key);
    },
  };
}

const browserStorage =
  typeof window === "undefined" ? createMemoryCourierStorage() : window.localStorage;

const storedCourierRouteAtom = atomWithStorage<StoredCourierRoute | null>(
  COURIER_ROUTE_STORAGE_KEY,
  null,
  createValidatedCourierStorage(browserStorage),
  { getOnInit: true },
);

export const courierRouteAtom = atom<DemoRoute | null>((get) => {
  const stored = get(storedCourierRouteAtom);
  return stored ? createDemoRoute(stored.orderId, stored.progressIndex) : null;
});

export const initializeCourierRouteAtom = atom<null, [string], void>(null, (get, set, orderId) => {
  const current = get(storedCourierRouteAtom);
  if (current?.orderId === orderId) {
    const route = createDemoRoute(orderId, current.progressIndex);
    if (route.progressIndex !== current.progressIndex) {
      set(storedCourierRouteAtom, { ...current, progressIndex: route.progressIndex });
    }
    return;
  }
  set(storedCourierRouteAtom, {
    version: 1,
    orderId,
    progressIndex: 0,
    startedAt: Date.now(),
  });
});

export const advanceCourierRouteAtom = atom<null, [], void>(null, (get, set) => {
  const current = get(storedCourierRouteAtom);
  if (!current) return;
  const route = createDemoRoute(current.orderId, current.progressIndex);
  const progressIndex = clampRouteProgress(current.progressIndex + 1, route.path.length);
  if (progressIndex !== current.progressIndex) {
    set(storedCourierRouteAtom, { ...current, progressIndex });
  }
});

export const clearCourierRouteAtom = atom<null, [], void>(null, (_get, set) => {
  set(storedCourierRouteAtom, null);
});

export type JotaiStore = ReturnType<typeof createStore>;
export type RouteTestStoreOptions = Readonly<{
  storage?: Storage;
  orderId?: string;
  progressIndex?: number;
  startedAt?: number;
}>;

export function createCourierRouteTestStore(options: RouteTestStoreOptions = {}): JotaiStore {
  const store = createStore();
  const storage = options.storage ?? createMemoryCourierStorage();
  const hydrated = createValidatedCourierStorage(storage).getItem(COURIER_ROUTE_STORAGE_KEY, null);
  const initial = options.orderId
    ? {
        version: 1 as const,
        orderId: options.orderId,
        progressIndex: Math.max(0, Math.trunc(options.progressIndex ?? 0)),
        startedAt: options.startedAt ?? 0,
      }
    : hydrated;
  store.set(storedCourierRouteAtom, initial);
  return store;
}

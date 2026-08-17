import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";

import { testServer } from "./server";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, String(value));
  }
}

const localStoragePolyfill = new MemoryStorage();
const sessionStoragePolyfill = new MemoryStorage();
Object.defineProperty(window, "localStorage", { configurable: true, value: localStoragePolyfill });
Object.defineProperty(window, "sessionStorage", { configurable: true, value: sessionStoragePolyfill });
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: localStoragePolyfill });
Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: sessionStoragePolyfill });

beforeAll(() => {
  testServer.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  cleanup();
  testServer.resetHandlers();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
  window.localStorage.clear();
  window.sessionStorage.clear();
  document.body.replaceChildren();
  document.head.querySelectorAll("[data-test-owned]").forEach((node) => node.remove());
});

afterAll(() => {
  testServer.close();
});

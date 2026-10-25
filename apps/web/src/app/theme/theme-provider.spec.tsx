import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";

import { ThemeProvider } from "./theme-provider";
import { THEME_STORAGE_KEY } from "./theme-context";
import { ThemeSwitch } from "./theme-switch";

function Example() {
  const [value, setValue] = useState("");
  return (
    <ThemeProvider>
      <ThemeSwitch />
      <input aria-label="Draft" onChange={(event) => setValue(event.target.value)} value={value} />
    </ThemeProvider>
  );
}

describe("theme preferences", () => {
  it.each([null, "light", "system", "invalid", '"dark"'])("defaults to light for %s", (stored) => {
    if (stored !== null) localStorage.setItem(THEME_STORAGE_KEY, stored);
    render(<Example />);
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(screen.getByRole("button", { name: "Switch to dark mode" })).toBeInTheDocument();
  });

  it("restores dark mode and persists both keyboard and mouse changes without resetting content", async () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    const user = userEvent.setup();
    const view = render(<Example />);
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    await user.type(screen.getByRole("textbox", { name: "Draft" }), "Keep my draft");
    await user.click(screen.getByRole("button", { name: "Switch to light mode" }));
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    const toggle = screen.getByRole("button", { name: "Switch to dark mode" });
    expect(toggle).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(screen.getByRole("textbox", { name: "Draft" })).toHaveValue("Keep my draft");
    view.unmount();
    render(<Example />);
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    await user.tab();
    await user.keyboard(" ");
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
  });

  it("continues switching when storage reads and writes throw", async () => {
    vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    const user = userEvent.setup();
    render(<Example />);
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    await user.click(screen.getByRole("button", { name: "Switch to dark mode" }));
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    await user.click(screen.getByRole("button", { name: "Switch to light mode" }));
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
  });

  it("uses the early restored theme if storage later becomes unavailable", () => {
    document.documentElement.dataset.theme = "dark";
    vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    render(<Example />);
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });

  it("synchronizes changes, removal, and clear events without echoing writes", () => {
    const view = render(<Example />);
    const write = vi.spyOn(window.localStorage, "setItem");
    const sync = (
      key: string | null,
      newValue: string | null,
      storageArea: Storage = localStorage,
    ) => {
      const event = new StorageEvent("storage", { key, newValue });
      // The suite uses a memory Storage polyfill, which jsdom's IDL constructor rejects.
      Object.defineProperty(event, "storageArea", { value: storageArea });
      act(() => window.dispatchEvent(event));
    };
    sync("unrelated", "dark");
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    sync(THEME_STORAGE_KEY, "dark", sessionStorage);
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    sync(THEME_STORAGE_KEY, "dark");
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    sync(THEME_STORAGE_KEY, "invalid");
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    sync(THEME_STORAGE_KEY, "dark");
    sync(THEME_STORAGE_KEY, null);
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    sync(THEME_STORAGE_KEY, "dark");
    sync(null, null);
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(write).not.toHaveBeenCalled();
    const remove = vi.spyOn(window, "removeEventListener");
    view.unmount();
    expect(remove).toHaveBeenCalledWith("storage", expect.any(Function));
  });
});

describe("theme initialization before first paint", () => {
  const html = readFileSync("index.html", "utf8");
  const script = /<script>([\s\S]*?)<\/script>/.exec(html)![1];

  it.each([null, "light", "dark", "system", "invalid"])(
    "matches the runtime preference for %s",
    (stored) => {
      const dataset = { theme: "light" };
      const getItem = vi.fn(() => stored);
      runInNewContext(script, {
        document: { documentElement: { dataset } },
        localStorage: { getItem },
      });
      expect(getItem).toHaveBeenCalledWith(THEME_STORAGE_KEY);
      expect(dataset.theme).toBe(stored === "dark" ? "dark" : "light");
      expect(html.indexOf(script)).toBeLessThan(html.indexOf("<body>"));
    },
  );

  it("keeps light mode when storage is unavailable", () => {
    const dataset = { theme: "light" };
    runInNewContext(script, { document: { documentElement: { dataset } } });
    expect(dataset.theme).toBe("light");
  });
});

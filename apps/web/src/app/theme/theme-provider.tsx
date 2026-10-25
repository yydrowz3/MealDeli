import { useEffect, useLayoutEffect, useState } from "react";
import type { ReactNode } from "react";
import { ThemeContext, THEME_STORAGE_KEY } from "./theme-context";
import type { Theme } from "./theme-context";

function parseTheme(value: string | null): Theme {
  return value === "dark" ? "dark" : "light";
}

function readTheme(): Theme {
  try {
    return parseTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    // The head script already restored the theme when storage was available.
    return parseTheme(document.documentElement.getAttribute("data-theme"));
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readTheme);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    function syncTheme(event: StorageEvent) {
      if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;
      try {
        if (event.storageArea !== null && event.storageArea !== window.localStorage) return;
      } catch {
        return;
      }
      setTheme(parseTheme(event.newValue));
    }
    window.addEventListener("storage", syncTheme);
    return () => window.removeEventListener("storage", syncTheme);
  }, []);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Theme changes remain usable when browser storage is blocked or full.
    }
  }

  return <ThemeContext value={{ theme, toggleTheme }}>{children}</ThemeContext>;
}

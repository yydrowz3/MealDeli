import { createContext } from "react";

export type Theme = "light" | "dark";
export const THEME_STORAGE_KEY = "mealdeli.theme";

export const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
} | null>(null);

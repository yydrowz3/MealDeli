import { ThemeToggle } from "../../shared/ui";
import { useTheme } from "./use-theme";

export function ThemeSwitch() {
  const { theme, toggleTheme } = useTheme();
  return <ThemeToggle onToggle={toggleTheme} theme={theme} />;
}

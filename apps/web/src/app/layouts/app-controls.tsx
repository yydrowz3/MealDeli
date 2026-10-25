import { LanguageSwitch } from "../i18n/language-switch";
import { ThemeSwitch } from "../theme/theme-switch";

export function AppControls() {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <ThemeSwitch />
      <LanguageSwitch />
    </div>
  );
}

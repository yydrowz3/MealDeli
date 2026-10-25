import { MoonIcon, SunIcon } from "@phosphor-icons/react";

export type ThemeToggleProps = {
  theme: "light" | "dark";
  onToggle: () => void;
};

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const label = theme === "light" ? "Switch to dark mode" : "Switch to light mode";
  return (
    <button
      aria-label={label}
      className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-control border border-solid border-current/30 bg-transparent p-2 text-inherit hover:bg-current/10 focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-info focus-visible:outline-offset-2"
      onClick={onToggle}
      title={label}
      type="button"
    >
      {theme === "light" ? (
        <MoonIcon aria-hidden="true" size={22} />
      ) : (
        <SunIcon aria-hidden="true" size={22} />
      )}
    </button>
  );
}

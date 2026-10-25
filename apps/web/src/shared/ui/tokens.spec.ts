import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const tokensCss = readFileSync("src/index.css", "utf8");

function token(
  name: string,
  theme: "light" | "dark" = "light",
  visited = new Set<string>(),
): string {
  if (visited.has(name)) throw new Error(`Circular design token: ${name}`);
  visited.add(name);
  const [lightCss, darkCss] = tokensCss.split(':root[data-theme="dark"]');
  const pattern = new RegExp(`${name}:\\s*([^;]+);`);
  const value = (
    (theme === "dark" ? pattern.exec(darkCss)?.[1] : undefined) ??
    pattern.exec(lightCss)?.[1] ??
    ""
  ).trim();
  const alias = /^var\((--[\w-]+)\)$/.exec(value);
  return alias ? token(alias[1], theme, visited) : value;
}

function luminance(hex: string) {
  const channels = [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255);
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(foreground: string, background: string) {
  const foregroundLuminance = luminance(foreground);
  const backgroundLuminance = luminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("design tokens", () => {
  it("defines the semantic visual foundation from one stylesheet", () => {
    expect(token("--color-charcoal")).toBe("#202723");
    expect(token("--color-jade")).toBe("#2fa36b");
    expect(token("--space-1")).toBe("0.25rem");
    expect(token("--space-16")).toBe("4rem");
    expect(token("--control-height-md")).toBe("2.75rem");
    expect(token("--radius-control")).toBe("0.625rem");
    expect(token("--radius-card")).toBe("0.875rem");
    expect(token("--radius-overlay")).toBe("1.125rem");
    expect(token("--content-max-width")).toBe("80rem");
    expect(token("--content-auth-max-width")).toBe("27.5rem");
    expect(token("--breakpoint-sm")).toBe("40rem");
    expect(token("--breakpoint-xl")).toBe("80rem");
    expect(token("--font-sans")).toContain("system-ui");
  });

  describe.each(["light", "dark"] as const)("%s theme", (theme) => {
    it.each([
      ["--color-charcoal", "--color-surface"],
      ["--color-charcoal", "--color-warm-white"],
      ["--color-on-primary", "--color-jade"],
      ["--color-on-primary-hover", "--color-jade-dark"],
      ["--color-action", "--color-surface"],
      ["--color-on-sidebar", "--color-sidebar"],
      ["--color-jade-text", "--color-jade-soft"],
      ["--color-warning-text", "--color-warning-soft"],
      ["--color-on-danger", "--color-danger"],
      ["--color-on-danger", "--color-danger-hover"],
      ["--color-danger-dark", "--color-danger-soft"],
      ["--color-info-dark", "--color-info-soft"],
      ["--color-muted", "--color-surface"],
      ["--color-muted", "--color-warm-white"],
      ["--color-danger-dark", "--color-surface"],
      ["--color-warning-text", "--color-surface"],
    ])("keeps %s on %s at WCAG AA text contrast", (foreground, background) => {
      expect(contrast(token(foreground, theme), token(background, theme))).toBeGreaterThanOrEqual(
        4.5,
      );
    });
  });
});

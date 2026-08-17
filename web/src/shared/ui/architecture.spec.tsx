import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from ".";
import { renderUi } from "./testing";

function productionSources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return entry.name === "testing" ? [] : productionSources(path);
    }
    return /\.(ts|tsx)$/.test(entry.name) && !entry.name.includes(".spec.") ? [path] : [];
  });
}

describe("Design System isolation", () => {
  it("renders without application or business providers", () => {
    renderUi(<Button>Standalone action</Button>);
    expect(screen.getByRole("button", { name: "Standalone action" })).toBeInTheDocument();
  });

  it("does not import business modules or state, data, form, and router providers", () => {
    const sources = productionSources("src/shared/ui").map((path) => readFileSync(path, "utf8"));
    const source = sources.join("\n");

    expect(source).not.toMatch(/from\s+["'][^"']*(?:\/modules\/|\/app\/|\/routes\/)/);
    expect(source).not.toMatch(/@apollo|\bjotai\b|@tanstack\/react-form|@tanstack\/react-router|\bgraphql\b/);
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PrivateContentGate } from "./private-content-gate";

describe("PrivateContentGate", () => {
  it("does not flash private content while session bootstrap is checking", () => {
    render(
      <PrivateContentGate decision={{ kind: "checking" }} onRedirect={vi.fn()}>
        <div>Sensitive order total</div>
      </PrivateContentGate>,
    );
    expect(screen.queryByText("Sensitive order total")).not.toBeInTheDocument();
    expect(screen.getByRole("main", { name: "Checking your session" })).toBeInTheDocument();
  });

  it("renders content only after access is allowed", () => {
    render(
      <PrivateContentGate decision={{ kind: "allow" }} onRedirect={vi.fn()}>
        <div>Private workspace</div>
      </PrivateContentGate>,
    );
    expect(screen.getByText("Private workspace")).toBeInTheDocument();
  });
});

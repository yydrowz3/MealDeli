import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { GuestLayout } from "../layouts/guest-layout";
import { LandingPage } from "./landing-page";

describe("LandingPage", () => {
  it("has one H1 and the three role-specific signup targets", () => {
    render(<GuestLayout><LandingPage /></GuestLayout>);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("link", { name: /Order food/i })).toHaveAttribute("href", "/signup?role=CUSTOMER");
    expect(screen.getByRole("link", { name: /Add your restaurant/i })).toHaveAttribute("href", "/signup?role=OWNER");
    expect(screen.getByRole("link", { name: /Deliver with us/i })).toHaveAttribute("href", "/signup?role=COURIER");
  });

  it("keeps header, primary CTA and role choices in a useful keyboard order", async () => {
    const user = userEvent.setup();
    render(<GuestLayout><LandingPage /></GuestLayout>);
    await user.tab();
    expect(screen.getByRole("link", { name: "MealDeli home" })).toHaveFocus();
    await user.tab();
    expect(screen.getAllByRole("link", { name: "Log in" })[0]).toHaveFocus();
    await user.tab();
    expect(screen.getAllByRole("link", { name: "Sign up" })[0]).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("link", { name: /Get started/i })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("link", { name: /Order food/i })).toHaveFocus();
  });
});

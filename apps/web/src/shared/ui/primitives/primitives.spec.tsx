import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button, Card, FormErrorSummary, Input, Select, Textarea } from "..";

describe("Button", () => {
  it("supports every visual variant and size", () => {
    const { container } = render(
      <>
        <Button variant="primary">Primary</Button>
        <Button size="sm" variant="secondary">
          Secondary
        </Button>
        <Button size="lg" variant="tertiary">
          Tertiary
        </Button>
        <Button variant="danger">Danger</Button>
      </>,
    );

    expect(screen.getByRole("button", { name: "Primary" })).toHaveClass(
      "ui-button--primary",
      "ui-button--md",
    );
    expect(screen.getByRole("button", { name: "Secondary" })).toHaveClass(
      "ui-button--secondary",
      "ui-button--sm",
    );
    expect(screen.getByRole("button", { name: "Tertiary" })).toHaveClass(
      "ui-button--tertiary",
      "ui-button--lg",
    );
    expect(screen.getByRole("button", { name: "Danger" })).toHaveClass("ui-button--danger");
    expect(container.querySelectorAll("button")).toHaveLength(4);
  });

  it("activates with the keyboard and respects native disabled state", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <>
        <Button onClick={onClick}>Continue</Button>
        <Button disabled onClick={onClick}>
          Unavailable
        </Button>
      </>,
    );

    await user.tab();
    expect(screen.getByRole("button", { name: "Continue" })).toHaveFocus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(onClick).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("button", { name: "Unavailable" })).toBeDisabled();
  });

  it("prevents duplicate actions while loading and retains its label", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Save changes
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Save changes" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("requires an accessible name for explicitly icon-only buttons", () => {
    expect(() =>
      render(
        <Button iconOnly>
          <span>×</span>
        </Button>,
      ),
    ).toThrow("Icon-only buttons require an aria-label.");

    render(
      <Button aria-label="Close" iconOnly>
        <span aria-hidden="true">×</span>
      </Button>,
    );
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });
});

describe("form primitives", () => {
  it("connects an input to its visible label, description, and error", async () => {
    const user = userEvent.setup();
    render(
      <Input
        description="We use this for receipts."
        error="Enter a valid email."
        label="Email"
        placeholder="name@example.com"
      />,
    );

    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input).toHaveAccessibleDescription("We use this for receipts. Enter a valid email.");
    expect(input).toHaveAttribute("aria-invalid", "true");
    await user.click(screen.getByText("Email"));
    expect(input).toHaveFocus();
  });

  it("provides labelled textarea and select controls without requiring errors", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Textarea label="Delivery note" />
        <Select description="Choose one option." label="Role">
          <option>Customer</option>
          <option>Courier</option>
        </Select>
      </>,
    );

    await user.type(screen.getByRole("textbox", { name: "Delivery note" }), "Ring the bell");
    await user.selectOptions(screen.getByRole("combobox", { name: "Role" }), "Courier");
    expect(screen.getByRole("textbox", { name: "Delivery note" })).toHaveValue("Ring the bell");
    expect(screen.getByRole("combobox", { name: "Role" })).toHaveValue("Courier");
    expect(screen.getByRole("combobox", { name: "Role" })).toHaveAccessibleDescription(
      "Choose one option.",
    );
  });

  it("moves focus through a form error summary callback", async () => {
    const user = userEvent.setup();
    const onFocus = vi.fn();
    const { rerender } = render(
      <FormErrorSummary
        errors={[{ field: "email", label: "Email", message: "Enter your email." }]}
        onFocus={onFocus}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Email: Enter your email." }));
    expect(onFocus).toHaveBeenCalledWith("email");

    rerender(<FormErrorSummary errors={[]} onFocus={onFocus} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders a semantic card without changing native props", () => {
    render(
      <Card aria-label="Order summary" className="custom">
        Contents
      </Card>,
    );
    expect(screen.getByLabelText("Order summary")).toHaveClass("ui-card", "custom");
  });
});

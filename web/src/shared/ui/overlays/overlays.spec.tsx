import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button, Drawer, Modal } from "..";

function ModalHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      <Modal
        description="This cannot be undone."
        footer={<Button onClick={() => setOpen(false)}>Confirm</Button>}
        onClose={() => setOpen(false)}
        open={open}
        title="Delete item"
      >
        <Button variant="secondary">Cancel</Button>
      </Modal>
    </>
  );
}

describe("Modal", () => {
  it("traps focus, closes with Escape, unlocks scroll, and restores focus", async () => {
    const user = userEvent.setup();
    render(<ModalHarness />);

    const trigger = screen.getByRole("button", { name: "Open dialog" });
    await user.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Delete item" });
    const cancel = screen.getByRole("button", { name: "Cancel" });
    const confirm = screen.getByRole("button", { name: "Confirm" });
    expect(dialog).toHaveAccessibleDescription("This cannot be undone.");
    expect(cancel).toHaveFocus();
    expect(document.body.style.overflow).toBe("hidden");

    confirm.focus();
    await user.tab();
    expect(cancel).toHaveFocus();
    await user.tab({ shift: true });
    expect(confirm).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
    expect(trigger).toHaveFocus();
  });

  it("does not close a non-dismissible submission overlay", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = render(
      <Modal dismissible={false} onClose={onClose} open title="Saving changes">
        <p>Please wait.</p>
      </Modal>,
    );

    expect(screen.getByRole("dialog", { name: "Saving changes" })).toHaveFocus();
    await user.keyboard("{Escape}");
    await user.click(container.ownerDocument.querySelector("[data-kind='modal']")!);
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes when a dismissible backdrop is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal onClose={onClose} open title="Preferences">
        Content
      </Modal>,
    );

    await user.click(document.querySelector("[data-kind='modal']")!);
    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe("Drawer", () => {
  it("uses dialog semantics and keeps focus inside when it has no controls", async () => {
    const user = userEvent.setup();
    render(
      <Drawer onClose={() => undefined} open title="Cart">
        Your cart is empty.
      </Drawer>,
    );

    const drawer = screen.getByRole("dialog", { name: "Cart" });
    expect(document.querySelector("[data-kind='drawer'] .ui-overlay--drawer")).toBe(drawer);
    expect(drawer).toHaveFocus();
    await user.tab();
    expect(drawer).toHaveFocus();
  });
});

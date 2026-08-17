import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { PromotionRepository } from "../model/promotion";
import { buildPromotionData, buildPromotionPayment } from "../testing/fixtures";
import { PromotionPage } from "./promotion-page";

const NOW = new Date("2026-08-17T12:00:00.000Z");

describe("PromotionPage", () => {
  it("clearly labels the inactive offer as a demo and does not claim history stored the price", async () => {
    const repository: PromotionRepository = {
      create: vi.fn(),
      refresh: vi.fn().mockResolvedValue(
        buildPromotionData({ payments: [buildPromotionPayment()] }),
      ),
    };
    render(
      <PromotionPage
        clock={() => NOW}
        repository={repository}
        restaurantId="restaurant-1"
        uuid={() => "uuid"}
      />,
    );
    expect(await screen.findByText("Demo payment — no real charge will be made.")).toBeVisible();
    expect(screen.getByText("$9.99")).toBeVisible();
    const history = screen.getByRole("heading", { name: "Promotion history" }).parentElement!;
    expect(within(history).getByText("Demo promotion")).toBeVisible();
    expect(within(history).getByText("7 days")).toBeVisible();
    expect(within(history).queryByText("$9.99")).not.toBeInTheDocument();
  });

  it("locks confirmation while submitting and activates from the server refetch", async () => {
    let finishCreate!: (value: { kind: "created" }) => void;
    const create = vi.fn(
      () => new Promise<{ kind: "created" }>((resolve) => { finishCreate = resolve; }),
    );
    const repository: PromotionRepository = {
      create,
      refresh: vi
        .fn()
        .mockResolvedValueOnce(buildPromotionData())
        .mockResolvedValueOnce(
          buildPromotionData({
            restaurant: { ...buildPromotionData().restaurant, promotedUntil: "2026-08-24T12:00:00.000Z" },
          }),
        ),
    };
    const user = userEvent.setup();
    render(
      <PromotionPage
        clock={() => NOW}
        repository={repository}
        restaurantId="restaurant-1"
        uuid={() => "uuid"}
      />,
    );
    await user.click(await screen.findByRole("button", { name: "Promote for $9.99" }));
    await user.click(screen.getByRole("button", { name: "Confirm promotion" }));
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    finishCreate({ kind: "created" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByText("Promotion active")).toBeVisible();
    expect(create).toHaveBeenCalledOnce();
  });

  it("does not offer another purchase while active", async () => {
    const repository: PromotionRepository = {
      create: vi.fn(),
      refresh: vi.fn().mockResolvedValue(
        buildPromotionData({
          restaurant: { ...buildPromotionData().restaurant, promotedUntil: "2026-08-24T12:00:00.000Z" },
        }),
      ),
    };
    render(
      <PromotionPage
        clock={() => NOW}
        repository={repository}
        restaurantId="restaurant-1"
      />,
    );
    expect(await screen.findByText("Promotion active")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Promote for $9.99" })).not.toBeInTheDocument();
    expect(repository.create).not.toHaveBeenCalled();
  });
});

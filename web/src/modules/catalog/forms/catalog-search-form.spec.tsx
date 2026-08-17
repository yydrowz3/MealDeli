import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CatalogSearchForm } from "../components/catalog-search-form";
import { createCatalogSearchFormOptions } from "./search-form-options";

describe("CatalogSearchForm", () => {
  it("provides injectable TanStack Form defaults", () => {
    expect(createCatalogSearchFormOptions("ramen").defaultValues).toEqual({ query: "ramen" });
  });

  it("updates the field immediately and submits to the URL owner after 300ms", async () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    render(<CatalogSearchForm onSearch={onSearch} />);

    const input = screen.getByRole("textbox", { name: "Search restaurants" });
    fireEvent.change(input, { target: { value: "ramen" } });
    expect(input).toHaveValue("ramen");
    expect(onSearch).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(299));
    expect(onSearch).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(onSearch).toHaveBeenLastCalledWith("ramen");
  });

  it("resets the field when browser-owned URL state changes", () => {
    const { rerender } = render(<CatalogSearchForm onSearch={() => undefined} query="noodles" />);
    expect(screen.getByRole("textbox", { name: "Search restaurants" })).toHaveValue("noodles");

    rerender(<CatalogSearchForm onSearch={() => undefined} query="dumplings" />);
    expect(screen.getByRole("textbox", { name: "Search restaurants" })).toHaveValue("dumplings");
  });

  it("clears immediately and rejects an overlong query", async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    render(<CatalogSearchForm onSearch={onSearch} query="ramen" />);
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(onSearch).toHaveBeenLastCalledWith("");
    expect(screen.getByRole("textbox", { name: "Search restaurants" })).toHaveValue("");

    await user.type(screen.getByRole("textbox", { name: "Search restaurants" }), "x".repeat(101));
    expect(await screen.findByText("Use 100 characters or fewer.")).toBeVisible();
  });
});

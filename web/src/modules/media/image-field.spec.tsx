import { useForm } from "@tanstack/react-form";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { ImageField } from "./components/image-field";
import type { UploadedImage, UploadProgress } from "./model/types";
import { createFakeUploader } from "./testing/fake-uploader";

const image = new File(["image"], "meal.png", { type: "image/png" });

describe("ImageField", () => {
  it("creates and revokes previews when replacing and unmounting", async () => {
    const createObjectURL = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValueOnce("blob:first")
      .mockReturnValueOnce("blob:second");
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    const uploader = createFakeUploader();
    const { unmount } = render(
      <ImageField label="Dish image" onChange={vi.fn()} uploader={uploader} value={null} />,
    );
    const input = screen.getByLabelText("Dish image", { selector: "input" });

    fireEvent.change(input, { target: { files: [image] } });
    await screen.findByAltText("Dish image preview");
    fireEvent.change(input, {
      target: { files: [new File(["next"], "next.png", { type: "image/png" })] },
    });
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:first");
    unmount();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:second");
    expect(createObjectURL).toHaveBeenCalledTimes(2);
  });

  it("shows validation errors and allows another selection", async () => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:valid");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    const uploader = createFakeUploader();
    render(<ImageField label="Avatar" onChange={vi.fn()} uploader={uploader} value={null} />);
    const input = screen.getByLabelText("Avatar", { selector: "input" });

    fireEvent.change(input, {
      target: { files: [new File(["gif"], "avatar.gif", { type: "image/gif" })] },
    });
    expect(screen.getByRole("alert")).toHaveTextContent("Choose a JPEG, PNG, or WebP image.");
    fireEvent.change(input, { target: { files: [image] } });
    await waitFor(() => expect(uploader.files).toHaveLength(1));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps the preview on failure and retries under user control", async () => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:meal");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    const uploader = createFakeUploader(
      vi
        .fn<(file: File) => Promise<UploadedImage>>()
        .mockRejectedValueOnce(new Error("Upload unavailable."))
        .mockResolvedValueOnce({
          key: "uploads/meal.png",
          url: "https://assets.example.com/meal.png",
        }),
    );
    const onChange = vi.fn();
    render(
      <ImageField label="Restaurant image" onChange={onChange} uploader={uploader} value={null} />,
    );
    fireEvent.change(screen.getByLabelText("Restaurant image", { selector: "input" }), {
      target: { files: [image] },
    });

    expect(await screen.findByRole("alert")).toHaveTextContent("Upload unavailable.");
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith("https://assets.example.com/meal.png"),
    );
    expect(uploader.files).toHaveLength(2);
  });

  it("aborts an active upload on cancel without showing an error", async () => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:meal");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    const uploader = createFakeUploader(
      (_file, signal) =>
        new Promise((_resolve, reject) => {
          signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
        }),
    );
    render(<ImageField label="Avatar" onChange={vi.fn()} uploader={uploader} value={null} />);
    fireEvent.change(screen.getByLabelText("Avatar", { selector: "input" }), {
      target: { files: [image] },
    });
    await userEvent.click(await screen.findByRole("button", { name: "Cancel upload" }));
    expect(uploader.signals[0]?.aborted).toBe(true);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload image" })).toBeEnabled();
  });

  it("writes the uploaded URL into a TanStack Form field and exposes uploading state", async () => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:meal");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    let resolveUpload: ((image: UploadedImage) => void) | undefined;
    const uploader = createFakeUploader(
      () =>
        new Promise((resolve) => {
          resolveUpload = resolve;
        }),
    );

    function Harness() {
      const [progress, setProgress] = useState<UploadProgress>({ status: "idle" });
      const form = useForm({ defaultValues: { image: null as string | null } });
      return (
        <form>
          <form.Field name="image">
            {(field) => (
              <>
                <ImageField
                  label="Dish image"
                  onChange={field.handleChange}
                  onProgressChange={setProgress}
                  uploader={uploader}
                  value={field.state.value}
                />
                <output>{field.state.value ?? "No image"}</output>
              </>
            )}
          </form.Field>
          <button disabled={progress.status === "uploading"} type="submit">
            Save dish
          </button>
        </form>
      );
    }

    render(<Harness />);
    fireEvent.change(screen.getByLabelText("Dish image", { selector: "input" }), {
      target: { files: [image] },
    });
    await waitFor(() => expect(screen.getByRole("button", { name: "Save dish" })).toBeDisabled());
    resolveUpload?.({ key: "uploads/meal.png", url: "https://assets.example.com/meal.png" });
    await screen.findByText("https://assets.example.com/meal.png");
    expect(screen.getByRole("button", { name: "Save dish" })).toBeEnabled();
  });

  it("removes the current image through the same URL port", async () => {
    const onChange = vi.fn();
    render(
      <ImageField
        label="Avatar"
        onChange={onChange}
        uploader={createFakeUploader()}
        value="https://assets.example.com/avatar.webp"
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Remove image" }));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});

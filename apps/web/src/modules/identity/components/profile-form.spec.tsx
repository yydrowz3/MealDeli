import { Provider } from "jotai";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { MediaUploader } from "../../media";
import { createIdentityTestStore, sessionUserAtom } from "../model/session-atoms";
import { buildSessionUser, createFakeIdentityRepository } from "../testing/fixtures";
import { ProfileForm } from "./profile-form";

describe("ProfileForm", () => {
  it("uploads through the Media port and synchronizes refreshed user state", async () => {
    const user = userEvent.setup();
    const initial = buildSessionUser();
    const updated = buildSessionUser({
      name: "Alex Updated",
      image: "https://cdn.example.test/avatar.png",
    });
    const store = createIdentityTestStore({
      status: "authenticated",
      accessToken: "access-token",
      user: initial,
    });
    const repository = createFakeIdentityRepository({
      me: vi.fn().mockResolvedValue({ ok: true, value: updated }),
    });
    const uploader: MediaUploader = {
      upload: vi.fn().mockResolvedValue({
        key: "avatars/alex.png",
        url: "https://cdn.example.test/avatar.png",
      }),
    };
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:preview");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    render(
      <Provider store={store}>
        <ProfileForm repository={repository} store={store} uploader={uploader} />
      </Provider>,
    );

    fireEvent.change(screen.getByLabelText("Avatar"), {
      target: { files: [new File(["image"], "avatar.png", { type: "image/png" })] },
    });
    await waitFor(() => expect(uploader.upload).toHaveBeenCalledTimes(1));
    const name = screen.getByRole("textbox", { name: "Full name" });
    await user.clear(name);
    await user.type(name, "Alex Updated");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(screen.getByText("Profile updated.")).toBeVisible());
    expect(repository.editProfile).toHaveBeenCalledWith(
      "access-token",
      expect.objectContaining({
        name: "Alex Updated",
        image: "https://cdn.example.test/avatar.png",
      }),
    );
    expect(store.get(sessionUserAtom)).toEqual(updated);
  });

  it("omits an unchanged email but enters verification gate after an email change", async () => {
    const user = userEvent.setup();
    const initial = buildSessionUser();
    const refreshed = buildSessionUser({ email: "new@example.test", verifiedAt: null });
    const store = createIdentityTestStore({
      status: "authenticated",
      accessToken: "access-token",
      user: initial,
    });
    const repository = createFakeIdentityRepository({
      me: vi.fn().mockResolvedValue({ ok: true, value: refreshed }),
    });
    const onVerificationRequired = vi.fn();
    render(
      <Provider store={store}>
        <ProfileForm
          onVerificationRequired={onVerificationRequired}
          repository={repository}
          store={store}
        />
      </Provider>,
    );
    const email = screen.getByRole("textbox", { name: "Email address" });
    await user.clear(email);
    await user.type(email, "new@example.test");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(onVerificationRequired).toHaveBeenCalledTimes(1));
    expect(repository.editProfile).toHaveBeenCalledWith(
      "access-token",
      expect.objectContaining({ email: "new@example.test" }),
    );
    expect(store.get(sessionUserAtom)?.verifiedAt).toBeNull();
  });
});

import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { testServer } from "../../../test/server";
import { createHttpMediaUploader } from "./api/http-media-uploader";
import { createMediaHandlers } from "./testing/handlers";

const endpoint = "http://localhost/uploads";
const imageFile = new File(["image"], "meal.webp", { type: "image/webp" });

describe("createHttpMediaUploader", () => {
  it("posts the file field with a Bearer access token", async () => {
    testServer.use(...createMediaHandlers());
    const refreshAccessToken = vi.fn<() => Promise<string | null>>();
    const uploader = createHttpMediaUploader({
      endpoint,
      auth: { getAccessToken: () => "access-token", refreshAccessToken },
    });

    await expect(uploader.upload(imageFile)).resolves.toEqual({
      key: "uploads/test.webp",
      url: "https://assets.example.com/uploads/test.webp",
    });
    expect(refreshAccessToken).not.toHaveBeenCalled();
  });

  it("refreshes once after 401 and recreates the multipart request", async () => {
    const tokens: Array<string | null> = [];
    testServer.use(
      http.post(endpoint, async ({ request }) => {
        tokens.push(request.headers.get("authorization"));
        const body = new TextDecoder().decode(await request.arrayBuffer());
        expect(body).toContain('name="file"');
        if (tokens.length === 1) return HttpResponse.json({}, { status: 401 });
        return HttpResponse.json({
          key: "uploads/refreshed.png",
          url: "https://assets.example.com/uploads/refreshed.png",
        });
      }),
    );
    const refreshAccessToken = vi.fn(async () => "fresh-token");
    const uploader = createHttpMediaUploader({
      endpoint,
      auth: { getAccessToken: () => "expired-token", refreshAccessToken },
    });

    await expect(uploader.upload(imageFile)).resolves.toMatchObject({
      key: "uploads/refreshed.png",
    });
    expect(tokens).toEqual(["Bearer expired-token", "Bearer fresh-token"]);
    expect(refreshAccessToken).toHaveBeenCalledOnce();
  });

  it("rejects malformed and non-HTTP response URLs", async () => {
    testServer.use(
      http.post(endpoint, () =>
        HttpResponse.json({ key: "uploads/a.webp", url: "data:image/png,x" }),
      ),
    );
    const uploader = createHttpMediaUploader({
      endpoint,
      auth: { getAccessToken: () => "access-token", refreshAccessToken: async () => null },
    });

    await expect(uploader.upload(imageFile)).rejects.toThrow(
      "Image upload failed. Try again or continue without an image.",
    );
  });

  it("preserves AbortError without mapping it to an upload error", async () => {
    const abortError = new DOMException("Aborted", "AbortError");
    const fetch = vi.fn<typeof globalThis.fetch>().mockRejectedValue(abortError);
    const uploader = createHttpMediaUploader({
      endpoint,
      fetch,
      auth: { getAccessToken: () => "access-token", refreshAccessToken: async () => null },
    });

    await expect(uploader.upload(imageFile)).rejects.toBe(abortError);
  });

  it.each([
    [413, "Image must be 5 MB or smaller."],
    [415, "Choose a JPEG, PNG, or WebP image."],
    [500, "Image upload failed. Try again or continue without an image."],
  ])("maps HTTP %s to stable UI copy", async (status, message) => {
    testServer.use(http.post(endpoint, () => new HttpResponse(null, { status })));
    const uploader = createHttpMediaUploader({
      endpoint,
      auth: { getAccessToken: () => "access-token", refreshAccessToken: async () => null },
    });
    await expect(uploader.upload(imageFile)).rejects.toThrow(message);
  });
});

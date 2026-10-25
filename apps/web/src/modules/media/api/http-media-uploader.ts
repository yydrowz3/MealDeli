import { message as localizedMessage, resolveMessage } from "../../../shared/i18n";
import { uploadedImageSchema } from "../model/image-schema";
import type { MediaAuthPort, MediaUploader, UploadedImage } from "../model/types";

export type HttpMediaUploaderOptions = {
  auth: MediaAuthPort;
  endpoint?: string;
  fetch?: typeof globalThis.fetch;
};

export class MediaUploadError extends Error {
  readonly status: number | undefined;
  readonly localizedMessage: string;

  constructor(message: string, status?: number) {
    super(resolveMessage(message));
    this.localizedMessage = message;
    this.name = "MediaUploadError";
    this.status = status;
  }
}

const SESSION_EXPIRED_MESSAGE = localizedMessage("media.sessionExpired");
const UPLOAD_FAILED_MESSAGE = localizedMessage("media.uploadFailed");

function errorForStatus(status: number): MediaUploadError {
  if (status === 401) return new MediaUploadError(SESSION_EXPIRED_MESSAGE, status);
  if (status === 413) return new MediaUploadError(localizedMessage("media.tooLarge"), status);
  if (status === 400 || status === 415) {
    return new MediaUploadError(localizedMessage("media.invalidType"), status);
  }
  return new MediaUploadError(UPLOAD_FAILED_MESSAGE, status);
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function createHttpMediaUploader({
  auth,
  endpoint = "/uploads",
  fetch: fetchImplementation = globalThis.fetch,
}: HttpMediaUploaderOptions): MediaUploader {
  async function send(file: File, token: string, signal?: AbortSignal): Promise<Response> {
    const body = new FormData();
    body.set("file", file);
    return fetchImplementation(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body,
      signal,
    });
  }

  return {
    async upload(file: File, signal?: AbortSignal): Promise<UploadedImage> {
      const initialToken = auth.getAccessToken();
      if (!initialToken) throw new MediaUploadError(SESSION_EXPIRED_MESSAGE, 401);

      try {
        let response = await send(file, initialToken, signal);
        if (response.status === 401) {
          const refreshedToken = await auth.refreshAccessToken();
          if (!refreshedToken) throw errorForStatus(401);
          response = await send(file, refreshedToken, signal);
        }

        if (!response.ok) throw errorForStatus(response.status);

        const result = uploadedImageSchema.safeParse(await response.json());
        if (!result.success) throw new MediaUploadError(UPLOAD_FAILED_MESSAGE);
        return result.data;
      } catch (error) {
        if (isAbortError(error) || signal?.aborted) throw error;
        if (error instanceof MediaUploadError) throw error;
        throw new MediaUploadError(UPLOAD_FAILED_MESSAGE);
      }
    },
  };
}

export type UploadedImage = {
  key: string;
  url: string;
};

export type UploadProgress =
  | { status: "idle" }
  | { status: "uploading"; previewUrl: string }
  | { status: "success"; image: UploadedImage; previewUrl: string }
  | { status: "error"; previewUrl?: string; message: string };

export interface MediaUploader {
  upload(file: File, signal?: AbortSignal): Promise<UploadedImage>;
}

export interface MediaAuthPort {
  getAccessToken(): string | null;
  refreshAccessToken(): Promise<string | null>;
}

import type { MediaUploader, UploadedImage } from "../model/types";

export type FakeUploader = MediaUploader & {
  files: File[];
  signals: Array<AbortSignal | undefined>;
};

export function createFakeUploader(
  implementation: (file: File, signal?: AbortSignal) => Promise<UploadedImage> = async (file) => ({
    key: `uploads/${file.name}`,
    url: `https://assets.example.com/uploads/${file.name}`,
  }),
): FakeUploader {
  const files: File[] = [];
  const signals: Array<AbortSignal | undefined> = [];
  return {
    files,
    signals,
    upload(file, signal) {
      files.push(file);
      signals.push(signal);
      return implementation(file, signal);
    },
  };
}

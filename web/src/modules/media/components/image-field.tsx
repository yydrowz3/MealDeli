import { useCallback, useEffect, useId, useRef, useState } from "react";

import { Button } from "../../../shared/ui";
import type { MediaUploader, UploadProgress } from "../model/types";
import { validateImageFile } from "../model/file-validation";
import { ImagePreview } from "./image-preview";
import "./image-field.css";

export type ImageFieldProps = {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  uploader?: MediaUploader;
  onProgressChange?: (progress: UploadProgress) => void;
};

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function messageFromError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Image upload failed. Try again or continue without an image.";
}

export function ImageField({
  label,
  value,
  onChange,
  uploader,
  onProgressChange,
}: ImageFieldProps) {
  const inputId = useId();
  const [progress, setProgress] = useState<UploadProgress>({ status: "idle" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const previewUrlRef = useRef<string | null>(null);

  const replacePreview = useCallback((nextUrl: string | null) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = nextUrl;
    setPreviewUrl(nextUrl);
  }, []);

  useEffect(() => {
    onProgressChange?.(progress);
  }, [onProgressChange, progress]);

  useEffect(
    () => () => {
      abortRef.current?.abort();
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    [],
  );

  const upload = useCallback(
    async (file: File, localPreviewUrl: string) => {
      if (!uploader) {
        setProgress({
          status: "error",
          previewUrl: localPreviewUrl,
          message: "Image uploader is not configured.",
        });
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const requestId = ++requestIdRef.current;
      setProgress({ status: "uploading", previewUrl: localPreviewUrl });

      try {
        const image = await uploader.upload(file, controller.signal);
        if (requestId !== requestIdRef.current || controller.signal.aborted) return;
        onChange(image.url);
        setProgress({ status: "success", image, previewUrl: localPreviewUrl });
      } catch (error) {
        if (
          requestId !== requestIdRef.current ||
          isAbortError(error) ||
          controller.signal.aborted
        ) {
          return;
        }
        setProgress({
          status: "error",
          previewUrl: localPreviewUrl,
          message: messageFromError(error),
        });
      } finally {
        if (requestId === requestIdRef.current) abortRef.current = null;
      }
    },
    [onChange, uploader],
  );

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const validationError = validateImageFile(file);
    if (validationError) {
      setProgress({ status: "error", message: validationError });
      return;
    }

    abortRef.current?.abort();
    requestIdRef.current += 1;
    const localPreviewUrl = URL.createObjectURL(file);
    replacePreview(localPreviewUrl);
    setSelectedFile(file);
    void upload(file, localPreviewUrl);
  };

  const remove = () => {
    abortRef.current?.abort();
    requestIdRef.current += 1;
    replacePreview(null);
    setSelectedFile(null);
    setProgress({ status: "idle" });
    onChange(null);
  };

  const cancel = () => {
    abortRef.current?.abort();
    requestIdRef.current += 1;
    setProgress({ status: "idle" });
  };

  const displayedImage = previewUrl ?? value;
  const error = progress.status === "error" ? progress.message : null;

  return (
    <div className="media-image-field">
      <label className="media-image-field__label" htmlFor={inputId}>
        {label}
      </label>
      <p className="media-image-field__description" id={`${inputId}-description`}>
        JPEG, PNG, or WebP, up to 5 MB. Uploaded images are public.
      </p>
      {displayedImage ? <ImagePreview label={label} src={displayedImage} /> : null}
      <input
        accept="image/jpeg,image/png,image/webp"
        aria-describedby={[`${inputId}-description`, error ? `${inputId}-error` : null]
          .filter(Boolean)
          .join(" ")}
        aria-invalid={error ? true : undefined}
        className="media-image-field__input"
        id={inputId}
        onChange={(event) => {
          handleFile(event.currentTarget.files?.[0]);
          event.currentTarget.value = "";
        }}
        type="file"
      />
      <div className="media-image-field__actions">
        <label
          className="ui-button ui-button--secondary ui-button--md media-image-field__choose"
          htmlFor={inputId}
        >
          {displayedImage ? "Choose a different image" : "Choose image"}
        </label>
        {progress.status === "uploading" ? (
          <Button onClick={cancel} variant="tertiary">
            Cancel upload
          </Button>
        ) : null}
        {progress.status === "idle" && selectedFile && previewUrl ? (
          <Button onClick={() => void upload(selectedFile, previewUrl)} variant="secondary">
            Upload image
          </Button>
        ) : null}
        {progress.status === "error" && selectedFile && previewUrl ? (
          <Button onClick={() => void upload(selectedFile, previewUrl)} variant="secondary">
            Try again
          </Button>
        ) : null}
        {displayedImage ? (
          <Button onClick={remove} variant="tertiary">
            Remove image
          </Button>
        ) : null}
      </div>
      {progress.status === "uploading" ? (
        <p aria-live="polite" className="media-image-field__status">
          Uploading image…
        </p>
      ) : null}
      {error ? (
        <p className="media-image-field__error" id={`${inputId}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

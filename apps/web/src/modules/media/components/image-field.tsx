import { errorMessage, message as localizedMessage, useI18n } from "../../../shared/i18n";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { Button } from "../../../shared/ui";
import type { MediaUploader, UploadProgress } from "../model/types";
import { validateImageFile } from "../model/file-validation";
import { ImagePreview } from "./image-preview";

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
  return errorMessage(error, "media.uploadFailed");
}

export function ImageField({
  label,
  value,
  onChange,
  uploader,
  onProgressChange,
}: ImageFieldProps) {
  const { t, text } = useI18n();
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
          message: localizedMessage("media.notConfigured"),
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
    const validationError = validateImageFile(file, (value) => value);
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
    <div className="grid gap-3">
      <label className="text-charcoal font-semibold" htmlFor={inputId}>
        {text(label)}
      </label>
      <p className="text-small text-muted" id={`${inputId}-description`}>
        {t("media.help")}
      </p>
      {displayedImage ? <ImagePreview label={text(label)} src={displayedImage} /> : null}
      <input
        accept="image/jpeg,image/png,image/webp"
        aria-describedby={[`${inputId}-description`, error ? `${inputId}-error` : null]
          .filter(Boolean)
          .join(" ")}
        aria-invalid={error ? true : undefined}
        className="sr-only"
        id={inputId}
        onChange={(event) => {
          handleFile(event.currentTarget.files?.[0]);
          event.currentTarget.value = "";
        }}
        type="file"
      />
      <div className="flex flex-wrap gap-2">
        <label
          className="relative inline-flex items-center justify-center gap-2 rounded-control border font-semibold cursor-pointer transition-colors duration-150 focus-visible:outline-3 focus-visible:outline-info focus-visible:outline-offset-2 min-h-control-md border-border bg-surface px-4 py-0 text-body leading-none text-charcoal hover:bg-neutral-soft"
          htmlFor={inputId}
        >
          {text(displayedImage ? t("media.changeImage") : t("media.chooseImage"))}
        </label>
        {progress.status === "uploading" ? (
          <Button onClick={cancel} variant="tertiary">
            {t("media.cancelUpload")}
          </Button>
        ) : null}
        {progress.status === "idle" && selectedFile && previewUrl ? (
          <Button onClick={() => void upload(selectedFile, previewUrl)} variant="secondary">
            {t("media.upload")}
          </Button>
        ) : null}
        {progress.status === "error" && selectedFile && previewUrl ? (
          <Button onClick={() => void upload(selectedFile, previewUrl)} variant="secondary">
            {t("common.tryAgain")}
          </Button>
        ) : null}
        {displayedImage ? (
          <Button onClick={remove} variant="tertiary">
            {t("media.remove")}
          </Button>
        ) : null}
      </div>
      {progress.status === "uploading" ? (
        <p aria-live="polite" className="text-small text-muted">
          {t("media.uploading")}
        </p>
      ) : null}
      {error ? (
        <p className="text-small text-danger-dark" id={`${inputId}-error`} role="alert">
          {text(error)}
        </p>
      ) : null}
    </div>
  );
}

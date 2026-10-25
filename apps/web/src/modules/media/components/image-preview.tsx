import { useI18n } from "../../../shared/i18n";
export type ImagePreviewProps = {
  label: string;
  src: string;
};

export function ImagePreview({ label, src }: ImagePreviewProps) {
  const { t } = useI18n();
  return (
    <img
      alt={t("media.preview", { name: label })}
      className="aspect-video w-full max-w-96 rounded-card border border-border bg-neutral-soft object-cover"
      src={src}
    />
  );
}

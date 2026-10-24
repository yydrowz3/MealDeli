export type ImagePreviewProps = {
  label: string;
  src: string;
};

export function ImagePreview({ label, src }: ImagePreviewProps) {
  return (
    <img
      alt={`${label} preview`}
      className="aspect-video w-full max-w-96 rounded-card border border-solid border-border bg-neutral-soft object-cover"
      src={src}
    />
  );
}

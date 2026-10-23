export type ImagePreviewProps = {
  label: string;
  src: string;
};

export function ImagePreview({ label, src }: ImagePreviewProps) {
  return <img alt={`${label} preview`} className="media-image-field__preview" src={src} />;
}

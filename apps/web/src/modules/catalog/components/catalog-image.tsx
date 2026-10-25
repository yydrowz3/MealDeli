import { useI18n } from "../../../shared/i18n";
import { useEffect, useState } from "react";

import { isUberAssetUrl } from "../model/image-policy";

export type CatalogImageProps = {
  source: string | null;
  alt: string;
  className?: string;
  allowExternalSource?: boolean;
};

export function CatalogImage({
  source,
  alt,
  className,
  allowExternalSource = false,
}: CatalogImageProps) {
  const { t, text } = useI18n();
  const usableSource = source && (allowExternalSource || !isUberAssetUrl(source)) ? source : null;
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [usableSource]);

  if (!usableSource || failed) {
    return (
      <div
        aria-label={t("catalog.placeholder", { name: alt })}
        className={[
          "flex items-center justify-center bg-[linear-gradient(135deg,var(--color-jade-soft),var(--color-neutral-soft))] object-cover font-extrabold text-jade-text",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        role="img"
      >
        <span aria-hidden="true">MD</span>
      </div>
    );
  }

  return (
    <img
      alt={text(alt)}
      className={["block object-cover", className].filter(Boolean).join(" ")}
      onError={() => setFailed(true)}
      src={usableSource}
    />
  );
}

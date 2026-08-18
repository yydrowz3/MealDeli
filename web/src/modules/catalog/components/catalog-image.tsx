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
  const usableSource = source && (allowExternalSource || !isUberAssetUrl(source)) ? source : null;
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [usableSource]);

  if (!usableSource || failed) {
    return (
      <div
        aria-label={`MealDeli placeholder for ${alt}`}
        className={["catalog-image", "catalog-image--placeholder", className]
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
      alt={alt}
      className={["catalog-image", className].filter(Boolean).join(" ")}
      onError={() => setFailed(true)}
      src={usableSource}
    />
  );
}

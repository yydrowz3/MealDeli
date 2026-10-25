import { useI18n } from "../../../shared/i18n";
import type { CategorySummary } from "../model/types";
import { CatalogImage } from "./catalog-image";

export type CategoryStripProps = {
  categories: readonly CategorySummary[];
  selected?: string;
  onSelect: (slug?: string) => void;
};

export function CategoryStrip({ categories, selected, onSelect }: CategoryStripProps) {
  const { t, text, formatNumber } = useI18n();
  return (
    <nav aria-label={t("catalog.categoryNavigation")} className="flex gap-3 overflow-x-auto p-1">
      <button
        aria-pressed={!selected}
        className="grid w-36 shrink-0 items-center gap-2 min-h-32 overflow-hidden rounded-card border border-border bg-surface p-2 text-left text-charcoal cursor-pointer aria-pressed:border-jade aria-pressed:ring-2 aria-pressed:ring-jade-soft focus-visible:outline-3 focus-visible:outline-info focus-visible:outline-offset-2"
        onClick={() => onSelect(undefined)}
        type="button"
      >
        <span
          className="flex min-h-20 items-center justify-center rounded-control bg-jade-soft text-xl font-bold text-jade-text"
          aria-hidden="true"
        >
          {t("common.all")}
        </span>
        <span>{t("common.all")}</span>
      </button>
      {categories.map((category) => (
        <button
          aria-pressed={selected === category.slug}
          className="grid w-36 shrink-0 items-center gap-2 min-h-32 overflow-hidden rounded-card border border-border bg-surface p-2 text-left text-charcoal cursor-pointer aria-pressed:border-jade aria-pressed:ring-2 aria-pressed:ring-jade-soft focus-visible:outline-3 focus-visible:outline-info focus-visible:outline-offset-2"
          key={category.id}
          onClick={() => onSelect(category.slug)}
          type="button"
        >
          <CatalogImage
            allowExternalSource
            alt={text(category.name)}
            className="h-20 w-full rounded-control"
            source={category.image}
          />
          <span>{text(category.name)}</span>
          <small className="text-muted">{formatNumber(category.restaurantCount)}</small>
        </button>
      ))}
    </nav>
  );
}

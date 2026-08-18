import type { CategorySummary } from "../model/types";
import { CatalogImage } from "./catalog-image";

export type CategoryStripProps = {
  categories: readonly CategorySummary[];
  selected?: string;
  onSelect: (slug?: string) => void;
};

export function CategoryStrip({ categories, selected, onSelect }: CategoryStripProps) {
  return (
    <nav aria-label="Restaurant categories" className="catalog-categories">
      <button
        aria-pressed={!selected}
        className="catalog-category"
        onClick={() => onSelect(undefined)}
        type="button"
      >
        <span className="catalog-category__all" aria-hidden="true">
          All
        </span>
        <span>All</span>
      </button>
      {categories.map((category) => (
        <button
          aria-pressed={selected === category.slug}
          className="catalog-category"
          key={category.id}
          onClick={() => onSelect(category.slug)}
          type="button"
        >
          <CatalogImage allowExternalSource alt={category.name} source={category.image} />
          <span>{category.name}</span>
          <small>{category.restaurantCount}</small>
        </button>
      ))}
    </nav>
  );
}

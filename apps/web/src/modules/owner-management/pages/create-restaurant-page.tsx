import { useI18n } from "../../../shared/i18n";
import { useSetAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";

import type { CatalogRepository, CategorySummary } from "../../catalog";
import type { MediaUploader } from "../../media";
import { ErrorState, Skeleton } from "../../../shared/ui";
import { RestaurantForm } from "../components/restaurant-form";
import { setSelectedOwnerRestaurantAtom } from "../model/selection-atoms";
import type { OwnerRestaurantRepository } from "../model/types";

export type OwnerCreateRestaurantPageProps = Readonly<{
  repository: OwnerRestaurantRepository;
  catalogRepository: Pick<CatalogRepository, "getCategories">;
  uploader?: MediaUploader;
  navigate: (path: string) => void;
}>;

export function OwnerCreateRestaurantPage({
  repository,
  catalogRepository,
  uploader,
  navigate,
}: OwnerCreateRestaurantPageProps) {
  const { t } = useI18n();
  const [categories, setCategories] = useState<readonly CategorySummary[] | null>(null);
  const [error, setError] = useState(false);
  const select = useSetAtom(setSelectedOwnerRestaurantAtom);
  const load = useCallback(async () => {
    setError(false);
    try {
      setCategories(await catalogRepository.getCategories());
    } catch {
      setError(true);
    }
  }, [catalogRepository]);
  useEffect(() => {
    void load();
  }, [load]);
  if (error)
    return (
      <ErrorState
        action={{ label: t("common.tryAgain"), onClick: () => void load() }}
        title={t("owner.loadCategoriesFailed")}
      />
    );
  if (!categories) return <Skeleton className="h-96" />;
  return (
    <section className="mx-auto grid max-w-200 gap-6 p-6 [@media(max-width:47.99rem)]:p-4">
      <header className="flex items-center justify-between gap-4 [@media(max-width:47.99rem)]:grid [@media(max-width:47.99rem)]:items-stretch [@media(max-width:47.99rem)]:grid-cols-[1fr]">
        <div>
          <p className="m-0 [color:var(--color-text-muted)] [font-size:var(--font-size-sm)] font-bold tracking-[0.08em] uppercase">
            {t("insights.restaurantDetails")}
          </p>
          <h1 className="m-0">{t("owner.createRestaurant")}</h1>
        </div>
      </header>
      <RestaurantForm
        categories={categories}
        onCancel={() => navigate("/restaurants")}
        onSubmit={(draft) => repository.create(draft)}
        onSuccess={(restaurant) => {
          select(restaurant.id);
          navigate(`/restaurants/${restaurant.id}`);
        }}
        uploader={uploader}
      />
    </section>
  );
}

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
        action={{ label: "Try again", onClick: () => void load() }}
        title="We couldn’t load categories."
      />
    );
  if (!categories) return <Skeleton style={{ height: "24rem" }} />;
  return (
    <section className="owner-page owner-page--narrow">
      <header className="owner-page__header">
        <div>
          <p className="owner-page__eyebrow">Restaurant details</p>
          <h1>Create restaurant</h1>
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

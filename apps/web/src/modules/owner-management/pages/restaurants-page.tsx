import { errorMessage, useI18n } from "../../../shared/i18n";
import { useSetAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";

import {
  Button,
  Card,
  DateTime,
  EmptyState,
  ErrorState,
  Modal,
  Skeleton,
} from "../../../shared/ui";
import {
  reconcileOwnerRestaurantSelectionAtom,
  selectAfterOwnerRestaurantDeleteAtom,
} from "../model/selection-atoms";
import type { OwnerRestaurant, OwnerRestaurantRepository } from "../model/types";

export type OwnerRestaurantsPageProps = Readonly<{
  repository: OwnerRestaurantRepository;
  navigate: (path: string) => void;
}>;

export function OwnerRestaurantsPage({ repository, navigate }: OwnerRestaurantsPageProps) {
  const { t, text } = useI18n();
  const [restaurants, setRestaurants] = useState<readonly OwnerRestaurant[] | null>(null);
  const [error, setError] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<OwnerRestaurant | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const reconcile = useSetAtom(reconcileOwnerRestaurantSelectionAtom);
  const selectAfterDelete = useSetAtom(selectAfterOwnerRestaurantDeleteAtom);

  const load = useCallback(async () => {
    setError(false);
    try {
      const next = await repository.list();
      setRestaurants(next);
      reconcile({ restaurantIds: next.map((restaurant) => restaurant.id) });
    } catch {
      setError(true);
    }
  }, [reconcile, repository]);

  useEffect(() => {
    void load();
  }, [load]);

  const remove = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    const result = await repository.delete(deleteTarget.id);
    if (!result.ok) {
      setDeleteError(errorMessage(result.message, "owner.deleteFailed"));
      setDeleting(false);
      return;
    }
    const remaining = (restaurants ?? []).filter((restaurant) => restaurant.id !== deleteTarget.id);
    setRestaurants(remaining);
    selectAfterDelete({
      deletedRestaurantId: deleteTarget.id,
      remainingRestaurantIds: remaining.map((restaurant) => restaurant.id),
    });
    setDeleting(false);
    setDeleteTarget(null);
  };

  if (error) {
    return (
      <ErrorState
        action={{ label: t("common.tryAgain"), onClick: () => void load() }}
        title={t("owner.loadRestaurantsFailed")}
      />
    );
  }
  if (!restaurants) {
    return (
      <section
        aria-label={t("catalog.loadingRestaurants")}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <Skeleton className="h-52" />
        <Skeleton className="h-52" />
      </section>
    );
  }
  if (restaurants.length === 0) {
    return (
      <EmptyState
        action={{ label: t("owner.createRestaurant"), onClick: () => navigate("/restaurants/new") }}
        description={t("insights.firstRestaurantHelp")}
        title={t("insights.firstRestaurant")}
      />
    );
  }

  return (
    <section className="mx-auto grid max-w-360 gap-6 p-4 md:p-6">
      <header className="grid gap-4 md:flex md:items-center md:justify-between">
        <div>
          <p className="text-small text-muted font-bold uppercase">
            {t("owner.workspace")}
          </p>
          <h1>{t("common.restaurants")}</h1>
        </div>
        <Button className="max-md:w-full" onClick={() => navigate("/restaurants/new")}>
          {t("owner.createRestaurant")}
        </Button>
      </header>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {restaurants.map((restaurant) => (
          <Card className="overflow-hidden" key={restaurant.id}>
            {restaurant.image ? (
              <img alt="" className="aspect-video w-full object-cover" src={restaurant.image} />
            ) : (
              <div
                className="aspect-video min-h-24 w-full bg-neutral-soft"
                aria-hidden="true"
              />
            )}
            <div className="grid gap-3 p-4">
              <p className="text-small text-muted font-bold uppercase">
                {text(restaurant.category.name)}
              </p>
              <h2>{text(restaurant.name)}</h2>
              <p>{text(restaurant.address)}</p>
              <p>
                {t("common.created")}
                <DateTime value={restaurant.createdAt} />
              </p>
              {restaurant.promotedUntil ? (
                <p>
                  {t("insights.promotedUntil")}
                  <DateTime value={restaurant.promotedUntil} />
                </p>
              ) : null}
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => navigate(`/restaurants/${restaurant.id}`)}>
                  {t("owner.openRestaurant")}
                </Button>
                <Button
                  onClick={() => navigate(`/restaurants/${restaurant.id}/menu`)}
                  variant="secondary"
                >
                  {t("owner.manageMenu")}
                </Button>
                <Button
                  onClick={() => navigate(`/restaurants/${restaurant.id}/settings`)}
                  variant="tertiary"
                >
                  {t("owner.settings")}
                </Button>
                <Button
                  onClick={() => navigate(`/restaurants/${restaurant.id}/promotion`)}
                  variant="tertiary"
                >
                  {t("owner.promotion")}
                </Button>
                <Button onClick={() => setDeleteTarget(restaurant)} variant="danger">
                  {t("owner.deleteRestaurant")}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Modal
        dismissible={!deleting}
        onClose={() => setDeleteTarget(null)}
        open={Boolean(deleteTarget)}
        title={t("owner.confirmDeleteRestaurant")}
        description={t("owner.deleteRestaurantHelp")}
        footer={
          <>
            <Button disabled={deleting} onClick={() => setDeleteTarget(null)} variant="secondary">
              {t("common.cancel")}
            </Button>
            <Button loading={deleting} onClick={() => void remove()} variant="danger">
              {t("owner.deleteRestaurant")}
            </Button>
          </>
        }
      >
        {deleteError ? <p role="alert">{text(deleteError)}</p> : <p>{t("owner.savedItemsHelp")}</p>}
      </Modal>
    </section>
  );
}

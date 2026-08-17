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
      setDeleteError(result.message);
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
        action={{ label: "Try again", onClick: () => void load() }}
        title="We couldn’t load your restaurants."
      />
    );
  }
  if (!restaurants) {
    return (
      <section aria-label="Loading restaurants" className="owner-restaurant-grid">
        <Skeleton style={{ height: "13rem" }} />
        <Skeleton style={{ height: "13rem" }} />
      </section>
    );
  }
  if (restaurants.length === 0) {
    return (
      <EmptyState
        action={{ label: "Create restaurant", onClick: () => navigate("/restaurants/new") }}
        description="Add your restaurant details, then build a menu and start receiving orders."
        title="Create your first restaurant"
      />
    );
  }

  return (
    <section className="owner-page">
      <header className="owner-page__header">
        <div>
          <p className="owner-page__eyebrow">Owner workspace</p>
          <h1>Restaurants</h1>
        </div>
        <Button onClick={() => navigate("/restaurants/new")}>Create restaurant</Button>
      </header>
      <div className="owner-restaurant-grid">
        {restaurants.map((restaurant) => (
          <Card className="owner-restaurant-card" key={restaurant.id}>
            {restaurant.image ? (
              <img alt="" src={restaurant.image} />
            ) : (
              <div className="owner-image-placeholder" aria-hidden="true" />
            )}
            <div className="owner-restaurant-card__body">
              <p className="owner-page__eyebrow">{restaurant.category.name}</p>
              <h2>{restaurant.name}</h2>
              <p>{restaurant.address}</p>
              <p>
                Created <DateTime value={restaurant.createdAt} />
              </p>
              {restaurant.promotedUntil ? (
                <p>
                  Promoted until <DateTime value={restaurant.promotedUntil} />
                </p>
              ) : null}
              <div className="owner-card-actions">
                <Button onClick={() => navigate(`/restaurants/${restaurant.id}`)}>
                  Open restaurant
                </Button>
                <Button
                  onClick={() => navigate(`/restaurants/${restaurant.id}/menu`)}
                  variant="secondary"
                >
                  Manage menu
                </Button>
                <Button
                  onClick={() => navigate(`/restaurants/${restaurant.id}/settings`)}
                  variant="tertiary"
                >
                  Settings
                </Button>
                <Button
                  onClick={() => navigate(`/restaurants/${restaurant.id}/promotion`)}
                  variant="tertiary"
                >
                  Promotion
                </Button>
                <Button onClick={() => setDeleteTarget(restaurant)} variant="danger">
                  Delete restaurant
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
        title="Delete this restaurant?"
        description="This permanently removes the restaurant and its menu. This action can’t be undone."
        footer={
          <>
            <Button disabled={deleting} onClick={() => setDeleteTarget(null)} variant="secondary">
              Cancel
            </Button>
            <Button loading={deleting} onClick={() => void remove()} variant="danger">
              Delete restaurant
            </Button>
          </>
        }
      >
        {deleteError ? (
          <p role="alert">{deleteError}</p>
        ) : (
          <p>Past orders will keep their saved item snapshots.</p>
        )}
      </Modal>
    </section>
  );
}

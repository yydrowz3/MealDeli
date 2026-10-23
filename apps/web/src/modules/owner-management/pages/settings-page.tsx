import { useSetAtom } from "jotai";
import { useEffect, useState } from "react";

import type { MediaUploader } from "../../media";
import { Button, Card, ErrorState, Modal, Skeleton } from "../../../shared/ui";
import { RestaurantSettingsForm } from "../components/restaurant-settings-form";
import {
  selectAfterOwnerRestaurantDeleteAtom,
  setSelectedOwnerRestaurantAtom,
} from "../model/selection-atoms";
import type { OwnerRestaurant, OwnerRestaurantRepository } from "../model/types";

export type OwnerRestaurantSettingsPageProps = Readonly<{
  restaurantId: string;
  repository: OwnerRestaurantRepository;
  uploader?: MediaUploader;
  navigate: (path: string) => void;
  onDirtyChange?: (dirty: boolean) => void;
}>;

export function OwnerRestaurantSettingsPage({
  restaurantId,
  repository,
  uploader,
  navigate,
  onDirtyChange,
}: OwnerRestaurantSettingsPageProps) {
  const [restaurant, setRestaurant] = useState<OwnerRestaurant | null | undefined>(undefined);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const select = useSetAtom(setSelectedOwnerRestaurantAtom);
  const selectAfterDelete = useSetAtom(selectAfterOwnerRestaurantDeleteAtom);
  useEffect(() => {
    let active = true;
    void repository
      .get(restaurantId)
      .then((next) => {
        if (!active) return;
        setRestaurant(next);
        if (next) select(next.id);
      })
      .catch(() => active && setRestaurant(null));
    return () => {
      active = false;
    };
  }, [repository, restaurantId, select]);
  const remove = async () => {
    if (deleting) return;
    setDeleting(true);
    setDeleteError(null);
    const result = await repository.delete(restaurantId);
    if (!result.ok) {
      setDeleteError(result.message);
      setDeleting(false);
      return;
    }
    const remaining = await repository.list();
    selectAfterDelete({
      deletedRestaurantId: restaurantId,
      remainingRestaurantIds: remaining.map((item) => item.id),
    });
    navigate("/restaurants");
  };
  if (restaurant === undefined) return <Skeleton style={{ height: "28rem" }} />;
  if (restaurant === null) return <ErrorState title="Restaurant not found." />;
  return (
    <section className="owner-page owner-page--narrow">
      <header className="owner-page__header">
        <div>
          <p className="owner-page__eyebrow">{restaurant.name}</p>
          <h1>Restaurant settings</h1>
        </div>
      </header>
      <RestaurantSettingsForm
        onDirtyChange={onDirtyChange}
        onSubmit={async (draft) => {
          const result = await repository.update(restaurant.id, draft);
          if (result.ok) setRestaurant(result.value);
          return result;
        }}
        restaurant={restaurant}
        uploader={uploader}
      />
      <Card className="owner-danger-zone">
        <h2>Danger zone</h2>
        <p>Deleting a restaurant permanently removes its menu. Past orders are not changed.</p>
        <Button onClick={() => setConfirmDelete(true)} variant="danger">
          Delete restaurant
        </Button>
      </Card>
      <Modal
        dismissible={!deleting}
        footer={
          <>
            <Button disabled={deleting} onClick={() => setConfirmDelete(false)} variant="secondary">
              Cancel
            </Button>
            <Button loading={deleting} onClick={() => void remove()} variant="danger">
              Delete restaurant
            </Button>
          </>
        }
        onClose={() => setConfirmDelete(false)}
        open={confirmDelete}
        title="Delete this restaurant?"
        description="This permanently removes the restaurant and its menu. This action can’t be undone."
      >
        {deleteError ? (
          <p role="alert">{deleteError}</p>
        ) : (
          <p>Past orders keep their saved snapshots.</p>
        )}
      </Modal>
    </section>
  );
}

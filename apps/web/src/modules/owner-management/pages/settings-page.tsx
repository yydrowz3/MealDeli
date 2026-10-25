import { errorMessage, useI18n } from "../../../shared/i18n";
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
  const { t, text } = useI18n();
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
      setDeleteError(errorMessage(result.message, "owner.deleteFailed"));
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
  if (restaurant === undefined) return <Skeleton className="h-112" />;
  if (restaurant === null) return <ErrorState title={t("common.restaurantNotFound")} />;
  return (
    <section className="mx-auto grid max-w-200 gap-6 p-4 md:p-6">
      <header className="grid gap-4 md:flex md:items-center md:justify-between">
        <div>
          <p className="text-small text-muted font-bold uppercase">
            {text(restaurant.name)}
          </p>
          <h1>{t("owner.restaurantSettings")}</h1>
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
      <Card className="mt-8 grid gap-3">
        <h2>{t("owner.dangerZone")}</h2>
        <p>{t("owner.deleteWarning")}</p>
        <Button onClick={() => setConfirmDelete(true)} variant="danger">
          {t("owner.deleteRestaurant")}
        </Button>
      </Card>
      <Modal
        dismissible={!deleting}
        footer={
          <>
            <Button disabled={deleting} onClick={() => setConfirmDelete(false)} variant="secondary">
              {t("common.cancel")}
            </Button>
            <Button loading={deleting} onClick={() => void remove()} variant="danger">
              {t("owner.deleteRestaurant")}
            </Button>
          </>
        }
        onClose={() => setConfirmDelete(false)}
        open={confirmDelete}
        title={t("owner.confirmDeleteRestaurant")}
        description={t("owner.deleteRestaurantHelp")}
      >
        {deleteError ? <p role="alert">{text(deleteError)}</p> : <p>{t("owner.savedSnapshots")}</p>}
      </Modal>
    </section>
  );
}

import { errorMessage, useI18n } from "../../../shared/i18n";
import { useSetAtom } from "jotai";
import { useEffect, useState } from "react";

import type { Dish } from "../../catalog";
import type { MediaUploader } from "../../media";
import {
  Button,
  Card,
  Drawer,
  EmptyState,
  ErrorState,
  Modal,
  Money,
  Skeleton,
} from "../../../shared/ui";
import { DishForm } from "../components/dish-form";
import { setSelectedOwnerRestaurantAtom } from "../model/selection-atoms";
import type { OwnerRestaurant, OwnerRestaurantRepository } from "../model/types";

export type OwnerMenuPageProps = Readonly<{
  restaurantId: string;
  repository: OwnerRestaurantRepository;
  uploader?: MediaUploader;
}>;

export function OwnerMenuPage({ restaurantId, repository, uploader }: OwnerMenuPageProps) {
  const { t, text } = useI18n();
  const [restaurant, setRestaurant] = useState<OwnerRestaurant | null | undefined>(undefined);
  const [editor, setEditor] = useState<Dish | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Dish | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const select = useSetAtom(setSelectedOwnerRestaurantAtom);
  useEffect(() => {
    let active = true;
    void repository
      .get(restaurantId)
      .then((next) => {
        if (!active) return;
        setRestaurant(next);
        if (next) select(next.id);
      })
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, [repository, restaurantId, select]);

  const remove = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    const result = await repository.deleteDish(deleteTarget.id, restaurantId);
    if (!result.ok) {
      setDeleteError(errorMessage(result.message, "owner.deleteDishFailed"));
      setDeleting(false);
      return;
    }
    setRestaurant(result.value);
    setDeleteTarget(null);
    setDeleting(false);
  };

  if (error) return <ErrorState title={t("owner.loadMenuFailed")} />;
  if (restaurant === undefined) return <Skeleton className="h-120" />;
  if (restaurant === null) return <ErrorState title={t("common.restaurantNotFound")} />;
  const editingDish = editor === "new" || editor === null ? undefined : editor;
  return (
    <section className="mx-auto grid max-w-360 gap-6 p-4 md:p-6">
      <header className="grid gap-4 md:flex md:items-center md:justify-between">
        <div>
          <p className="text-small text-muted font-bold uppercase">
            {text(restaurant.name)}
          </p>
          <h1>{t("common.menu")}</h1>
        </div>
        <Button className="max-md:w-full" onClick={() => setEditor("new")}>
          {t("owner.addDish")}
        </Button>
      </header>
      {restaurant.dishes.length === 0 ? (
        <EmptyState
          action={{ label: t("owner.addDish"), onClick: () => setEditor("new") }}
          description={t("owner.emptyMenuHelp")}
          title={t("owner.emptyMenu")}
        />
      ) : (
        <div className="grid gap-3">
          {restaurant.dishes.map((dish) => (
            <Card className="grid gap-4 md:flex md:items-center md:justify-between" key={dish.id}>
              {dish.image ? (
                <img
                  alt=""
                  className="h-40 w-full flex-none rounded-control object-cover md:h-28 md:w-36"
                  src={dish.image}
                />
              ) : (
                <div
                  className="h-40 w-full flex-none rounded-control bg-neutral-soft md:h-28 md:w-36"
                  aria-hidden="true"
                />
              )}
              <div>
                <h2>{text(dish.name)}</h2>
                <p>{text(dish.description)}</p>
                <p>
                  <Money minor={dish.priceMinor} /> ·{" "}
                  {t("owner.optionCount", { count: dish.options.length })}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => setEditor(dish)} variant="secondary">
                  {t("common.edit")}
                </Button>
                <Button onClick={() => setDeleteTarget(dish)} variant="danger">
                  {t("common.delete")}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Drawer
        onClose={() => setEditor(null)}
        open={editor !== null}
        title={text(
          editingDish ? t("owner.editName", { name: editingDish.name }) : t("owner.addDish"),
        )}
      >
        {editor !== null ? (
          <DishForm
            dish={editingDish}
            onCancel={() => setEditor(null)}
            onSubmit={(draft) =>
              editingDish
                ? repository.updateDish(editingDish.id, restaurantId, draft)
                : repository.createDish(restaurantId, draft)
            }
            onSuccess={(next) => {
              setRestaurant(next);
              setEditor(null);
            }}
            uploader={uploader}
          />
        ) : null}
      </Drawer>
      <Modal
        dismissible={!deleting}
        footer={
          <>
            <Button disabled={deleting} onClick={() => setDeleteTarget(null)} variant="secondary">
              {t("common.cancel")}
            </Button>
            <Button loading={deleting} onClick={() => void remove()} variant="danger">
              {t("owner.deleteDish")}
            </Button>
          </>
        }
        onClose={() => setDeleteTarget(null)}
        open={Boolean(deleteTarget)}
        title={t("owner.deleteName", { name: deleteTarget?.name ?? "dish" })}
        description={t("owner.deleteDishHelp")}
      >
        {deleteError ? <p role="alert">{text(deleteError)}</p> : null}
      </Modal>
    </section>
  );
}

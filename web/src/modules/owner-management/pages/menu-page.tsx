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
      setDeleteError(result.message);
      setDeleting(false);
      return;
    }
    setRestaurant(result.value);
    setDeleteTarget(null);
    setDeleting(false);
  };

  if (error) return <ErrorState title="We couldn’t load this menu." />;
  if (restaurant === undefined) return <Skeleton style={{ height: "30rem" }} />;
  if (restaurant === null) return <ErrorState title="Restaurant not found." />;
  const editingDish = editor === "new" || editor === null ? undefined : editor;
  return (
    <section className="owner-page">
      <header className="owner-page__header">
        <div>
          <p className="owner-page__eyebrow">{restaurant.name}</p>
          <h1>Menu</h1>
        </div>
        <Button onClick={() => setEditor("new")}>Add dish</Button>
      </header>
      {restaurant.dishes.length === 0 ? (
        <EmptyState
          action={{ label: "Add dish", onClick: () => setEditor("new") }}
          description="Add dishes so customers can place an order."
          title="Your menu is empty"
        />
      ) : (
        <div className="owner-menu-list">
          {restaurant.dishes.map((dish) => (
            <Card className="owner-dish-card" key={dish.id}>
              {dish.image ? (
                <img alt="" src={dish.image} />
              ) : (
                <div className="owner-image-placeholder" aria-hidden="true" />
              )}
              <div>
                <h2>{dish.name}</h2>
                <p>{dish.description}</p>
                <p>
                  <Money minor={dish.priceMinor} /> · {dish.options.length} options
                </p>
              </div>
              <div className="owner-card-actions">
                <Button onClick={() => setEditor(dish)} variant="secondary">
                  Edit
                </Button>
                <Button onClick={() => setDeleteTarget(dish)} variant="danger">
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Drawer
        onClose={() => setEditor(null)}
        open={editor !== null}
        title={editingDish ? `Edit ${editingDish.name}` : "Add dish"}
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
              Cancel
            </Button>
            <Button loading={deleting} onClick={() => void remove()} variant="danger">
              Delete dish
            </Button>
          </>
        }
        onClose={() => setDeleteTarget(null)}
        open={Boolean(deleteTarget)}
        title={`Delete ${deleteTarget?.name ?? "dish"}?`}
        description="This removes the dish from the current menu. Past orders are not changed."
      >
        {deleteError ? <p role="alert">{deleteError}</p> : null}
      </Modal>
    </section>
  );
}

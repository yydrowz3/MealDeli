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
  if (restaurant === undefined) return <Skeleton className="h-120" />;
  if (restaurant === null) return <ErrorState title="Restaurant not found." />;
  const editingDish = editor === "new" || editor === null ? undefined : editor;
  return (
    <section className="mx-auto grid max-w-360 gap-6 p-6 [@media(max-width:47.99rem)]:p-4">
      <header className="flex items-center justify-between gap-4 [@media(max-width:47.99rem)]:grid [@media(max-width:47.99rem)]:items-stretch [@media(max-width:47.99rem)]:grid-cols-[1fr]">
        <div>
          <p className="m-0 [color:var(--color-text-muted)] [font-size:var(--font-size-sm)] font-bold tracking-[0.08em] uppercase">
            {restaurant.name}
          </p>
          <h1 className="m-0">Menu</h1>
        </div>
        <Button className="[@media(max-width:47.99rem)]:w-full" onClick={() => setEditor("new")}>
          Add dish
        </Button>
      </header>
      {restaurant.dishes.length === 0 ? (
        <EmptyState
          action={{ label: "Add dish", onClick: () => setEditor("new") }}
          description="Add dishes so customers can place an order."
          title="Your menu is empty"
        />
      ) : (
        <div className="grid gap-3">
          {restaurant.dishes.map((dish) => (
            <Card
              className="flex items-center justify-between gap-4 [@media(max-width:47.99rem)]:grid [@media(max-width:47.99rem)]:items-stretch [@media(max-width:47.99rem)]:grid-cols-[1fr]"
              key={dish.id}
            >
              {dish.image ? (
                <img
                  alt=""
                  className="h-28 w-36 flex-none rounded-[var(--radius-md)] object-cover [@media(max-width:47.99rem)]:h-40 [@media(max-width:47.99rem)]:w-full"
                  src={dish.image}
                />
              ) : (
                <div
                  className="h-28 min-h-24 w-36 flex-none rounded-[var(--radius-md)] object-cover [background:linear-gradient(135deg,var(--color-surface-muted),var(--color-border))] [@media(max-width:47.99rem)]:h-40 [@media(max-width:47.99rem)]:w-full"
                  aria-hidden="true"
                />
              )}
              <div>
                <h2>{dish.name}</h2>
                <p>{dish.description}</p>
                <p>
                  <Money minor={dish.priceMinor} /> · {dish.options.length} options
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
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

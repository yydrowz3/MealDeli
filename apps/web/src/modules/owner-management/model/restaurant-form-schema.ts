import { z } from "zod";

const trimmedRequired = (label: string) =>
  z
    .string()
    .transform((value) => value.trim())
    .pipe(z.string().min(1, `${label} is required.`));

const optionalImageSchema = z.union([z.url("Enter a valid image URL."), z.null()]);

export const restaurantDraftSchema = z.object({
  name: trimmedRequired("Restaurant name"),
  categoryId: z.uuid("Choose a category."),
  address: trimmedRequired("Address"),
  image: optionalImageSchema,
});

export const restaurantSettingsSchema = restaurantDraftSchema.omit({ categoryId: true });

export type RestaurantFormValues = z.input<typeof restaurantDraftSchema>;
export type RestaurantSettingsFormValues = z.input<typeof restaurantSettingsSchema>;

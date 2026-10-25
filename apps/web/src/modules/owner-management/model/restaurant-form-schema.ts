import { message as localizedMessage } from "../../../shared/i18n";
import { z } from "zod";

const trimmedRequired = (error: string) =>
  z
    .string()
    .transform((value) => value.trim())
    .pipe(z.string().min(1, error));

const optionalImageSchema = z.union([z.url(localizedMessage("common.imageUrl")), z.null()]);

export const restaurantDraftSchema = z.object({
  name: trimmedRequired(localizedMessage("owner.restaurantNameRequired")),
  categoryId: z.uuid(localizedMessage("owner.categoryRequired")),
  address: trimmedRequired(localizedMessage("owner.addressRequired")),
  image: optionalImageSchema,
});

export const restaurantSettingsSchema = restaurantDraftSchema.omit({ categoryId: true });

export type RestaurantFormValues = z.input<typeof restaurantDraftSchema>;
export type RestaurantSettingsFormValues = z.input<typeof restaurantSettingsSchema>;

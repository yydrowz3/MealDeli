import { formOptions } from "@tanstack/react-form";
import { z } from "zod";

export const catalogSearchFormSchema = z.object({
  query: z.string().trim().max(100, "Use 100 characters or fewer."),
});

export type CatalogSearchFormValues = z.infer<typeof catalogSearchFormSchema>;

export function createCatalogSearchFormOptions(defaultQuery = "") {
  return formOptions({
    defaultValues: { query: defaultQuery } satisfies CatalogSearchFormValues,
    validators: {
      onChange: catalogSearchFormSchema,
      onSubmit: catalogSearchFormSchema,
    },
  });
}

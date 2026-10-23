import { useForm } from "@tanstack/react-form";
import { useEffect, useRef } from "react";

import { Button, Input } from "../../../shared/ui";
import {
  catalogSearchFormSchema,
  createCatalogSearchFormOptions,
} from "../forms/search-form-options";

export type CatalogSearchFormProps = {
  query?: string;
  onSearch: (query: string) => void;
  debounceMs?: number;
};

function firstError(errors: unknown[]): string | undefined {
  for (const error of errors) {
    if (typeof error === "string") return error;
    if (error && typeof error === "object" && "message" in error) {
      const message = (error as { message?: unknown }).message;
      if (typeof message === "string") return message;
    }
  }
  return undefined;
}

export function CatalogSearchForm({ query, onSearch, debounceMs = 300 }: CatalogSearchFormProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;

  const form = useForm({
    ...createCatalogSearchFormOptions(query ?? ""),
    onSubmit: ({ value }) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      onSearchRef.current(value.query);
    },
  });

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    form.reset({ query: query ?? "" });
  }, [form, query]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const scheduleSearch = (value: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const result = catalogSearchFormSchema.safeParse({ query: value });
      if (result.success) onSearchRef.current(result.data.query);
    }, debounceMs);
  };

  return (
    <form
      className="catalog-search"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
      role="search"
    >
      <form.Field name="query">
        {(field) => (
          <Input
            autoComplete="off"
            error={firstError(field.state.meta.errors)}
            label="Search restaurants"
            onBlur={field.handleBlur}
            onChange={(event) => {
              field.handleChange(event.target.value);
              scheduleSearch(event.target.value);
            }}
            placeholder="Search restaurants"
            value={field.state.value}
          />
        )}
      </form.Field>
      <Button type="submit">Search</Button>
      <form.Subscribe selector={(state) => state.values.query}>
        {(value) =>
          value ? (
            <Button
              onClick={() => {
                if (timerRef.current) clearTimeout(timerRef.current);
                form.reset({ query: "" });
                onSearchRef.current("");
              }}
              type="button"
              variant="tertiary"
            >
              Clear
            </Button>
          ) : null
        }
      </form.Subscribe>
    </form>
  );
}

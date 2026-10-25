import { message as localizedMessage } from "../../../shared/i18n";
import { formOptions } from "@tanstack/react-form";
import { z } from "zod";

export const checkoutAddressSchema = z.object({
  address: z.string().trim().min(1, localizedMessage("checkout.addressRequired")).max(500),
});

export type CheckoutAddressValues = z.infer<typeof checkoutAddressSchema>;

export function createCheckoutAddressFormOptions(address = "") {
  return formOptions({
    defaultValues: { address } satisfies CheckoutAddressValues,
    validators: { onBlur: checkoutAddressSchema, onSubmit: checkoutAddressSchema },
  });
}

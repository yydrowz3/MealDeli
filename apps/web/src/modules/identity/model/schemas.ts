import { message as localizedMessage } from "../../../shared/i18n";
import { z } from "zod";

import type { UserRole } from "./types";

const normalizedEmail = z
  .string()
  .trim()
  .max(255, localizedMessage("identity.max255"))
  .email(localizedMessage("identity.validEmail"))
  .transform((value) => value.toLowerCase());

export const loginSchema = z.object({
  email: normalizedEmail,
  password: z.string().min(1, localizedMessage("identity.passwordRequired")),
});

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, localizedMessage("identity.nameRequired"))
    .max(100, localizedMessage("common.max100")),
  email: normalizedEmail,
  password: z
    .string()
    .min(8, localizedMessage("identity.passwordMin"))
    .max(128, localizedMessage("identity.passwordMax")),
  role: z.enum(["CUSTOMER", "OWNER", "COURIER"], {
    error: localizedMessage("identity.roleRequired"),
  }),
  demoAcknowledged: z.literal(true, {
    error: localizedMessage("identity.demoRequired"),
  }),
});

export const resendSchema = z.object({ email: normalizedEmail });

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, localizedMessage("identity.nameRequired"))
    .max(100, localizedMessage("common.max100")),
  email: normalizedEmail,
  address: z
    .string()
    .trim()
    .max(500, localizedMessage("identity.max500"))
    .transform((value) => value || null),
  image: z.string().url(localizedMessage("identity.validImageUrl")).nullable(),
  password: z
    .string()
    .max(128, localizedMessage("identity.passwordMax"))
    .refine(
      (value) => value.length === 0 || value.length >= 8,
      localizedMessage("identity.passwordMin"),
    ),
});

export type LoginFormValues = z.input<typeof loginSchema>;
export type SignupFormValues = {
  name: string;
  email: string;
  password: string;
  role: UserRole | "";
  demoAcknowledged: boolean;
};
export type ResendFormValues = z.input<typeof resendSchema>;
export type ProfileFormValues = z.input<typeof profileSchema>;

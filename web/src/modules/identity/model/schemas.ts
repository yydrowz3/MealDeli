import { z } from "zod";

import type { UserRole } from "./types";

const normalizedEmail = z
  .string()
  .trim()
  .max(255, "Use 255 characters or fewer.")
  .email("Enter a valid email address.")
  .transform((value) => value.toLowerCase());

export const loginSchema = z.object({
  email: normalizedEmail,
  password: z.string().min(1, "Enter your password."),
});

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Enter your full name.").max(100, "Use 100 characters or fewer."),
  email: normalizedEmail,
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .max(128, "Use 128 characters or fewer."),
  role: z.enum(["CUSTOMER", "OWNER", "COURIER"], {
    error: "Choose how you want to use MealDeli.",
  }),
  demoAcknowledged: z.literal(true, {
    error: "Confirm that you understand this is a demo account.",
  }),
});

export const resendSchema = z.object({ email: normalizedEmail });

export const profileSchema = z.object({
  name: z.string().trim().min(1, "Enter your full name.").max(100, "Use 100 characters or fewer."),
  email: normalizedEmail,
  address: z
    .string()
    .trim()
    .max(500, "Use 500 characters or fewer.")
    .transform((value) => value || null),
  image: z.string().url("Use a valid image URL.").nullable(),
  password: z
    .string()
    .max(128, "Use 128 characters or fewer.")
    .refine((value) => value.length === 0 || value.length >= 8, "Use at least 8 characters."),
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

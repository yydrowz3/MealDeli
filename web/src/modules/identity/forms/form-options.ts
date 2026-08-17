import { formOptions } from "@tanstack/react-form";

import {
  loginSchema,
  profileSchema,
  resendSchema,
  signupSchema,
  type LoginFormValues,
  type ProfileFormValues,
  type ResendFormValues,
  type SignupFormValues,
} from "../model/schemas";
import type { SessionUser, UserRole } from "../model/types";

export function createLoginFormOptions(defaultValues?: Partial<LoginFormValues>) {
  return formOptions({
    defaultValues: { email: "", password: "", ...defaultValues } satisfies LoginFormValues,
    validators: { onBlur: loginSchema, onSubmit: loginSchema },
  });
}

export function createSignupFormOptions(
  role: UserRole | null = null,
  defaultValues?: Partial<SignupFormValues>,
) {
  return formOptions({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: role ?? "",
      demoAcknowledged: false,
      ...defaultValues,
    } satisfies SignupFormValues,
    validators: { onBlur: signupSchema, onSubmit: signupSchema },
  });
}

export function createResendFormOptions(defaultValues?: Partial<ResendFormValues>) {
  return formOptions({
    defaultValues: { email: "", ...defaultValues } satisfies ResendFormValues,
    validators: { onBlur: resendSchema, onSubmit: resendSchema },
  });
}

export function createProfileFormOptions(
  user?: SessionUser,
  defaultValues?: Partial<ProfileFormValues>,
) {
  return formOptions({
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      address: user?.address ?? "",
      image: user?.image ?? null,
      password: "",
      ...defaultValues,
    } satisfies ProfileFormValues,
    validators: { onBlur: profileSchema, onSubmit: profileSchema },
  });
}

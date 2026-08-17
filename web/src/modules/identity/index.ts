import "./identity.css";

export { createIdentityRepository, adaptIdentitySessionUser } from "./api/identity-repository";
export type { IdentityGraphqlClient } from "./api/identity-repository";
export { LoginForm } from "./components/login-form";
export type { LoginFormProps } from "./components/login-form";
export { SignupForm } from "./components/signup-form";
export type { SignupFormProps } from "./components/signup-form";
export { ResendForm } from "./components/resend-form";
export type { ResendFormProps } from "./components/resend-form";
export { CheckEmail } from "./components/check-email";
export type { CheckEmailProps } from "./components/check-email";
export { ProfileForm } from "./components/profile-form";
export type { ProfileFormProps } from "./components/profile-form";
export {
  createLoginFormOptions,
  createSignupFormOptions,
  createResendFormOptions,
  createProfileFormOptions,
} from "./forms/form-options";
export { loginSchema, signupSchema, resendSchema, profileSchema } from "./model/schemas";
export type {
  LoginFormValues,
  SignupFormValues,
  ResendFormValues,
  ProfileFormValues,
} from "./model/schemas";
export {
  identityAtom,
  sessionUserAtom,
  accessTokenAtom,
  bootstrapSessionAtom,
  setAuthenticatedAtom,
  setSessionUserAtom,
  clearSessionAtom,
  configureIdentityRepositoryAtom,
  createIdentityTestStore,
} from "./model/session-atoms";
export type { JotaiStore } from "./model/session-atoms";
export {
  getRoleHome,
  parseSignupRole,
  canRoleAccessPath,
  getSafeReturnTo,
  getVerificationGate,
} from "./model/access-policy";
export type { VerificationGateResult } from "./model/access-policy";
export { logoutLocallyFirst } from "./model/logout";
export { createIdentityMediaAuthPort } from "./model/media-auth-port";
export type {
  UserRole,
  SessionUser,
  SessionStatus,
  IdentitySnapshot,
  IdentityErrorCode,
  CommandResult,
  SignUpCommand,
  ProfileCommand,
  IdentityRepository,
} from "./model/types";
export { LoginPage } from "./pages/login-page";
export type { LoginPageProps } from "./pages/login-page";
export { SignupPage } from "./pages/signup-page";
export type { SignupPageProps } from "./pages/signup-page";
export { VerifyEmailPage } from "./pages/verify-email-page";
export type { VerifyEmailPageProps } from "./pages/verify-email-page";
export { ProfilePage } from "./pages/profile-page";
export type { ProfilePageProps } from "./pages/profile-page";

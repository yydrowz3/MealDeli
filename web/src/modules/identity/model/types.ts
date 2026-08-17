export type UserRole = "CUSTOMER" | "OWNER" | "COURIER";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  verifiedAt: string | null;
  address: string | null;
  image: string | null;
};

export type SessionStatus = "idle" | "checking" | "authenticated" | "anonymous" | "expired";

export type IdentitySnapshot = {
  status: SessionStatus;
  accessToken: string | null;
  user: SessionUser | null;
};

export type IdentityErrorCode =
  | "INVALID_CREDENTIALS"
  | "DUPLICATE_EMAIL"
  | "INVALID_VERIFICATION"
  | "NETWORK"
  | "UNAUTHORIZED"
  | "UNKNOWN";

export type CommandResult<T = undefined> =
  | { ok: true; value: T }
  | { ok: false; code: IdentityErrorCode; message: string };

export type SignUpCommand = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

export type ProfileCommand = {
  name: string;
  email?: string;
  address: string | null;
  image: string | null;
  password?: string;
};

export interface IdentityRepository {
  refreshAccessToken(): Promise<CommandResult<string>>;
  me(accessToken: string): Promise<CommandResult<SessionUser>>;
  signIn(input: { email: string; password: string }): Promise<CommandResult<string>>;
  signUp(input: SignUpCommand): Promise<CommandResult>;
  signOut(accessToken: string | null): Promise<CommandResult>;
  verifyEmail(token: string): Promise<CommandResult>;
  resendVerification(email: string): Promise<CommandResult>;
  editProfile(accessToken: string, input: ProfileCommand): Promise<CommandResult>;
}

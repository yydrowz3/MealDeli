import { SafeUser } from './user.types';

export enum UserOperationError {
  EmailAlreadyInUse = 'EMAIL_ALREADY_IN_USE',
  EmailUnchanged = 'EMAIL_UNCHANGED',
  PasswordUnchanged = 'PASSWORD_UNCHANGED',
  InvalidCurrentPassword = 'INVALID_CURRENT_PASSWORD',
  UserNotFound = 'USER_NOT_FOUND',
  ConcurrentModification = 'CONCURRENT_MODIFICATION',
  InvalidOrExpiredVerification = 'INVALID_OR_EXPIRED_VERIFICATION',
  VerificationDeliveryFailed = 'VERIFICATION_DELIVERY_FAILED',
}

export type UserOperationResult<T> =
  { ok: true; value: T } | { ok: false; error: UserOperationError };

export type UserMutationResult = UserOperationResult<SafeUser>;
export type EmptyUserOperationResult = UserOperationResult<undefined>;

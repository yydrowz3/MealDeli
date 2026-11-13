import { AuthenticatedPrincipal } from '@/auth/auth-principal';
import type { Request } from 'express';

export interface AuthenticatedHttpRequest extends Request {
  principal?: AuthenticatedPrincipal;
  accessTokenExpiresAtEpochSeconds?: number;
}

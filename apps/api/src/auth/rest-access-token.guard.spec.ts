import type { ExecutionContext } from '@nestjs/common';

jest.mock('../users/users.service', () => ({ UsersService: class {} }));

import { RestAccessTokenGuard } from './rest-access-token.guard';
import { AccessTokenVerifier } from './access-token-verifier';

function contextWithAuthorization(authorization?: string) {
  const request = { headers: { authorization } } as Record<string, unknown>;
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as ExecutionContext;
  return { context, request };
}

describe('RestAccessTokenGuard', () => {
  it('reads Bearer access tokens and attaches the verified session', async () => {
    const verified = { user: { id: 'user-id' }, sessionId: 'session-id' };
    const verifier = { verify: jest.fn().mockResolvedValue(verified) };
    const guard = new RestAccessTokenGuard(
      verifier as unknown as AccessTokenVerifier,
    );
    const { context, request } = contextWithAuthorization(
      'Bearer access-token',
    );

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(verifier.verify).toHaveBeenCalledWith('access-token');
    expect(request).toMatchObject(verified);
  });

  it.each([undefined, 'Basic value', 'Bearer'])(
    'passes malformed authorization %s to the verifier as missing',
    async (authorization) => {
      const verifier = {
        verify: jest.fn().mockRejectedValue(new Error('unauthorized')),
      };
      const guard = new RestAccessTokenGuard(
        verifier as unknown as AccessTokenVerifier,
      );
      const { context } = contextWithAuthorization(authorization);
      await expect(guard.canActivate(context)).rejects.toThrow('unauthorized');
      expect(verifier.verify).toHaveBeenCalledWith(undefined);
    },
  );
});

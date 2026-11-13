import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { PaymentsResolver } from './payments.resolver';
import { PaymentsService } from './payments.service';
import { makeUser } from '../../test/fixtures';

describe('PaymentsResolver', () => {
  let resolver: PaymentsResolver;
  const createPayment = vi.fn<PaymentsService['createPayment']>();
  const getPayments = vi.fn<PaymentsService['getPayments']>();
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PaymentsResolver,
        { provide: PaymentsService, useValue: { createPayment, getPayments } },
      ],
    }).compile();
    resolver = module.get(PaymentsResolver);
    await module.close();
  });
  it('forwards the owner and transaction unchanged', async () => {
    const owner = makeUser();
    const input = { transactionId: 'tx-id', restaurantId: 'restaurant-id' };
    createPayment.mockResolvedValue({ ok: false, error: 'duplicate' });
    await expect(resolver.createPayment(owner, input)).resolves.toEqual({
      ok: false,
      error: 'duplicate',
    });
    expect(createPayment).toHaveBeenCalledWith(owner, input);
  });
  it('loads only the current owner history', async () => {
    getPayments.mockResolvedValue({ ok: true, payments: [] });
    await expect(resolver.getPayments(makeUser())).resolves.toEqual({
      ok: true,
      payments: [],
    });
    expect(getPayments).toHaveBeenCalledWith(makeUser());
  });
});

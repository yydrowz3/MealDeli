import { Test, TestingModule } from '@nestjs/testing';
import { OrdersResolver } from './orders.resolver';
import { OrdersService } from './orders.service';

describe('OrdersResolver', () => {
  let resolver: OrdersResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrdersResolver, OrdersService],
    }).compile();

    resolver = module.get<OrdersResolver>(OrdersResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});

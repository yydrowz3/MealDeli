import { OrderInputError } from '../domain/order-input.error';
import { BadRequestException } from '@nestjs/common';

export function parseOrderInput<T>(factory: () => T): T {
  try {
    return factory();
  } catch (error) {
    if (error instanceof OrderInputError) {
      throw new BadRequestException(error.message);
    }
    throw error;
  }
}
